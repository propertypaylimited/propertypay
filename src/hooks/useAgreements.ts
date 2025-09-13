import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface AgreementRecord {
  id: string;
  tenancy_id?: string;
  created_at?: string | null;
  status?: string | null;
  title?: string | null;
  file_url?: string | null;
}

export const useAgreements = () => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      // Cast to any to allow querying tables that may not be present in generated types
      const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
          select: (sel: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[] | null; error: { message: string } | null }> };
        };
      })
        .from('agreements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements(((data as unknown[]) || []) as AgreementRecord[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // If the table does not exist, treat as no data and avoid toasts spam
      if (typeof message === 'string' && message.toLowerCase().includes('does not exist')) {
        setAgreements([]);
      } else {
        toast({
          title: 'Error fetching agreements',
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
      fetchAgreements();
    }
  }, [user]);

  return { agreements, loading, fetchAgreements };
};

