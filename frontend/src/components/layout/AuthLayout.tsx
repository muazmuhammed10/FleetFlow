import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/ui/Spinner';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;
  // If already logged in, go to dashboard instead of showing login/register
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
