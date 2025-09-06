import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProperties } from '@/hooks/useProperties';
import { useTenancies } from '@/hooks/useTenancies';
import { Users, Building, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { properties } = useProperties();
  const { tenancies } = useTenancies();

  // Calculate admin-specific statistics
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((acc, prop) => acc + (prop.units?.length || 0), 0);
  const activeTenancies = tenancies.filter(t => t.status === 'active').length;
  const pendingTenancies = tenancies.filter(t => t.status === 'pending').length;
  const totalPayments = tenancies.reduce((acc, tenancy) => acc + tenancy.payments.length, 0);
  const totalRevenue = tenancies.reduce(
    (acc, tenancy) => acc + tenancy.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), 
    0
  );

  const adminStats = [
    {
      title: 'Total Properties',
      value: totalProperties,
      description: 'Properties in system',
      icon: Building,
      color: 'text-blue-600',
      trend: '+12% from last month',
    },
    {
      title: 'Total Users',
      value: totalProperties + activeTenancies,
      description: 'Active users',
      icon: Users,
      color: 'text-green-600',
      trend: '+5% from last month',
    },
    {
      title: 'Active Tenancies',
      value: activeTenancies,
      description: 'Currently active',
      icon: Calendar,
      color: 'text-purple-600',
      trend: '+8% from last month',
    },
    {
      title: 'Platform Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      description: 'Total processed',
      icon: DollarSign,
      color: 'text-orange-600',
      trend: '+15% from last month',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat, index) => {
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
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Tenancy applications awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenancies.filter(t => t.status === 'pending').slice(0, 5).map((tenancy) => (
                <div key={tenancy.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tenancy.unit?.property?.name} - {tenancy.unit?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Start: {new Date(tenancy.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
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
                      {tenancy.unit?.property?.name} - {tenancy.unit?.name}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Admin Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Building className="h-6 w-6" />
              <span className="text-sm">Property Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Payment Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;