-- Fix security issues with messages table - restrict update/delete to message owners only
DROP POLICY IF EXISTS "Authenticated users can update all messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can delete all messages" ON public.messages;

-- Create proper policies for messages table
CREATE POLICY "Users can update own messages only" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages only" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix donations table security - restrict access to admins only for sensitive data
DROP POLICY IF EXISTS "Users can view only their own donations" ON public.donations;

-- Create more restrictive donations policies
CREATE POLICY "Users can view their own donations only" 
ON public.donations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations" 
ON public.donations 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $function$
  SELECT public.has_role(_user_id, 'admin')
$function$;