import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SecurityQuestionnaire from "./SecurityQuestionnaire";
import AdminUserManagement from "./AdminUserManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle } from "lucide-react";

interface SecurityWrapperProps {
  children: React.ReactNode;
}

const SecurityWrapper = ({ children }: SecurityWrapperProps) => {
  const { user } = useAuth();
  const [isUserAllowed, setIsUserAllowed] = useState<boolean | null>(null);
  const [hasCompletedWeeklyCheck, setHasCompletedWeeklyCheck] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserPermissions();
    }
  }, [user]);

  const checkUserPermissions = async () => {
    if (!user) return;

    try {
      // Check if user is allowed
      const { data: allowedData, error: allowedError } = await supabase.rpc('is_user_allowed', {
        _user_id: user.id
      });

      if (allowedError) throw allowedError;
      setIsUserAllowed(allowedData);

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (adminError) throw adminError;
      setIsAdmin(adminData);

      // Only check questionnaire status if user is allowed
      if (allowedData) {
        const { data: questionnaireData, error: questionnaireError } = await supabase.rpc('get_current_week_questionnaire_status', {
          _user_id: user.id
        });

        if (questionnaireError) throw questionnaireError;
        setHasCompletedWeeklyCheck(questionnaireData);
      }
    } catch (error) {
      console.error('Error checking user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireComplete = () => {
    setHasCompletedWeeklyCheck(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Checking security permissions...</p>
        </div>
      </div>
    );
  }

  // If user is not allowed to access the site
  if (isUserAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-center">
            <strong>Access Denied</strong>
            <br />
            Your account does not have permission to access this website. 
            Please contact an administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user hasn't completed weekly security check
  if (hasCompletedWeeklyCheck === false) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          {isAdmin ? (
            <Tabs defaultValue="questionnaire" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questionnaire">Security Check</TabsTrigger>
                <TabsTrigger value="admin">User Management</TabsTrigger>
              </TabsList>
              <TabsContent value="questionnaire" className="mt-6">
                <SecurityQuestionnaire onComplete={handleQuestionnaireComplete} />
              </TabsContent>
              <TabsContent value="admin" className="mt-6">
                <AdminUserManagement />
              </TabsContent>
            </Tabs>
          ) : (
            <SecurityQuestionnaire onComplete={handleQuestionnaireComplete} />
          )}
        </div>
      </div>
    );
  }

  // User is allowed and has completed security check - show main app
  return <>{children}</>;
};

export default SecurityWrapper;