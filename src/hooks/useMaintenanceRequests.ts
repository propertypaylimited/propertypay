import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface MaintenanceRequestRecord {
  id: string;
  tenant_id?: string;
  property_id?: string | null;
  unit_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export const useMaintenanceRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
          select: (sel: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }> };
        };
      })
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(((data as unknown[]) || []) as MaintenanceRequestRecord[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (typeof message === 'string' && message.toLowerCase().includes('does not exist')) {
        setRequests([]);
      } else {
        toast({
          title: 'Error fetching maintenance requests',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  return { requests, loading, fetchRequests };
};

