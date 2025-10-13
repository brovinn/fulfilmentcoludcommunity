import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

const securityQuestions = [
  {
    id: "user_name",
    question: "Enter your full name:",
    type: "text",
    required: true
  },
  {
    id: "pastor_name",
    question: "Pastor's name:",
    type: "text",
    required: true
  },
  {
    id: "church_level",
    question: "Church level:",
    type: "radio",
    options: ["saint", "administrator"],
    required: true
  },
  {
    id: "admin_password",
    question: "Administrator Password:",
    type: "password",
    required: false,
    dependsOn: "church_level",
    dependsOnValue: "administrator"
  }
];

interface SecurityQuestionnaireProps {
  onComplete?: () => void;
}

const SecurityQuestionnaire = ({ onComplete }: SecurityQuestionnaireProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({
    church_level: "saint"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompletedThisWeek, setHasCompletedThisWeek] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkQuestionnaireStatus();
  }, [user]);

  const checkQuestionnaireStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_current_week_questionnaire_status', {
        _user_id: user.id
      });

      if (error) throw error;
      setHasCompletedThisWeek(data);
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Check required questions
    const requiredQuestions = securityQuestions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.some(q => !answers[q.id]);

    if (unansweredRequired) {
      toast({
        title: "Incomplete Form",
        description: "Please answer all required questions.",
        variant: "destructive"
      });
      return;
    }

    // Validate administrator password
    if (answers.church_level === "administrator") {
      if (!answers.admin_password || answers.admin_password !== "1369") {
        toast({
          title: "Invalid Administrator Password",
          description: "Incorrect administrator password. Access denied.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const weekNumber = Math.ceil(now.getTime() / (1000 * 60 * 60 * 24 * 7));
      const year = now.getFullYear();

      // Try to update existing record first, then insert if not exists
      const { data: existingData } = await supabase
        .from('security_questionnaires')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle();

      let error;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('security_questionnaires')
          .update({
            user_name: answers.user_name,
            pastor_name: "T.J Machote",
            church_level: answers.church_level,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('security_questionnaires')
          .insert({
            user_id: user.id,
            user_name: answers.user_name,
            pastor_name: "T.J Machote",
            church_level: answers.church_level,
            week_number: weekNumber,
            year: year
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Security Questionnaire Completed",
        description: "Thank you for completing this week's security check.",
      });

      setHasCompletedThisWeek(true);
      onComplete?.();
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit questionnaire. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading security questionnaire...</div>
        </CardContent>
      </Card>
    );
  }

  if (hasCompletedThisWeek) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Security Check Complete</CardTitle>
          <CardDescription>
            You have already completed this week's security questionnaire. Thank you for staying vigilant!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <CardTitle>Weekly Security Questionnaire</CardTitle>
        <CardDescription>
          Please complete this week's security check to ensure your account safety.
          All questions are required except for additional comments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {securityQuestions.map((question) => {
          // Hide dependent questions if condition not met
          if (question.dependsOn && answers[question.dependsOn] !== question.dependsOnValue) {
            return null;
          }

          return (
            <div key={question.id} className="space-y-3">
              <Label className="text-sm font-medium">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            
            {question.type === 'text' && (
              <Input
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder=""
              />
            )}

            {question.type === 'radio' && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
              >
                {question.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'password' && (
              <Input
                type="password"
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder=""
              />
            )}
            
            {question.type === 'textarea' && (
              <Textarea
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Enter any additional security concerns or comments..."
                className="min-h-[100px]"
              />
            )}
            </div>
          );
        })}
        
        <div className="flex gap-4">
          <Button 
            onClick={async () => {
              const saintAnswers = { 
                ...answers, 
                church_level: "saint",
                pastor_name: "T.J Machote",
                user_name: answers.user_name || "Guest User"
              };
              setAnswers(saintAnswers);
              
              setIsSubmitting(true);
              try {
                const now = new Date();
                const weekNumber = Math.ceil(now.getTime() / (1000 * 60 * 60 * 24 * 7));
                const year = now.getFullYear();

                // Try to update existing record first, then insert if not exists
                const { data: existingData } = await supabase
                  .from('security_questionnaires')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('week_number', weekNumber)
                  .eq('year', year)
                  .maybeSingle();

                let error;
                if (existingData) {
                  // Update existing record
                  const { error: updateError } = await supabase
                    .from('security_questionnaires')
                    .update({
                      user_name: saintAnswers.user_name || "Guest User",
                      pastor_name: "T.J Machote",
                      church_level: "saint",
                      completed_at: new Date().toISOString()
                    })
                    .eq('id', existingData.id);
                  error = updateError;
                } else {
                  // Insert new record
                  const { error: insertError } = await supabase
                    .from('security_questionnaires')
                    .insert({
                      user_id: user.id,
                      user_name: saintAnswers.user_name || "Guest User",
                      pastor_name: "T.J Machote",
                      church_level: "saint",
                      week_number: weekNumber,
                      year: year
                    });
                  error = insertError;
                }

                if (error) throw error;

                toast({
                  title: "Welcome Saint",
                  description: "You have been granted saint level access.",
                });

                setHasCompletedThisWeek(true);
                onComplete?.();
              } catch (error) {
                console.error('Error submitting questionnaire:', error);
                toast({
                  title: "Submission Failed",
                  description: "Failed to submit questionnaire. Please try again.",
                  variant: "destructive"
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Continue as Saint
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Security Questionnaire"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityQuestionnaire;