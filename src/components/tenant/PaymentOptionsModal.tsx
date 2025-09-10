import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}

const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({ isOpen, onClose, amount }) => {
  const paymentMethods = [
    {
      id: 'mtn-momo',
      name: 'MTN Mobile Money',
      description: 'Pay instantly with MTN MoMo',
      icon: Smartphone,
      color: 'bg-warning text-warning-foreground',
      popular: true,
    },
    {
      id: 'airtel-money',
      name: 'Airtel Money',
      description: 'Quick payment with Airtel Money',
      icon: Smartphone,
      color: 'bg-destructive text-destructive-foreground',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard accepted',
      icon: CreditCard,
      color: 'bg-primary text-primary-foreground',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank account transfer',
      icon: Building,
      color: 'bg-secondary text-secondary-foreground',
    },
  ];

  const handlePayment = (methodId: string) => {
    // Here you would integrate with actual payment providers
    console.log(`Processing payment of $${amount} via ${methodId}`);
    // For now, just close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-2xl font-bold">${amount}</p>
          </div>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handlePayment(method.id)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{method.name}</h3>
                        {method.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentOptionsModal;