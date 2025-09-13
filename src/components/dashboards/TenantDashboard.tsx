import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CreditCard, AlertTriangle, Search } from 'lucide-react';
import PaymentOptionsModal from '@/components/tenant/PaymentOptionsModal';
import PropertySearch from '@/components/tenant/PropertySearch';
import { cn } from '@/lib/utils';
import ProfileInfo from '@/components/tenant/ProfileInfo';
import PropertyDetailsCard from '@/components/tenant/PropertyDetailsCard';
import AgreementsList from '@/components/tenant/AgreementsList';
import PaymentsList from '@/components/tenant/PaymentsList';
import MaintenanceRequestsList from '@/components/tenant/MaintenanceRequestsList';
import { usePayments } from '@/hooks/usePayments';

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { tenancies } = useTenancies();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);

  // Get active tenancy (assuming one active tenancy per tenant)
  const activeTenancy = tenancies.find(t => t.status === 'active');
  const rentAmount = activeTenancy?.unit?.rent_amount || 0;

  // Next due date is derived from latest unpaid payment due_date or next interval; fallback to null
  const { payments } = usePayments();
  const relevantPayments = payments.filter(p => activeTenancy && p.tenancy_id === activeTenancy.id);
  const nextDueDate = (() => {
    const withDue = relevantPayments.filter(p => p.due_date);
    if (withDue.length === 0) return null;
    const next = withDue.sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())[0];
    return next?.due_date ? new Date(next.due_date) : null;
  })();
  const daysTillDue = nextDueDate ? Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  
  // Determine rent status and color
  const getRentStatus = () => {
    if (daysTillDue === null) return { status: 'No Due', color: 'success', urgent: false };
    if (daysTillDue < 0) return { status: 'Overdue', color: 'danger', urgent: true };
    if (daysTillDue === 0) return { status: 'Due Today', color: 'warning', urgent: true };
    if (daysTillDue <= 7) return { status: 'Due Soon', color: 'warning', urgent: true };
    return { status: 'Current', color: 'success', urgent: false };
  };

  const rentStatus = getRentStatus();
  const outstandingBalance = 0;
  const totalDue = rentAmount + outstandingBalance;

  const quickActions = [
    {
      title: 'Search Properties',
      description: 'Find new rentals',
      icon: Search,
      color: 'bg-primary/10 text-primary border-primary/20',
      action: () => setShowPropertySearch(!showPropertySearch),
    },
    // Other actions can be added via navigation in future
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
                  {daysTillDue !== null ? (
                    rentStatus.status === 'Overdue' 
                      ? `Rent is ${Math.abs(daysTillDue)} days overdue!`
                      : rentStatus.status === 'Due Today'
                      ? 'Rent is due today!'
                      : `Rent due in ${daysTillDue} days`
                  ) : 'No rent due at the moment'}
                </p>
                <p className="text-sm opacity-90">Pay now to avoid late fees</p>
              </div>
            </div>
          )}

          {/* Rent Status Card - only if tenancy or due info exists */}
          {(activeTenancy || nextDueDate) && (
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
                  <p className="font-semibold">{nextDueDate ? nextDueDate.toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">
                    {activeTenancy?.unit?.property?.name || '—'}
                  </p>
                </div>
              </div>

              {activeTenancy && (
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-semibold"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="mr-3" size={24} />
                Pay ${totalDue} Now
              </Button>
              )}
              <p className="text-xs text-center text-muted-foreground mt-2">
                MTN MoMo • Airtel Money • Card • Bank Transfer
              </p>
            </CardContent>
          </Card>
          )}

          {/* Profile & Property Sections */}
          <div className="grid gap-3">
            <ProfileInfo />
            <PropertyDetailsCard tenancy={activeTenancy} />
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

          {/* Agreements, Payments, Maintenance Sections */}
          {tenancies.length > 0 && (
            <AgreementsList tenancyIds={tenancies.map(t => t.id)} />
          )}

          {tenancies.length > 0 && (
            <PaymentsList tenancyIds={tenancies.map(t => t.id)} />
          )}

          <MaintenanceRequestsList tenantId={profile?.id} propertyId={activeTenancy?.unit?.property?.id} />

          {/* No fake reminders or activity feed */}
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