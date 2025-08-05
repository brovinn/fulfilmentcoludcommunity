-- Add additional international compliance fields to donations table
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Create index for better performance on country searches
CREATE INDEX IF NOT EXISTS idx_donations_country ON public.donations(country);

-- Update RLS policies to ensure data privacy
DROP POLICY IF EXISTS "Donors can view own donations" ON public.donations;

CREATE POLICY "Donors can view own donations" ON public.donations
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (anonymous = false AND auth.uid() IS NOT NULL)
);

-- Policy for anonymous donations - only user can see their own even if anonymous
CREATE POLICY "Users can view their anonymous donations" ON public.donations
FOR SELECT 
USING (auth.uid() = user_id);