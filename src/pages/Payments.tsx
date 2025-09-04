import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenancies } from '@/hooks/useTenancies';
import { CreditCard, Calendar, DollarSign, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  tenancy_id: string;
  amount: number;
  created_at: string;
  tenancy: {
    unit: {
      name: string;
      property: {
        name: string;
        address: string;
      };
    };
  };
}

const Payments = () => {
  const { user } = useAuth();
  const { tenancies } = useTenancies();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    tenancy_id: '',
    amount: '',
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenancy:tenancies (
            unit:units (
              name,
              property:properties (
                name,
                address
              )
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPayments((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          tenancy_id: formData.tenancy_id,
          amount: parseFloat(formData.amount),
        }]);

      if (error) throw error;

      toast({
        title: "Payment recorded successfully",
        description: "The payment has been added to the system.",
      });

      setFormData({ tenancy_id: '', amount: '' });
      setShowPaymentModal(false);
      await fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const activeTenancies = tenancies.filter(t => t.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const monthlyPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    const currentMonth = new Date();
    return paymentDate.getMonth() === currentMonth.getMonth() && 
           paymentDate.getFullYear() === currentMonth.getFullYear();
  });
  const monthlyTotal = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            Track and manage rent payments
          </p>
        </div>
        
        {user && (
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Add a new rent payment to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenancy">Select Tenancy</Label>
                  <Select value={formData.tenancy_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, tenancy_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tenancy" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTenancies.map((tenancy) => (
                        <SelectItem key={tenancy.id} value={tenancy.id}>
                          {tenancy.unit?.property?.name} - {tenancy.unit?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter payment amount"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Record Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Payment Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyPayments.length} payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments.length > 0 ? (totalPayments / payments.length).toFixed(0) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent rent payments and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {payment.tenancy?.unit?.property?.name} - {payment.tenancy?.unit?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${payment.amount}</p>
                  <Badge variant="default" className="text-xs">
                    Completed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          {payments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Payment history will appear here once transactions are recorded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;