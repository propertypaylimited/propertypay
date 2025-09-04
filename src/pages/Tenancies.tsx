import React, { useState } from 'react';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProperties } from '@/hooks/useProperties';
import { Plus, Calendar, MapPin, DollarSign } from 'lucide-react';

const Tenancies = () => {
  const { user, isAdmin } = useAuth();
  const { tenancies, loading, createTenancy, updateTenancyStatus } = useTenancies();
  const { properties } = useProperties();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    start_date: '',
    end_date: '',
  });

  const handleCreateTenancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTenancy({
        unit_id: formData.unit_id,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
      });
      setFormData({ unit_id: '', start_date: '', end_date: '' });
      setShowCreateModal(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const availableUnits = properties.flatMap(property => 
    property.units?.filter(unit => unit.is_available).map(unit => ({
      ...unit,
      propertyName: property.name,
      propertyAddress: property.address,
    })) || []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenancies</h1>
          <p className="text-muted-foreground">
            Manage tenancy agreements and applications
          </p>
        </div>
        
        {user && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply for Tenancy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Tenancy</DialogTitle>
                <DialogDescription>
                  Submit an application for a unit
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTenancy} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Select Unit</Label>
                  <Select value={formData.unit_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, unit_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.propertyName} - {unit.name} (${unit.rent_amount}/month)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Application
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {tenancies.map((tenancy) => (
          <Card key={tenancy.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    {tenancy.unit?.property?.name || 'Property'} - {tenancy.unit?.name || 'Unit'}
                  </CardTitle>
                  <CardDescription>
                    {tenancy.unit?.property?.address || 'No address'}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(tenancy.status)}>
                  {tenancy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tenancy.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {tenancy.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tenancy.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Monthly Rent</p>
                    <p className="text-sm text-muted-foreground">
                      ${tenancy.unit?.rent_amount || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              {tenancy.status === 'pending' && isAdmin && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={() => updateTenancyStatus(tenancy.id, 'active')}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateTenancyStatus(tenancy.id, 'ended')}
                  >
                    Reject
                  </Button>
                </div>
              )}
              
              {tenancy.payments && tenancy.payments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recent Payments</p>
                  <div className="space-y-1">
                    {tenancy.payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                        <span>${payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tenancies.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tenancies found</h3>
          <p className="text-muted-foreground mb-4">
            Start by applying for a tenancy or wait for applications to come in.
          </p>
          {user && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Your First Tenancy
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Tenancies;