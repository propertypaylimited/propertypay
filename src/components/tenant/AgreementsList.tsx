import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAgreements } from '@/hooks/useAgreements';

interface Props {
  tenancyIds: string[];
}

const AgreementsList: React.FC<Props> = ({ tenancyIds }) => {
  const { agreements, loading } = useAgreements();

  const filtered = useMemo(() => {
    if (!agreements || tenancyIds.length === 0) return [];
    return agreements.filter(a => !a.tenancy_id || tenancyIds.includes(a.tenancy_id));
  }, [agreements, tenancyIds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lease Agreements</CardTitle>
        <CardDescription>Documents tied to your tenancy</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="text-sm">
                  <p className="font-medium">{item.title || 'Agreement'}</p>
                  <p className="text-muted-foreground">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    {item.status ? ` • ${item.status}` : ''}
                  </p>
                </div>
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noreferrer" className="text-primary text-sm">View</a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">No agreements found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgreementsList;

