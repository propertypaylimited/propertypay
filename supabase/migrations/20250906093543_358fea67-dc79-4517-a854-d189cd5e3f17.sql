-- Enable RLS on property_owners table
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

-- Fix remaining functions search paths
ALTER FUNCTION public.add_tenant_to_new_tenancy() SET search_path = public;
ALTER FUNCTION public.set_unit_availability_from_tenancy() SET search_path = public;