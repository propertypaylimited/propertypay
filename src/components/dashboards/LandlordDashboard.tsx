import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProperties } from '@/hooks/useProperties';
import { useTenancies } from '@/hooks/useTenancies';
import { Building, Users, DollarSign, AlertCircle, Plus, CheckCircle, Clock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const { properties } = useProperties();
  const { tenancies, updateTenancyStatus } = useTenancies();

  // Filter tenancies for landlord's properties
  const myTenancies = tenancies.filter(tenancy => 
    properties.some(property => 
      property.units?.some(unit => unit.id === tenancy.unit_id)
    )
  );

  const totalProperties = properties.length;
  const totalUnits = properties.reduce((acc, prop) => acc + (prop.units?.length || 0), 0);
  const availableUnits = properties.reduce(
    (acc, prop) => acc + (prop.units?.filter(unit => unit.is_available).length || 0), 
    0
  );
  const activeTenancies = myTenancies.filter(t => t.status === 'active').length;
  const pendingTenancies = myTenancies.filter(t => t.status === 'pending').length;
  const monthlyRevenue = myTenancies
    .filter(t => t.status === 'active')
    .reduce((acc, tenancy) => acc + Number(tenancy.unit?.rent_amount || 0), 0);

  const landlordStats = [
    {
      title: 'My Properties',
      value: totalProperties,
      description: 'Properties owned',
      icon: Building,
      color: 'text-blue-600',
    },
    {
      title: 'Total Units',
      value: totalUnits,
      description: 'Units available',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Active Tenancies',
      value: activeTenancies,
      description: 'Currently rented',
      icon: CheckCircle,
      color: 'text-purple-600',
    },
    {
      title: 'Monthly Revenue',
      value: `$${monthlyRevenue.toLocaleString()}`,
      description: 'Expected monthly',
      icon: DollarSign,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties and tenancies</p>
        </div>
        <Button onClick={() => navigate('/properties')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {landlordStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Applications
              {pendingTenancies > 0 && (
                <Badge variant="destructive">{pendingTenancies}</Badge>
              )}
            </CardTitle>
            <CardDescription>Tenancy applications awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTenancies.filter(t => t.status === 'pending').map((tenancy) => (
                <div key={tenancy.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium">{tenancy.unit?.property?.name} - {tenancy.unit?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Start: {new Date(tenancy.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rent: ${tenancy.unit?.rent_amount}/month
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateTenancyStatus(tenancy.id, 'active')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTenancyStatus(tenancy.id, 'ended')}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
              {pendingTenancies === 0 && (
                <p className="text-sm text-muted-foreground">No pending applications</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Overview</CardTitle>
            <CardDescription>Your properties and their occupancy</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {properties.map((property) => {
                const propertyUnits = property.units || [];
                const occupied = propertyUnits.filter(unit => !unit.is_available).length;
                const available = propertyUnits.filter(unit => unit.is_available).length;
                
                return (
                  <AccordionItem key={property.id} value={property.id}>
                    <AccordionTrigger className="text-left">
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {occupied} occupied, {available} available
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {propertyUnits.map((unit) => (
                          <div key={unit.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                            <div>
                              <p className="font-medium">{unit.name}</p>
                              <p className="text-sm text-muted-foreground">${unit.rent_amount}/month</p>
                            </div>
                            <Badge variant={unit.is_available ? "default" : "secondary"}>
                              {unit.is_available ? "Available" : "Occupied"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest rent payments from your tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myTenancies
              .filter(tenancy => tenancy.payments && tenancy.payments.length > 0)
              .slice(0, 5)
              .map((tenancy) => (
                <div key={tenancy.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tenancy.unit?.property?.name} - {tenancy.unit?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last payment: {tenancy.payments[0] && new Date(tenancy.payments[0].created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${tenancy.payments[0]?.amount || 0}</p>
                    <Badge variant="default">Paid</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandlordDashboard;