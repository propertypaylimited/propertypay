-- Fix all missing RLS policies to allow proper data access

-- Add SELECT policy for profiles table
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT 
TO authenticated
USING (true);

-- Add SELECT policy for images table  
CREATE POLICY "Anyone can view property images" ON public.images
FOR SELECT
TO authenticated
USING (true);

-- Update payments SELECT policies to be more comprehensive
DROP POLICY IF EXISTS "Owners view payments" ON public.payments;
DROP POLICY IF EXISTS "Tenant view own payments" ON public.payments;

CREATE POLICY "Property owners and admins view payments" ON public.payments
FOR SELECT
TO authenticated
USING (
  -- Allow admins to view all payments
  is_admin() OR 
  -- Allow property owners (landlords or co-owners) to view payments for their properties
  EXISTS (
    SELECT 1 FROM tenancies t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = payments.tenancy_id 
    AND (p.landlord_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM property_owners po 
                WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  )
);

CREATE POLICY "Tenants view their own payments" ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenancy_tenants tt
    WHERE tt.tenancy_id = payments.tenancy_id 
    AND tt.tenant_id = auth.uid()
  )
);