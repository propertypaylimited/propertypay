-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancy_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Landlords can view their properties" ON public.properties
FOR SELECT USING (
  auth.uid() = landlord_id OR 
  EXISTS (SELECT 1 FROM property_owners WHERE property_id = properties.id AND landlord_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view properties for browsing" ON public.properties
FOR SELECT USING (true);

CREATE POLICY "Landlords can insert properties" ON public.properties
FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their properties" ON public.properties
FOR UPDATE USING (
  auth.uid() = landlord_id OR 
  EXISTS (SELECT 1 FROM property_owners WHERE property_id = properties.id AND landlord_id = auth.uid())
);

-- Units policies
CREATE POLICY "Anyone can view units" ON public.units
FOR SELECT USING (true);

CREATE POLICY "Property owners can manage units" ON public.units
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = units.property_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tenancies policies
CREATE POLICY "Users can view relevant tenancies" ON public.tenancies
FOR SELECT USING (
  -- Tenants can see their tenancies
  EXISTS (SELECT 1 FROM tenancy_tenants tt WHERE tt.tenancy_id = tenancies.id AND tt.tenant_id = auth.uid()) OR
  -- Property owners can see tenancies for their units
  EXISTS (
    SELECT 1 FROM units u
    JOIN properties p ON p.id = u.property_id
    WHERE u.id = tenancies.unit_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  -- Admins can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users can create tenancies" ON public.tenancies
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Property owners can update tenancies" ON public.tenancies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM units u
    JOIN properties p ON p.id = u.property_id
    WHERE u.id = tenancies.unit_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tenancy tenants policies
CREATE POLICY "Users can view their tenancy relationships" ON public.tenancy_tenants
FOR SELECT USING (
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM tenancies t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = tenancy_tenants.tenancy_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can join tenancies" ON public.tenancy_tenants
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Payments policies  
CREATE POLICY "Users can view relevant payments" ON public.payments
FOR SELECT USING (
  -- Tenants can see their payments
  EXISTS (SELECT 1 FROM tenancy_tenants tt WHERE tt.tenancy_id = payments.tenancy_id AND tt.tenant_id = auth.uid()) OR
  -- Property owners can see payments for their properties
  EXISTS (
    SELECT 1 FROM tenancies t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.id = payments.tenancy_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  -- Admins can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "System can insert payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON public.ratings
FOR SELECT USING (true);

CREATE POLICY "Tenants can rate properties they lived in" ON public.ratings
FOR INSERT WITH CHECK (
  auth.uid() = tenant_id AND
  EXISTS (
    SELECT 1 FROM tenancy_tenants tt
    JOIN tenancies t ON t.id = tt.tenancy_id
    JOIN units u ON u.id = t.unit_id
    WHERE tt.tenant_id = auth.uid() 
    AND u.property_id = ratings.property_id
    AND t.status = 'ended'
  )
);

-- Images policies
CREATE POLICY "Anyone can view images" ON public.images
FOR SELECT USING (true);

CREATE POLICY "Property owners can manage images" ON public.images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = images.property_id 
    AND (p.landlord_id = auth.uid() OR EXISTS (SELECT 1 FROM property_owners po WHERE po.property_id = p.id AND po.landlord_id = auth.uid()))
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
CREATE POLICY "Anyone can view property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Property owners can delete their images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add rent_amount to units table for payment calculation
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(10,2) DEFAULT 0;

-- Add a function to automatically update unit availability based on tenancy status
CREATE OR REPLACE FUNCTION public.update_unit_availability()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.units SET is_available = false WHERE id = NEW.unit_id;
    ELSIF NEW.status = 'ended' THEN
      UPDATE public.units SET is_available = true WHERE id = NEW.unit_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unit_availability_trigger
  AFTER INSERT OR UPDATE ON public.tenancies
  FOR EACH ROW EXECUTE PROCEDURE public.update_unit_availability();