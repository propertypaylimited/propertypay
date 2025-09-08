import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTenancies } from '@/hooks/useTenancies';
import { Search, Home, Calendar, DollarSign, CreditCard, Clock, FileText, Settings, Download, MessageSquare, Wrench, Bell } from 'lucide-react';

const TenantDashboard = () => {
  const { tenancies } = useTenancies();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');

  // Get active tenancy (assuming one active tenancy per tenant)
  const activeTenancy = tenancies.find(t => t.status === 'active');
  const rentAmount = activeTenancy?.unit?.rent_amount || 0;
  const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Mock: 30 days from now
  const daysTillDue = Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const rentStatus = daysTillDue > 0 ? 'Unpaid' : daysTillDue === 0 ? 'Due Today' : 'Overdue';
  const statusColor = daysTillDue > 7 ? 'text-green-600' : daysTillDue > 0 ? 'text-yellow-600' : 'text-red-600';

  // Mock data for additional features
  const outstandingBalance = 0;
  const lateFees = 0;
  const recentPayments = activeTenancy?.payments?.slice(0, 3).map(p => ({
    ...p,
    status: 'paid' as const
  })) || [];
  const messages = [
    { id: 1, from: 'Property Manager', subject: 'Monthly Newsletter', date: '2024-01-15', unread: true },
    { id: 2, from: 'Landlord', subject: 'Maintenance Schedule', date: '2024-01-10', unread: false }
  ];
  const maintenanceRequests = [
    { id: 1, title: 'Kitchen Faucet Leak', status: 'In Progress', date: '2024-01-12' },
    { id: 2, title: 'AC Unit Noise', status: 'Completed', date: '2024-01-08' }
  ];

  // Search functionality
  const searchItems = [
    ...recentPayments.map(p => ({ type: 'payment', ...p })),
    ...messages.map(m => ({ type: 'message', ...m })),
    ...maintenanceRequests.map(m => ({ type: 'maintenance', ...m }))
  ];

  const filteredSearchItems = searchItems.filter(item => {
    const matchesCategory = searchCategory === 'all' || item.type === searchCategory;
    const matchesSearch = !searchTerm || 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rent Dashboard</h1>
          <p className="text-muted-foreground">Manage your rent and tenancy</p>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Input
            placeholder="Search payments, messages, documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <select 
            value={searchCategory} 
            onChange={(e) => setSearchCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All</option>
            <option value="payment">Payments</option>
            <option value="message">Messages</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Rent Overview - Most Prominent */}
      {activeTenancy && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">Current Rent</span>
              <Badge variant={rentStatus === 'Overdue' ? 'destructive' : rentStatus === 'Due Today' ? 'secondary' : 'outline'}>
                {rentStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-3xl font-bold">${rentAmount}</p>
                {outstandingBalance > 0 && (
                  <p className="text-sm text-red-600">+ ${outstandingBalance} outstanding</p>
                )}
                {lateFees > 0 && (
                  <p className="text-sm text-red-600">+ ${lateFees} late fees</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-xl font-semibold">{nextDueDate.toLocaleDateString()}</p>
                <p className={`text-sm ${statusColor}`}>
                  {daysTillDue > 0 ? `${daysTillDue} days remaining` : 
                   daysTillDue === 0 ? 'Due today' : `${Math.abs(daysTillDue)} days overdue`}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button size="lg" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  Supports Card, Bank Transfer, MTN MOMO
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment History</p>
                <p className="text-2xl font-bold">{recentPayments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{messages.filter(m => m.unread).length}</p>
                <p className="text-xs text-muted-foreground">unread</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{maintenanceRequests.filter(r => r.status === 'In Progress').length}</p>
                <p className="text-xs text-muted-foreground">active</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reminders</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">active</p>
              </div>
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Payments</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.length > 0 ? recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">${payment.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No payment history available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages from Landlord */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Messages & Announcements</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`p-3 border rounded-lg ${message.unread ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{message.subject}</p>
                      <p className="text-sm text-muted-foreground">From: {message.from}</p>
                      <p className="text-xs text-muted-foreground">{new Date(message.date).toLocaleDateString()}</p>
                    </div>
                    {message.unread && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Maintenance Requests</span>
            <Button variant="outline" size="sm">
              <Wrench className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{request.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(request.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={request.status === 'Completed' ? 'default' : request.status === 'In Progress' ? 'secondary' : 'outline'}>
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {filteredSearchItems.length} items matching "{searchTerm}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSearchItems.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 capitalize">{item.type}</Badge>
                      <p className="font-medium">
                        {item.type === 'payment' ? `Payment $${(item as any).amount}` :
                         item.type === 'message' ? (item as any).subject :
                         (item as any).title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date((item as any).date || (item as any).created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents & Lease Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documents & Lease</span>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Lease
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Current Lease</h4>
              <p className="text-sm text-muted-foreground">
                {activeTenancy ? `${activeTenancy.unit?.property?.name} - ${activeTenancy.unit?.name}` : 'No active lease'}
              </p>
              {activeTenancy && (
                <div className="text-sm">
                  <p>Start: {new Date(activeTenancy.start_date).toLocaleDateString()}</p>
                  {activeTenancy.end_date && (
                    <p>End: {new Date(activeTenancy.end_date).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Available Documents</h4>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="justify-start h-auto p-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Lease Agreement
                </Button>
                <Button variant="ghost" size="sm" className="justify-start h-auto p-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Payment Statements
                </Button>
                <Button variant="ghost" size="sm" className="justify-start h-auto p-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Property Rules
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDashboard;