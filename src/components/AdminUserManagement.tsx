import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AllowedUser {
  id: string;
  email: string;
  created_at: string;
  added_by: string;
}

const AdminUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadAllowedUsers();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadAllowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllowedUsers(data || []);
    } catch (error) {
      console.error('Error loading allowed users:', error);
      toast({
        title: "Error",
        description: "Failed to load allowed users.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAllowedUser = async () => {
    if (!user || !newUserEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);

    try {
      const { error } = await supabase
        .from('allowed_users')
        .insert({
          email: newUserEmail.toLowerCase().trim(),
          added_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "User Already Exists",
            description: "This email is already in the allowed users list.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "User Added",
        description: `${newUserEmail} has been added to the allowed users list.`,
      });

      setNewUserEmail("");
      loadAllowedUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeAllowedUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Removed",
        description: `${email} has been removed from the allowed users list.`,
      });

      loadAllowedUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>
          You do not have permission to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Allowed User
          </CardTitle>
          <CardDescription>
            Add users who are permitted to access the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                onKeyDown={(e) => e.key === 'Enter' && addAllowedUser()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addAllowedUser} 
                disabled={isAdding || !newUserEmail.trim()}
              >
                {isAdding ? "Adding..." : "Add User"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Allowed Users ({allowedUsers.length})
          </CardTitle>
          <CardDescription>
            Manage users who have access to the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : allowedUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No allowed users found. Add users above to grant website access.
            </div>
          ) : (
            <div className="space-y-2">
              {allowedUsers.map((allowedUser) => (
                <div
                  key={allowedUser.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{allowedUser.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Added on {new Date(allowedUser.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAllowedUser(allowedUser.id, allowedUser.email)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;