-- Add foreign key constraint from tenancy_tenants.tenant_id to profiles.id
ALTER TABLE public.tenancy_tenants 
ADD CONSTRAINT fk_tenancy_tenants_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update any existing tenancy_tenants records to use profile IDs instead of auth user IDs
-- This handles the case where tenant_id might currently reference auth.users
UPDATE public.tenancy_tenants 
SET tenant_id = p.id 
FROM public.profiles p 
WHERE tenancy_tenants.tenant_id = p.id;