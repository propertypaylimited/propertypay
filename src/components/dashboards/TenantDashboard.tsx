import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CreditCard, AlertTriangle, CheckCircle, Clock, FileText, Wrench, MessageSquare, Search } from 'lucide-react';
import PaymentOptionsModal from '@/components/tenant/PaymentOptionsModal';
import PropertySearch from '@/components/tenant/PropertySearch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const TenantDashboard = () => {
  const { profile, user } = useAuth();
  const { tenancies } = useTenancies();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Active tenancy if present
  const activeTenancy = useMemo(() => tenancies.find(t => t.status === 'active'), [tenancies]);

  // Aggregate payment history across user's tenancies
  const payments = useMemo(() => {
    return tenancies.flatMap(t => (t.payments || []).map(p => ({ ...p, tenancy_id: p.tenancy_id ?? t.id })));
  }, [tenancies]);

  // Determine next due payment from real data (if any due_date exists)
  const nextDuePayment = useMemo(() => {
    const withDue = payments.filter(p => p.due_date);
    if (withDue.length === 0) return null;
    return withDue.sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())[0];
  }, [payments]);

  const nextDueDate = nextDuePayment?.due_date ? new Date(nextDuePayment.due_date) : null;
  const daysTillDue = nextDueDate ? Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  
  // Determine rent status and color
  const getRentStatus = () => {
    if (daysTillDue === null) return null;
    if (daysTillDue < 0) return { status: 'Overdue', color: 'danger', urgent: true } as const;
    if (daysTillDue === 0) return { status: 'Due Today', color: 'warning', urgent: true } as const;
    if (daysTillDue <= 7) return { status: 'Due Soon', color: 'warning', urgent: true } as const;
    return { status: 'Current', color: 'success', urgent: false } as const;
  };

  const rentStatus = getRentStatus();

  const totalDue = nextDuePayment?.amount ?? 0;

  // Attempt to fetch agreements and maintenance requests if tables exist
  useEffect(() => {
    const fetchExtras = async () => {
      if (!user) return;
      setLoadingExtras(true);
      try {
        const tenancyIds = tenancies.map(t => t.id);
        const propertyIds = Array.from(new Set(tenancies.map(t => t.unit?.property?.id).filter(Boolean)));

        // Agreements (best-effort; table may not exist yet)
        try {
          const { data: agreementsData } = await supabase
            .from('agreements' as any)
            .select('*')
            .in('tenancy_id' as any, tenancyIds);
          setAgreements(agreementsData || []);
        } catch (_e) {
          setAgreements([]);
        }

        // Maintenance requests (best-effort; table may not exist yet)
        try {
          if (propertyIds.length > 0) {
            const { data: maintByProperty } = await supabase
              .from('maintenance_requests' as any)
              .select('*')
              .in('property_id' as any, propertyIds as any);
            setMaintenanceRequests(maintByProperty || []);
          } else {
            // fallback by tenant id if available
            const { data: maintByTenant } = await supabase
              .from('maintenance_requests' as any)
              .select('*')
              .eq('tenant_id' as any, user.id);
            setMaintenanceRequests(maintByTenant || []);
          }
        } catch (_e) {
          setMaintenanceRequests([]);
        }
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchExtras();
  }, [user, tenancies]);

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
                <p className="text-lg font-bold">{profile?.full_name || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
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
                  {rentStatus.status === 'Overdue' 
                    ? `Rent is ${Math.abs(daysTillDue as number)} days overdue!`
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
          {nextDuePayment && (
          <Card className={cn(
            "border-2 relative overflow-hidden",
            rentStatus?.color === 'success' && "border-success/30 bg-gradient-to-r from-success/5 to-success/10",
            rentStatus?.color === 'warning' && "border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10",
            rentStatus?.color === 'danger' && "border-danger/30 bg-gradient-to-r from-danger/5 to-danger/10"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Rent</p>
                  <p className="text-4xl font-bold">${totalDue.toLocaleString()}</p>
                </div>
                <Badge>
                  {rentStatus?.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{nextDueDate?.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-semibold">
                    {tenancies.find(t => t.id === nextDuePayment.tenancy_id)?.unit?.property?.name || '—'}
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
          )}

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
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Payments Made</p>
              </CardContent>
            </Card>
            {daysTillDue !== null && (
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-2 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <p className="text-2xl font-bold">{daysTillDue > 0 ? daysTillDue : 0}</p>
                <p className="text-xs text-muted-foreground">Days Left</p>
              </CardContent>
            </Card>
            )}
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

          {/* Profile Info */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Profile</h2>
            <Card>
              <CardContent className="p-4">
                {profile ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No profile info found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Property Details</h2>
            </div>
            {tenancies.length > 0 ? (
              <div className="space-y-3">
                {tenancies.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t.unit?.property?.name} • {t.unit?.name}</p>
                          <p className="text-sm text-muted-foreground">{t.unit?.property?.address || ''}</p>
                        </div>
                        <Badge>{t.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">No property linked yet.</CardContent>
              </Card>
            )}
          </div>

          {/* Payments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Payments</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(true)}>Make Payment</Button>
            </div>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {tenancies.find(t => t.id === p.tenancy_id)?.unit?.property?.name} • {tenancies.find(t => t.id === p.tenancy_id)?.unit?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${p.amount}</p>
                        <Badge className="text-xs">{p.status || 'Completed'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">No payments found.</CardContent>
              </Card>
            )}
          </div>

          {/* Lease Agreements */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Lease Agreements</h2>
            {agreements.length > 0 ? (
              <div className="space-y-3">
                {agreements.map((a: any) => (
                  <Card key={a.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Agreement #{a.id}</p>
                        {a.start_date && (
                          <p className="text-xs text-muted-foreground">Start: {new Date(a.start_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Badge>{a.status || 'Active'}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">No agreements found.</CardContent>
              </Card>
            )}
          </div>

          {/* Maintenance Requests */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Maintenance Requests</h2>
            {loadingExtras ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">Loading...</CardContent>
              </Card>
            ) : maintenanceRequests.length > 0 ? (
              <div className="space-y-3">
                {maintenanceRequests.map((m: any) => (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{m.title || 'Request'}</p>
                        {m.created_at && (
                          <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Badge>{m.status || 'Open'}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">No maintenance requests found.</CardContent>
              </Card>
            )}
          </div>

          {/* End of content */}
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