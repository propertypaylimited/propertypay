import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';

const Auth = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'signin' | 'signup' | null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthForm defaultMode={mode || 'signin'} />;
};

export default Auth;