import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenancies } from '@/hooks/useTenancies';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CreditCard, FileText, Wrench, MessageSquare, Search, MapPin, Calendar } from 'lucide-react';
import PaymentOptionsModal from '@/components/tenant/PaymentOptionsModal';
import PropertySearch from '@/components/tenant/PropertySearch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type Payment = {
  id: string;
  amount: number;
  created_at: string | null;
  status: string | null;
  due_date: string | null;
  tenancy?: {
    unit?: {
      name?: string | null;
      rent_amount?: number | null;
      property?: {
        id: string;
        name: string;
        address: string | null;
      } | null;
    } | null;
  } | null;
};

type Agreement = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  status?: string | null;
  tenancy_id?: string | null;
  property_id?: string | null;
};

type MaintenanceRequest = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  status?: string | null;
  tenancy_id?: string | null;
  property_id?: string | null;
};

const TenantDashboard = () => {
  const { profile } = useAuth();
  const { tenancies } = useTenancies();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [upcomingPayment, setUpcomingPayment] = useState<Payment | null>(null);
  const [agreements, setAgreements] = useState<Agreement[] | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Get active tenancy (assuming one active tenancy per tenant)
  const activeTenancy = useMemo(() => tenancies.find(t => t.status === 'active'), [tenancies]);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const tenancyIds = tenancies.map(t => t.id);
        const propertyIds = tenancies
          .map(t => t.unit?.property?.id)
          .filter((id): id is string => Boolean(id));
        // Payments (recent)
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id, amount, created_at, status, due_date,
            tenancy:tenancies (
              unit:units (
                name, rent_amount,
                property:properties (id, name, address)
              )
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        if (paymentsError) throw paymentsError;
        if (!isMounted) return;
        setPayments((paymentsData || []) as unknown as Payment[]);

        // Upcoming payment (earliest pending/overdue by due_date)
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('payments')
          .select('id, amount, created_at, status, due_date')
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(1);
        if (upcomingError) throw upcomingError;
        if (!isMounted) return;
        setUpcomingPayment((upcomingData && upcomingData[0]) ? (upcomingData[0] as Payment) : null);

        // Agreements (optional table)
        try {
          let agreementsQuery = supabase
            .from('agreements' as any)
            .select('id, created_at, title, status, tenancy_id, property_id')
            .order('created_at', { ascending: false })
            .limit(5);
          if (tenancyIds.length > 0 && propertyIds.length > 0) {
            agreementsQuery = (agreementsQuery as any).or(`tenancy_id.in.(${tenancyIds.join(',')}),property_id.in.(${propertyIds.join(',')})`);
          } else if (tenancyIds.length > 0) {
            agreementsQuery = agreementsQuery.in('tenancy_id', tenancyIds);
          } else if (propertyIds.length > 0) {
            agreementsQuery = agreementsQuery.in('property_id', propertyIds);
          }
          const { data: agreementsData, error: agreementsError } = await agreementsQuery as any;
          if (agreementsError) throw agreementsError;
          if (!isMounted) return;
          setAgreements((agreementsData || []) as Agreement[]);
        } catch (err: any) {
          if (isMounted) setAgreements(null);
        }

        // Maintenance Requests (optional table)
        try {
          let mrQuery = supabase
            .from('maintenance_requests' as any)
            .select('id, created_at, title, status, tenancy_id, property_id')
            .order('created_at', { ascending: false })
            .limit(5);
          if (tenancyIds.length > 0 && propertyIds.length > 0) {
            mrQuery = (mrQuery as any).or(`tenancy_id.in.(${tenancyIds.join(',')}),property_id.in.(${propertyIds.join(',')})`);
          } else if (tenancyIds.length > 0) {
            mrQuery = mrQuery.in('tenancy_id', tenancyIds);
          } else if (propertyIds.length > 0) {
            mrQuery = mrQuery.in('property_id', propertyIds);
          }
          const { data: mrData, error: mrError } = await mrQuery as any;
          if (mrError) throw mrError;
          if (!isMounted) return;
          setMaintenanceRequests((mrData || []) as MaintenanceRequest[]);
        } catch (err: any) {
          if (isMounted) setMaintenanceRequests(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [tenancies]);
  
  const rentInfo = useMemo(() => {
    if (!upcomingPayment || !upcomingPayment.due_date) return null;
    const due = new Date(upcomingPayment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let label = 'Current';
    let color = 'success';
    let urgent = false;
    if (upcomingPayment.status === 'overdue' || diffDays < 0) {
      label = 'Overdue';
      color = 'danger';
      urgent = true;
    } else if (diffDays === 0) {
      label = 'Due Today';
      color = 'warning';
      urgent = true;
    } else if (diffDays <= 7) {
      label = 'Due Soon';
      color = 'warning';
      urgent = true;
    }
    return { due, diffDays, label, color, urgent };
  }, [upcomingPayment]);

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
                  {(profile?.full_name || profile?.email || '')?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">Welcome back,</p>
                <p className="text-lg font-bold">{profile?.full_name || profile?.email || ''}</p>
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
          {/* Profile Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile?.full_name || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{profile?.email || ''}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{(profile as any)?.phone || ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Property Details</h2>
              </div>
              {activeTenancy ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Property</p>
                      <p className="font-medium">{activeTenancy.unit?.property?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unit</p>
                      <p className="font-medium">{activeTenancy.unit?.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{activeTenancy.unit?.property?.address || ''}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No property linked yet.</p>
                  <p className="text-sm text-muted-foreground">Apply for a tenancy to link a property.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Payments</h2>
            {rentInfo && upcomingPayment ? (
              <Card className={cn(
                "border-2 relative overflow-hidden",
                rentInfo.color === 'success' && "border-success/30 bg-gradient-to-r from-success/5 to-success/10",
                rentInfo.color === 'warning' && "border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10",
                rentInfo.color === 'danger' && "border-danger/30 bg-gradient-to-r from-danger/5 to-danger/10"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                      <p className="text-4xl font-bold">${(upcomingPayment.amount || 0).toLocaleString()}</p>
                    </div>
                    <Badge variant={rentInfo.label === 'Overdue' ? 'destructive' : rentInfo.label === 'Due Today' ? 'secondary' : 'outline'}>
                      {rentInfo.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{rentInfo.due.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Property</p>
                      <p className="font-semibold">{activeTenancy?.unit?.property?.name || ''}</p>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-semibold"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <CreditCard className="mr-3" size={24} />
                    Pay ${(upcomingPayment.amount || 0).toLocaleString()} Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-6">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No upcoming payments found</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Recent Payments</h3>
                </div>
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {p.tenancy?.unit?.property?.name || 'Property'} {p.tenancy?.unit?.name ? `- ${p.tenancy?.unit?.name}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${(p.amount || 0).toLocaleString()}</p>
                        <Badge variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                          {p.status || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {payments.length === 0 && (
                  <div className="text-center py-6">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No payments found</p>
                  </div>
                )}
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

          {/* Agreements Section (if available) */}
          {agreements !== null && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Lease Agreements</h2>
                </div>
                {agreements.length > 0 ? (
                  <div className="space-y-2">
                    {agreements.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{a.title || `Agreement ${a.id.substring(0, 6)}`}</p>
                          <p className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</p>
                        </div>
                        {a.status && (
                          <Badge variant="outline" className="text-xs">{a.status}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No agreements found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Maintenance Requests Section (if available) */}
          {maintenanceRequests !== null && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Maintenance Requests</h2>
                </div>
                {maintenanceRequests.length > 0 ? (
                  <div className="space-y-2">
                    {maintenanceRequests.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{m.title || `Request ${m.id.substring(0, 6)}`}</p>
                          <p className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</p>
                        </div>
                        {m.status && (
                          <Badge variant="secondary" className="text-xs">{m.status}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No maintenance requests found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PaymentOptionsModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={upcomingPayment?.amount || 0}
      />
    </>
  );
};

export default TenantDashboard;