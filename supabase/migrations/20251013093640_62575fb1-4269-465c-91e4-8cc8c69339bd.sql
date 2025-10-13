-- Update is_user_allowed to allow all authenticated users (including Gmail users)
CREATE OR REPLACE FUNCTION public.is_user_allowed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Allow all authenticated users
  SELECT _user_id IS NOT NULL
$function$;