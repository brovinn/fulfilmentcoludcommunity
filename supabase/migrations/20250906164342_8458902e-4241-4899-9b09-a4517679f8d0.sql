-- Fix the week calculation function to match frontend logic
CREATE OR REPLACE FUNCTION public.get_current_week_questionnaire_status(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.security_questionnaires
    WHERE user_id = _user_id
    AND week_number = CEIL(EXTRACT(EPOCH FROM now()) / (7 * 24 * 60 * 60))::INTEGER
    AND year = EXTRACT(YEAR FROM now())::INTEGER
  )
$function$;