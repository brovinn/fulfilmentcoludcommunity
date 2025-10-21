import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Shield, Calendar, User, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserAccount {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  profile?: {
    display_name: string;
    avatar_url: string;
  };
  role?: string;
}

const AdminUserAccounts = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; displayName: string; role: string } | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, [user]);

  const checkAdminAndLoadUsers = async () => {
    if (!user) return;

    try {
      // Check admin status
      const { data: adminData, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (adminError) throw adminError;
      setIsAdmin(adminData);

      if (adminData) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Get all profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const userAccounts = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: '', // Email comes from auth.users which we can't query directly
          created_at: profile.created_at,
          last_sign_in_at: '',
          profile: {
            display_name: profile.display_name || 'Unknown User',
            avatar_url: profile.avatar_url || ''
          },
          role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(userAccounts);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load user accounts');
    }
  };

  const toggleAdminRole = async (userId: string, displayName: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
      }

      toast.success(`${displayName} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`);
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role.');
    } finally {
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const createNewUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Email and password are required');
      return;
    }

    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          displayName: newUserDisplayName || newUserEmail.split('@')[0],
          role: newUserRole,
          avatarUrl: newUserAvatarUrl || null
        }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        throw new Error('Failed to connect to user creation service');
      }

      // Check if the response contains an error
      if (data && data.error) {
        throw new Error(data.error);
      }

      // Check for success response
      if (!data || !data.success) {
        throw new Error('User creation failed - no success response');
      }

      toast.success(`User ${newUserEmail} created successfully and can now login!`);
      setIsCreateUserDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setNewUserRole('user');
      setNewUserAvatarUrl('');
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You must be an administrator to view user accounts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Accounts & Role Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and grant admin privileges
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg">
                {users.length} Total Users
              </Badge>
              <Badge variant="destructive" className="text-lg">
                <Shield className="h-4 w-4 mr-1" />
                {users.filter(u => u.role === 'admin').length} Admins
              </Badge>
              <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userAccount) => (
                    <TableRow 
                      key={userAccount.id}
                      className={userAccount.role === 'admin' ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userAccount.profile?.avatar_url ? (
                            <img 
                              src={userAccount.profile.avatar_url} 
                              alt="" 
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {userAccount.profile?.display_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userAccount.role || 'user')}>
                          {userAccount.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(userAccount.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {userAccount.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser({ 
                              id: userAccount.id, 
                              displayName: userAccount.profile?.display_name || 'User',
                              role: userAccount.role || 'user'
                            });
                            setIsRoleDialogOpen(true);
                          }}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          {userAccount.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.role === 'admin' ? 'Remove Admin Role' : 'Grant Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.role === 'admin' 
                ? `Are you sure you want to remove admin privileges from ${selectedUser?.displayName}? They will no longer have access to admin features.`
                : `Are you sure you want to grant admin privileges to ${selectedUser?.displayName}? They will have full access to all admin features including content management and user administration.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && toggleAdminRole(selectedUser.id, selectedUser.displayName, selectedUser.role)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user account to the system. They will receive access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Optional display name"
                value={newUserDisplayName}
                onChange={(e) => setNewUserDisplayName(e.target.value)}
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Profile Picture URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={newUserAvatarUrl}
                onChange={(e) => setNewUserAvatarUrl(e.target.value)}
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole} disabled={isCreatingUser}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateUserDialogOpen(false)}
              disabled={isCreatingUser}
            >
              Cancel
            </Button>
            <Button 
              onClick={createNewUser}
              disabled={isCreatingUser || !newUserEmail || !newUserPassword}
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserAccounts;
