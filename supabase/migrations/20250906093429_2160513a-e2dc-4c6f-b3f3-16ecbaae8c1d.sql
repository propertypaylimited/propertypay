-- Enable RLS on all tables that need it
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;