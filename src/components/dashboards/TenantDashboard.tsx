import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProperties } from '@/hooks/useProperties';
import { useTenancies } from '@/hooks/useTenancies';
import { Search, MapPin, Star, Home, Calendar, DollarSign, Plus } from 'lucide-react';

const TenantDashboard = () => {
  const { properties } = useProperties();
  const { tenancies } = useTenancies();
  const [searchTerm, setSearchTerm] = useState('');

  const myTenancies = tenancies.length;
  const activeTenancies = tenancies.filter(t => t.status === 'active').length;
  const pendingTenancies = tenancies.filter(t => t.status === 'pending').length;
  const totalPayments = tenancies.reduce((acc, tenancy) => acc + tenancy.payments.length, 0);

  // Filter available properties for search
  const availableProperties = properties.filter(property => {
    const hasAvailableUnits = property.units?.some(unit => unit.is_available);
    const matchesSearch = !searchTerm || 
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return hasAvailableUnits && matchesSearch;
  });

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const tenantStats = [
    {
      title: 'My Applications',
      value: myTenancies,
      description: 'Total applications',
      icon: Home,
      color: 'text-blue-600',
    },
    {
      title: 'Active Tenancies',
      value: activeTenancies,
      description: 'Currently renting',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Pending Applications',
      value: pendingTenancies,
      description: 'Awaiting approval',
      icon: Calendar,
      color: 'text-yellow-600',
    },
    {
      title: 'Payments Made',
      value: totalPayments,
      description: 'Total payments',
      icon: DollarSign,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tenant Dashboard</h1>
        <p className="text-muted-foreground">Find your perfect home</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tenantStats.map((stat, index) => {
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Properties
          </CardTitle>
          <CardDescription>Search for available properties and units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search properties by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableProperties.slice(0, 6).map((property) => {
                const averageRating = calculateAverageRating(property.ratings || []);
                const availableUnits = property.units?.filter(unit => unit.is_available) || [];
                const minRent = Math.min(...availableUnits.map(unit => Number(unit.rent_amount) || 0));
                
                return (
                  <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0].url}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{property.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.address || 'Location not specified'}
                          </CardDescription>
                        </div>
                        {parseFloat(averageRating.toString()) > 0 && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{averageRating}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="secondary">
                          {availableUnits.length} unit{availableUnits.length !== 1 ? 's' : ''} available
                        </Badge>
                        <span className="font-medium text-green-600">
                          From ${minRent}/month
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {myTenancies > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Your recent tenancy applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenancies.slice(0, 5).map((tenancy) => (
                <div key={tenancy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{tenancy.unit?.property?.name} - {tenancy.unit?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Applied: {new Date(tenancy.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rent: ${tenancy.unit?.rent_amount}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      tenancy.status === 'active' ? 'default' :
                      tenancy.status === 'pending' ? 'secondary' : 
                      'outline'
                    }>
                      {tenancy.status}
                    </Badge>
                    {tenancy.status === 'active' && tenancy.payments.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Last payment: {new Date(tenancy.payments[0].created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenantDashboard;