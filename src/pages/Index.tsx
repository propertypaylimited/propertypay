import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Building, Users, CreditCard, Star, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to Property Pay
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Manage your properties, tenancies, and payments with ease
            </p>
            <Button asChild size="lg">
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Building className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            PROPERTY PAY
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The complete property management solution for landlords and tenants. 
            Streamline rent payments, manage tenancies, and track property performance.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg">
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <Building className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Property Management</h3>
            <p className="text-muted-foreground">
              Manage multiple properties and units with ease
            </p>
          </div>
          <div className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tenancy Tracking</h3>
            <p className="text-muted-foreground">
              Handle applications and manage tenant relationships
            </p>
          </div>
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Processing</h3>
            <p className="text-muted-foreground">
              Secure rent payments and financial tracking
            </p>
          </div>
          <div className="text-center">
            <Star className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reviews & Ratings</h3>
            <p className="text-muted-foreground">
              Build trust with property ratings and reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
