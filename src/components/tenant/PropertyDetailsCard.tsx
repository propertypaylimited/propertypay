import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Tenancy } from '@/hooks/useTenancies';

interface Props {
  tenancy?: Tenancy;
}

const PropertyDetailsCard: React.FC<Props> = ({ tenancy }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property</CardTitle>
        <CardDescription>Linked property details</CardDescription>
      </CardHeader>
      <CardContent>
        {tenancy ? (
          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">Property:</span> {tenancy.unit?.property?.name || '—'}</p>
            <p><span className="text-muted-foreground">Address:</span> {tenancy.unit?.property?.address || '—'}</p>
            <p><span className="text-muted-foreground">Unit:</span> {tenancy.unit?.name || '—'}</p>
            <p><span className="text-muted-foreground">Rent:</span> {tenancy.unit?.rent_amount ? `$${tenancy.unit.rent_amount}` : '—'}</p>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="text-muted-foreground">Start:</span> {tenancy.start_date ? new Date(tenancy.start_date).toLocaleDateString() : '—'}</p>
              <p><span className="text-muted-foreground">End:</span> {tenancy.end_date ? new Date(tenancy.end_date).toLocaleDateString() : '—'}</p>
            </div>
            <p><span className="text-muted-foreground">Status:</span> {tenancy.status}</p>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">No property linked yet.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyDetailsCard;

