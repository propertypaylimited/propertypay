-- Create security definer function to check if user is tenant of tenancy
CREATE OR REPLACE FUNCTION public.is_tenant_of_tenancy(tenancy_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tenancy_tenants 
    WHERE tenancy_tenants.tenancy_id = $1 
      AND tenancy_tenants.tenant_id = auth.uid()
  );
$$;

-- Create security definer function to check if user is property owner/landlord of tenancy
CREATE OR REPLACE FUNCTION public.is_owner_of_tenancy(tenancy_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenancies t
    JOIN public.units u ON u.id = t.unit_id
    JOIN public.properties p ON p.id = u.property_id
    WHERE t.id = $1 
      AND (p.landlord_id = auth.uid() 
           OR EXISTS (
             SELECT 1 
             FROM public.property_owners po 
             WHERE po.property_id = p.id 
               AND po.landlord_id = auth.uid()
           ))
  );
$$;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "View tenancy tenants" ON public.tenancy_tenants;
DROP POLICY IF EXISTS "Tenant can be added to tenancy" ON public.tenancy_tenants;

-- Recreate policies using security definer functions
CREATE POLICY "View tenancy tenants"
ON public.tenancy_tenants
FOR SELECT
USING (
  tenant_id = auth.uid() 
  OR public.is_owner_of_tenancy(tenancy_id)
);

CREATE POLICY "Tenant can be added to tenancy"
ON public.tenancy_tenants
FOR INSERT
WITH CHECK (
  auth.uid() = tenant_id
);