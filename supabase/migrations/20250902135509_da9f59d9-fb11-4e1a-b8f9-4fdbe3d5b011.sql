-- Create security questionnaire table
CREATE TABLE public.security_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  questionnaire_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number, year)
);

-- Enable RLS
ALTER TABLE public.security_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create policies for security questionnaires
CREATE POLICY "Users can view their own questionnaires" 
ON public.security_questionnaires 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own questionnaires" 
ON public.security_questionnaires 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaires" 
ON public.security_questionnaires 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all questionnaires" 
ON public.security_questionnaires 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create allowed users table for admin management
CREATE TABLE public.allowed_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Create policies for allowed users
CREATE POLICY "Admins can manage allowed users" 
ON public.allowed_users 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_security_questionnaires_updated_at
BEFORE UPDATE ON public.security_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allowed_users_updated_at
BEFORE UPDATE ON public.allowed_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is allowed
CREATE OR REPLACE FUNCTION public.is_user_allowed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_users au
    JOIN auth.users u ON u.email = au.email
    WHERE u.id = _user_id
  ) OR public.is_admin(_user_id)
$function$;

-- Function to get current week questionnaire status
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
    AND week_number = EXTRACT(WEEK FROM now())::INTEGER
    AND year = EXTRACT(YEAR FROM now())::INTEGER
  )
$function$;