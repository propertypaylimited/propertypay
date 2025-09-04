import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProperties } from '@/hooks/useProperties';
import { useTenancies } from '@/hooks/useTenancies';
import { Building, Users, CreditCard, Star, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { profile, isAdmin } = useAuth();
  const { properties } = useProperties();
  const { tenancies } = useTenancies();

  // Calculate statistics
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((acc, prop) => acc + (prop.units?.length || 0), 0);
  const availableUnits = properties.reduce(
    (acc, prop) => acc + (prop.units?.filter(unit => unit.is_available).length || 0), 
    0
  );
  const activeTenancies = tenancies.filter(t => t.status === 'active').length;
  const pendingTenancies = tenancies.filter(t => t.status === 'pending').length;
  const totalPayments = tenancies.reduce(
    (acc, tenancy) => acc + tenancy.payments.length, 
    0
  );

  const statsCards = isAdmin 
    ? [
        {
          title: 'Total Properties',
          value: totalProperties,
          description: 'Properties in the system',
          icon: Building,
          color: 'text-blue-600',
        },
        {
          title: 'Active Tenancies',
          value: activeTenancies,
          description: 'Currently active tenancies',
          icon: Users,
          color: 'text-green-600',
        },
        {
          title: 'Total Payments',
          value: totalPayments,
          description: 'Payments processed',
          icon: CreditCard,
          color: 'text-purple-600',
        },
        {
          title: 'Pending Applications',
          value: pendingTenancies,
          description: 'Awaiting approval',
          icon: TrendingUp,
          color: 'text-orange-600',
        },
      ]
    : [
        {
          title: 'My Properties',
          value: totalProperties,
          description: 'Properties you own',
          icon: Building,
          color: 'text-blue-600',
        },
        {
          title: 'Available Units',
          value: availableUnits,
          description: 'Units ready for rent',
          icon: Users,
          color: 'text-green-600',
        },
        {
          title: 'My Tenancies',
          value: tenancies.length,
          description: 'Your tenancy applications',
          icon: CreditCard,
          color: 'text-purple-600',
        },
        {
          title: 'Pending Actions',
          value: pendingTenancies,
          description: 'Items needing attention',
          icon: TrendingUp,
          color: 'text-orange-600',
        },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Here\'s an overview of the platform activity.' 
            : 'Here\'s your property management overview.'
          }
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates on your properties and tenancies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenancies.slice(0, 5).map((tenancy) => (
                <div key={tenancy.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    tenancy.status === 'active' ? 'bg-green-500' :
                    tenancy.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tenancy.unit.property.name} - {tenancy.unit.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {tenancy.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded hover:bg-accent">
                📝 Create New Property
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-accent">
                🏠 Add New Unit
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-accent">
                👥 Manage Tenancies
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-accent">
                💳 View Payments
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;