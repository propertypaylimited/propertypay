import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import LandlordDashboard from '@/components/dashboards/LandlordDashboard';
import TenantDashboard from '@/components/dashboards/TenantDashboard';

const Dashboard = () => {
  const { profile, isAdmin, isLandlord, isTenant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isLandlord) {
    return <LandlordDashboard />;
  }

  if (isTenant) {
    return <TenantDashboard />;
  }

  // Fallback for users without proper role assignment
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome to Property Pay</h2>
        <p className="text-muted-foreground">Please contact an administrator to set up your account role.</p>
      </div>
    </div>
  );
};

export default Dashboard;