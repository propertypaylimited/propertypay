-- Add RLS policy to allow reading tenancy_tenants data
CREATE POLICY "View tenancy tenants" ON public.tenancy_tenants
FOR SELECT
TO authenticated
USING (
  -- Allow tenants to see their own records
  tenant_id = auth.uid() OR
  -- Allow landlords to see records for their properties
  EXISTS (
    SELECT 1 FROM tenancies t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = tenancy_tenants.tenancy_id
    AND (p.landlord_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM property_owners po 
           WHERE po.property_id = p.id AND po.landlord_id = auth.uid()
         ))
  )
);