import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SecurityQuestionnaire from "./SecurityQuestionnaire";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      // Allow all authenticated users
      setIsUserAllowed(true);

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

  // All authenticated users are allowed - show main app
  return <>{children}</>;
};

export default SecurityWrapper;