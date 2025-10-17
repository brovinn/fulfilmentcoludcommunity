-- Update is_admin function to check church_level from security_questionnaires
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  ) OR EXISTS (
    SELECT 1
    FROM public.security_questionnaires
    WHERE user_id = _user_id
      AND church_level = 'admin'
    ORDER BY created_at DESC
    LIMIT 1
  )
$$;