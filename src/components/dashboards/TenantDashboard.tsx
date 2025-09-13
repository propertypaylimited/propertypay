import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CreditCard, AlertTriangle, CheckCircle, Clock, FileText, Wrench, MessageSquare, Search, MapPin } from 'lucide-react';
import PaymentOptionsModal from '@/components/tenant/PaymentOptionsModal';
import PropertySearch from '@/components/tenant/PropertySearch';
import { cn } from '@/lib/utils';

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { tenancies } = useTenancies();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);

  // Get active tenancy (assuming one active tenancy per tenant)
  const activeTenancy = useMemo(() => tenancies.find(t => t.status === 'active'), [tenancies]);
  const rentAmount = activeTenancy?.unit?.rent_amount ?? null;

  // Derive payments across all accessible tenancies
  const payments = useMemo(() => {
    return tenancies.flatMap(t => (t.payments || []).map(p => ({ ...p, tenancy: t })))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tenancies]);

  // Determine upcoming due payment if available (no assumptions if not present)
  const upcomingDue = useMemo(() => {
    const now = new Date();
    const candidates = payments.filter(p => p.due_date && new Date(p.due_date) >= new Date(now.toDateString()) && (!p.status || p.status.toLowerCase() !== 'paid'));
    return candidates.sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())[0];
  }, [payments]);

  const daysTillDue = useMemo(() => {
    if (!upcomingDue?.due_date) return null;
    const due = new Date(upcomingDue.due_date);
    return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [upcomingDue]);
  
  // Determine rent status and color
  const getRentStatus = () => {
    if (daysTillDue == null) return null;
    if (daysTillDue < 0) return { status: 'Overdue', color: 'danger', urgent: true } as const;
    if (daysTillDue === 0) return { status: 'Due Today', color: 'warning', urgent: true } as const;
    if (daysTillDue <= 7) return { status: 'Due Soon', color: 'warning', urgent: true } as const;
    return { status: 'Upcoming', color: 'success', urgent: false } as const;
  };

  const rentStatus = getRentStatus();
  type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>['variant'];
  const statusVariant: BadgeVariant | undefined = rentStatus?.status === 'Overdue'
    ? 'destructive'
    : rentStatus?.status === 'Due Today'
    ? 'secondary'
    : rentStatus?.status
    ? 'outline'
    : undefined;

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
          {rentStatus?.urgent && (
            <div className={cn(
              "p-4 rounded-lg border flex items-center gap-3",
              rentStatus.color === 'danger' && "bg-danger/10 text-danger border-danger/20",
              rentStatus.color === 'warning' && "bg-warning/10 text-warning border-warning/20"
            )}>
              <AlertTriangle size={20} />
              <div className="flex-1">
                <p className="font-medium">
                  {rentStatus.status === 'Overdue' && typeof daysTillDue === 'number' && daysTillDue < 0 && `Rent is ${Math.abs(daysTillDue)} days overdue!`}
                  {rentStatus.status === 'Due Today' && 'Rent is due today!'}
                  {rentStatus.status === 'Due Soon' && typeof daysTillDue === 'number' && `Rent due in ${daysTillDue} days`}
                </p>
                <p className="text-sm opacity-90">Please pay on time to avoid penalties</p>
              </div>
            </div>
          )}

          {/* Rent Status Card - Most Prominent */}
          <Card className={cn(
            "border-2 relative overflow-hidden",
            rentStatus?.color === 'success' && "border-success/30 bg-gradient-to-r from-success/5 to-success/10",
            rentStatus?.color === 'warning' && "border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10",
            rentStatus?.color === 'danger' && "border-danger/30 bg-gradient-to-r from-danger/5 to-danger/10"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
                  <p className="text-4xl font-bold">{typeof rentAmount === 'number' ? `$${rentAmount.toLocaleString()}` : '—'}</p>
                </div>
                {rentStatus?.status && (
                  <Badge variant={statusVariant}>
                    {rentStatus.status}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{upcomingDue?.due_date ? new Date(upcomingDue.due_date).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">
                    {activeTenancy?.unit?.property?.name || '—'}
                  </p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-semibold"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="mr-3" size={24} />
                {typeof rentAmount === 'number' ? `Pay $${rentAmount} Now` : 'Pay Rent'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                MTN MoMo • Airtel Money • Card • Bank Transfer
              </p>
            </CardContent>
          </Card>

          {/* Key Info Cards (real data only) */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <CardContent className="p-4">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                  "bg-success/10 text-success"
                )}>
                  <CheckCircle size={24} />
                </div>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Payments Made</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-2 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <p className="text-2xl font-bold">{typeof daysTillDue === 'number' && daysTillDue > 0 ? daysTillDue : 0}</p>
                <p className="text-xs text-muted-foreground">Days Left</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="w-12 h-12 rounded-full bg-muted text-foreground mx-auto mb-2 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <p className="text-2xl font-bold">{activeTenancy ? 1 : 0}</p>
                <p className="text-xs text-muted-foreground">Active Properties</p>
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

          {/* Profile Info */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Profile Info</h2>
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full name</p>
                  <p className="font-medium">{profile?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-medium">{profile?.id || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">—</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Search Section */}
          {showPropertySearch && (
            <PropertySearch onClose={() => setShowPropertySearch(false)} />
          )}

          {/* Property Details (only if linked via tenancy) */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Property Details</h2>
            {activeTenancy ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{activeTenancy.unit?.property?.name}</p>
                      <p className="text-sm text-muted-foreground">{activeTenancy.unit?.property?.address || '—'}</p>
                      <p className="text-sm text-muted-foreground">Unit: {activeTenancy.unit?.name || '—'}</p>
                    </div>
                    <Badge variant="secondary">{activeTenancy.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No property linked yet.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payments History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Payments</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{payment.tenancy?.unit?.property?.name} - {payment.tenancy?.unit?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${payment.amount}</p>
                      <Badge variant="outline" className="text-xs">{payment.status || 'Recorded'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {payments.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    No payments found.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Lease Agreements (schema not available) */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Lease Agreements</h2>
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                No agreements found.
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Requests (schema not available) */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Maintenance Requests</h2>
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                No maintenance requests found.
              </CardContent>
            </Card>
          </div>

          {/* Reminders removed: avoid fake content */}
        </div>
      </div>

      <PaymentOptionsModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={typeof rentAmount === 'number' ? rentAmount : 0}
      />
    </>
  );
};

export default TenantDashboard;