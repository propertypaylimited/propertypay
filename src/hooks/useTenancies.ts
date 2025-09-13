import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Tenancy {
  id: string;
  unit_id: string;
  status: 'pending' | 'active' | 'ended';
  start_date: string;
  end_date: string | null;
  unit: {
    id: string;
    name: string;
    rent_amount: number;
    property: {
      id: string;
      name: string;
      address: string;
    };
  };
  tenants: {
    id: string;
    tenant_id: string;
    tenant: {
      full_name: string;
      email: string;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    created_at: string;
    due_date?: string | null;
    status?: string | null;
    tenancy_id?: string;
  }[];
}

export const useTenancies = () => {
  const { user, isAdmin } = useAuth();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenancies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenancies')
        .select(`
          *,
          unit:units (
            id,
            name,
            rent_amount,
            property:properties (
              id,
              name,
              address
            )
          ),
          tenants:tenancy_tenants (
            id,
            tenant_id,
            tenant:profiles (
              full_name,
              email
            )
          ),
          payments (
            id,
            amount,
            created_at,
            due_date,
            status,
            tenancy_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTenancies((data || []) as unknown as Tenancy[]);
    } catch (error: any) {
      toast({
        title: "Error fetching tenancies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTenancy = async (tenancyData: {
    unit_id: string;
    start_date: string;
    end_date?: string;
  }) => {
    if (!user) return;

    try {
      // Create tenancy
      const { data: tenancy, error: tenancyError } = await supabase
        .from('tenancies')
        .insert([tenancyData])
        .select()
        .single();

      if (tenancyError) throw tenancyError;

      // Add current user as tenant
      const { error: tenantError } = await supabase
        .from('tenancy_tenants')
        .insert([{
          tenancy_id: tenancy.id,
          tenant_id: user.id,
        }]);

      if (tenantError) throw tenantError;

      toast({
        title: "Tenancy application submitted",
        description: "Your application is pending approval from the landlord.",
      });

      await fetchTenancies();
      return tenancy;
    } catch (error: any) {
      toast({
        title: "Error creating tenancy",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTenancyStatus = async (id: string, status: 'pending' | 'active' | 'ended') => {
    try {
      const { error } = await supabase
        .from('tenancies')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Tenancy ${status}`,
        description: `The tenancy has been marked as ${status}.`,
      });

      await fetchTenancies();
    } catch (error: any) {
      toast({
        title: "Error updating tenancy",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addTenantToTenancy = async (tenancyId: string, tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenancy_tenants')
        .insert([{
          tenancy_id: tenancyId,
          tenant_id: tenantId,
        }]);

      if (error) throw error;

      toast({
        title: "Tenant added successfully",
      });

      await fetchTenancies();
    } catch (error: any) {
      toast({
        title: "Error adding tenant",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchTenancies();
    }
  }, [user]);

  return {
    tenancies,
    loading,
    fetchTenancies,
    createTenancy,
    updateTenancyStatus,
    addTenantToTenancy,
  };
};