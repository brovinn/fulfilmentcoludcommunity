-- Create content_likes table for the like functionality
CREATE TABLE public.content_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for content_likes
CREATE POLICY "Users can view all content likes" 
ON public.content_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like content" 
ON public.content_likes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.content_likes 
FOR DELETE 
USING (auth.uid() = user_id);