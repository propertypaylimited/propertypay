-- Add missing foreign key constraints for tenancy_tenants table
ALTER TABLE tenancy_tenants 
ADD CONSTRAINT tenancy_tenants_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE tenancy_tenants 
ADD CONSTRAINT tenancy_tenants_tenancy_id_fkey 
FOREIGN KEY (tenancy_id) REFERENCES tenancies(id) ON DELETE CASCADE;