-- Update security questionnaire to use specific church security details
ALTER TABLE public.security_questionnaires DROP COLUMN questionnaire_data;

-- Add specific church security fields
ALTER TABLE public.security_questionnaires 
ADD COLUMN user_name text NOT NULL DEFAULT '',
ADD COLUMN pastor_name text NOT NULL DEFAULT 'TJ Machote',
ADD COLUMN church_level text NOT NULL DEFAULT 'saint' CHECK (church_level IN ('saint', 'administrator'));

-- Update the function to allow all users after signin (remove allowed_users requirement)
CREATE OR REPLACE FUNCTION public.is_user_allowed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow all authenticated users
  SELECT _user_id IS NOT NULL
$$;

-- Create video sessions table for live streaming
CREATE TABLE public.video_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  stream_key text NOT NULL UNIQUE,
  is_live boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  recording_url text,
  created_by_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on video sessions
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for video sessions - only administrators can manage
CREATE POLICY "Administrators can manage video sessions" 
ON public.video_sessions 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "All users can view live sessions" 
ON public.video_sessions 
FOR SELECT 
USING (is_live = true);

-- Create content moderation log for administrator actions
CREATE TABLE public.content_moderation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'delete_content', 'delete_comment', 'delete_message', etc.
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on moderation log
ALTER TABLE public.content_moderation_log ENABLE ROW LEVEL SECURITY;

-- Only administrators can view and create moderation logs
CREATE POLICY "Administrators can manage moderation logs" 
ON public.content_moderation_log 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for video sessions timestamps
CREATE TRIGGER update_video_sessions_updated_at
BEFORE UPDATE ON public.video_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();