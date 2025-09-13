import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePayments } from '@/hooks/usePayments';

interface Props {
  tenancyIds: string[];
}

const PaymentsList: React.FC<Props> = ({ tenancyIds }) => {
  const { payments, loading } = usePayments();

  const filtered = useMemo(() => {
    if (!payments || tenancyIds.length === 0) return [];
    return payments.filter(p => tenancyIds.includes(p.tenancy_id));
  }, [payments, tenancyIds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Recent payment history</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="text-sm">
                  <p className="font-medium">${item.amount}</p>
                  <p className="text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <Badge variant="outline" className="text-xs">{item.status || '—'}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">No payments found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsList;

