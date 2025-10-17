import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SecurityQuestionnaire from "./SecurityQuestionnaire";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";

interface SecurityWrapperProps {
  children: React.ReactNode;
}

const SecurityWrapper = ({ children }: SecurityWrapperProps) => {
  const { user, signOut } = useAuth();
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
      // Gate access based on allowed users (or admin override)
      const { data: allowed, error: allowedError } = await supabase.rpc('is_user_allowed', {
        _user_id: user.id
      });
      if (allowedError) throw allowedError;
      setIsUserAllowed(!!allowed);

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (adminError) throw adminError;
      setIsAdmin(adminData);

      // Check questionnaire status (optional, doesn't block access)
      const { data: questionnaireData, error: questionnaireError } = await supabase.rpc('get_current_week_questionnaire_status', {
        _user_id: user.id
      });

      if (!questionnaireError) {
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

  // If not allowed, block access with helpful UI
  if (isUserAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <Shield className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">
            Your account is not authorized to access this application. If you believe this is an error,
            please contact an administrator to be added to the allowed users list.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={async () => { await signOut(); }}>
              Sign out
            </Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  // Allowed users proceed to main app
  return <>{children}</>;
};

export default SecurityWrapper;