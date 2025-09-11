import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CreditCard, AlertTriangle, CheckCircle, Clock, FileText, Wrench, MessageSquare, TrendingUp, Search } from 'lucide-react';
import PaymentOptionsModal from '@/components/tenant/PaymentOptionsModal';
import PropertySearch from '@/components/tenant/PropertySearch';
import { cn } from '@/lib/utils';

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { tenancies } = useTenancies();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);

  // Get active tenancy (assuming one active tenancy per tenant)
  const activeTenancy = tenancies.find(t => t.status === 'active');
  const rentAmount = activeTenancy?.unit?.rent_amount || 1200; // Default for demo
  const nextDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
  const daysTillDue = Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Determine rent status and color
  const getRentStatus = () => {
    if (daysTillDue < 0) return { status: 'Overdue', color: 'danger', urgent: true };
    if (daysTillDue === 0) return { status: 'Due Today', color: 'warning', urgent: true };
    if (daysTillDue <= 7) return { status: 'Due Soon', color: 'warning', urgent: true };
    return { status: 'Current', color: 'success', urgent: false };
  };

  const rentStatus = getRentStatus();
  const outstandingBalance = daysTillDue < 0 ? 150 : 0; // Mock late fee
  const totalDue = rentAmount + outstandingBalance;

  // Mock data for activity feed
  const activityItems = [
    {
      id: 1,
      type: 'payment',
      title: 'Rent Payment Processed',
      description: '$1,200.00',
      date: '2024-01-15',
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      id: 2,
      type: 'message',
      title: 'Message from Landlord',
      description: 'Maintenance scheduled for next week',
      date: '2024-01-14',
      icon: MessageSquare,
      color: 'text-primary',
      unread: true,
    },
    {
      id: 3,
      type: 'maintenance',
      title: 'Work Order Completed',
      description: 'Kitchen faucet repair finished',
      date: '2024-01-12',
      icon: Wrench,
      color: 'text-success',
    },
  ];

  const quickActions = [
    {
      title: 'Search Properties',
      description: 'Find new rentals',
      icon: Search,
      color: 'bg-primary/10 text-primary border-primary/20',
      action: () => setShowPropertySearch(!showPropertySearch),
    },
    {
      title: 'Request Maintenance',
      description: 'Report issues',
      icon: Wrench,
      color: 'bg-warning/10 text-warning border-warning/20',
      action: () => console.log('Navigate to maintenance'),
    },
    {
      title: 'View Agreement',
      description: 'Lease documents',
      icon: FileText,
      color: 'bg-success/10 text-success border-success/20',
      action: () => console.log('Navigate to documents'),
    },
    {
      title: 'Contact Landlord',
      description: 'Send message',
      icon: MessageSquare,
      color: 'bg-secondary/10 text-secondary border-secondary/20',
      action: () => console.log('Navigate to messages'),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-background pb-20 md:pb-6">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">Welcome back,</p>
                <p className="text-lg font-bold">{profile?.full_name || 'Tenant'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full"></div>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Urgent Alert Bar */}
          {rentStatus.urgent && (
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              rentStatus.color === 'danger' && "bg-danger/10 text-danger border-danger/20",
              rentStatus.color === 'warning' && "bg-warning/10 text-warning border-warning/20"
            )}>
              <AlertTriangle size={20} />
              <div className="flex-1">
                <p className="font-medium">
                  {rentStatus.status === 'Overdue' 
                    ? `Rent is ${Math.abs(daysTillDue)} days overdue!`
                    : rentStatus.status === 'Due Today'
                    ? 'Rent is due today!'
                    : `Rent due in ${daysTillDue} days`
                  }
                </p>
                <p className="text-sm opacity-90">Pay now to avoid late fees</p>
              </div>
            </div>
          )}

          {/* Rent Status Card - Most Prominent */}
          <Card className={cn(
            "border-2 relative overflow-hidden",
            rentStatus.color === 'success' && "border-success/30 bg-gradient-to-r from-success/5 to-success/10",
            rentStatus.color === 'warning' && "border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10",
            rentStatus.color === 'danger' && "border-danger/30 bg-gradient-to-r from-danger/5 to-danger/10"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Rent</p>
                  <p className="text-4xl font-bold">${totalDue.toLocaleString()}</p>
                  {outstandingBalance > 0 && (
                    <p className="text-sm text-danger mt-1">
                      + ${outstandingBalance} late fee
                    </p>
                  )}
                </div>
                <Badge variant={rentStatus.status === 'Overdue' ? 'destructive' : rentStatus.status === 'Due Today' ? 'secondary' : 'outline'}>
                  {rentStatus.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{nextDueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">
                    {activeTenancy?.unit?.property?.name || 'Sunset Apartments'}
                  </p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-semibold"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="mr-3" size={24} />
                Pay ${totalDue} Now
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                MTN MoMo • Airtel Money • Card • Bank Transfer
              </p>
            </CardContent>
          </Card>

          {/* Key Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                  "bg-success/10 text-success"
                )}>
                  <CheckCircle size={24} />
                </div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Payments Made</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-2 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <p className="text-2xl font-bold">{daysTillDue > 0 ? daysTillDue : 0}</p>
                <p className="text-xs text-muted-foreground">Days Left</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="w-12 h-12 rounded-full bg-warning/10 text-warning mx-auto mb-2 flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Card 
                    key={index} 
                    className={cn("border cursor-pointer hover:shadow-md transition-all", action.color)}
                    onClick={() => {
                      console.log('Clicked:', action.title);
                      action.action();
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Icon size={24} />
                        <div className="flex-1">
                          <p className="font-medium">{action.title}</p>
                          <p className="text-sm opacity-75">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Property Search Section */}
          {showPropertySearch && (
            <PropertySearch onClose={() => setShowPropertySearch(false)} />
          )}

          {/* Recent Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {activityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.id} className={cn("relative", item.unread && "border-primary/50 bg-primary/5")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-full", item.color === 'text-success' ? 'bg-success/10' : item.color === 'text-primary' ? 'bg-primary/10' : 'bg-muted')}>
                          <Icon size={16} className={item.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                              {item.unread && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Reminders */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Reminders</h3>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <span>Maintenance inspection tomorrow at 2 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Lease renewal notice due next month</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>New community guidelines available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentOptionsModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={totalDue}
      />
    </>
  );
};

export default TenantDashboard;