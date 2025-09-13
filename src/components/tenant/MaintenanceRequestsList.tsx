import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests';

interface Props {
  tenantId?: string;
  propertyId?: string;
}

const MaintenanceRequestsList: React.FC<Props> = ({ tenantId, propertyId }) => {
  const { requests, loading } = useMaintenanceRequests();

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => (tenantId && r.tenant_id === tenantId) || (propertyId && r.property_id === propertyId));
  }, [requests, tenantId, propertyId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Requests</CardTitle>
        <CardDescription>Issues reported by you or for your property</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="p-3 border rounded-md">
                <p className="text-sm font-medium">{item.title || 'Request'}</p>
                <p className="text-xs text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}{item.status ? ` • ${item.status}` : ''}</p>
                {item.description && (
                  <p className="text-sm mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">No maintenance requests found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceRequestsList;

