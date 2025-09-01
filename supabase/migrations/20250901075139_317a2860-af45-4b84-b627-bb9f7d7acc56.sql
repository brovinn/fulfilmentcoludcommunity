-- Drop overly permissive RLS policies on content table
-- These policies allow any authenticated user to delete/update ANY content
-- We keep the "Users can manage own content" policy which properly restricts access

DROP POLICY IF EXISTS "Authenticated users can delete all content" ON public.content;
DROP POLICY IF EXISTS "Authenticated users can update all content" ON public.content;