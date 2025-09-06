-- Ensure RLS is enabled on all tables (idempotent)
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancy_tenants ENABLE ROW LEVEL SECURITY;

-- Add missing policies for property_owners
CREATE POLICY "Property owners can view their records" ON public.property_owners
FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can add co-owners" ON public.property_owners
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_owners.property_id 
    AND p.landlord_id = auth.uid()
  )
);

-- Add policies for units table that were missing
CREATE POLICY "Landlords delete unit" ON public.units
FOR DELETE USING (
  (auth.uid() IN ( SELECT properties.landlord_id
   FROM properties
  WHERE (properties.id = units.property_id))) OR (EXISTS ( SELECT 1
   FROM property_owners po
  WHERE ((po.property_id = units.property_id) AND (po.landlord_id = auth.uid()))))
);