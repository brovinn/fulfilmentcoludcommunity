import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Shield, Mail, Calendar, User } from "lucide-react";
import { toast } from "sonner";

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
                User Accounts
              </CardTitle>
              <CardDescription>
                All registered users and their account details
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {users.length} Total Users
            </Badge>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userAccount) => (
                    <TableRow key={userAccount.id}>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserAccounts;
