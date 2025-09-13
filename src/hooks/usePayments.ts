import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface PaymentRecord {
  id: string;
  tenancy_id: string;
  amount: number;
  status: string | null;
  created_at: string;
  due_date: string | null;
}

export const usePayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('id, tenancy_id, amount, status, created_at, due_date')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as unknown as PaymentRecord[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error fetching payments',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  return { payments, loading, fetchPayments };
};

