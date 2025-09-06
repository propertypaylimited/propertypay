-- Update profiles table to support three distinct roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'tenant'::text, 'landlord'::text]));

-- Add missing columns to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS rent_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS description text;

-- Add recurring interval to tenancies table
ALTER TABLE public.tenancies 
ADD COLUMN IF NOT EXISTS recurring_interval text DEFAULT 'monthly';

-- Add payment status and due date for better payment tracking
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text])),
ADD COLUMN IF NOT EXISTS due_date date;

-- Create RLS policies for proper role-based access

-- Properties: All can view, landlords can create/update their own
CREATE POLICY "Anyone can view properties" ON public.properties
FOR SELECT USING (true);

CREATE POLICY "Landlords can create properties" ON public.properties
FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- Units: All can view, property owners can manage
CREATE POLICY "Anyone can view units" ON public.units
FOR SELECT USING (true);

-- Ratings: All can view, only tenants with ended tenancies can create
CREATE POLICY "Anyone can view ratings" ON public.ratings
FOR SELECT USING (true);

-- Update tenancies policies to allow status updates by property owners
CREATE POLICY "Property owners can update tenancy status" ON public.tenancies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM units u 
    JOIN properties p ON p.id = u.property_id 
    WHERE u.id = tenancies.unit_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (
      SELECT 1 FROM property_owners po 
      WHERE po.property_id = p.id AND po.landlord_id = auth.uid()
    ))
  )
);