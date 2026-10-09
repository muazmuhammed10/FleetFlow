import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { PageSpinner } from './components/ui/Spinner';
import { useAuth } from './contexts/AuthContext';

// Landing & Auth pages (eager)
import LandingPage          from './pages/landing/LandingPage';
import LoginPage            from './pages/auth/LoginPage';
import RegisterPage         from './pages/auth/RegisterPage';
import ForgotPasswordPage   from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage    from './pages/auth/ResetPasswordPage';

// App pages (lazy)
const DashboardPage      = lazy(() => import('./pages/dashboard/DashboardPage'));
const VehiclesPage       = lazy(() => import('./pages/vehicles/VehiclesPage'));
const VehicleDetailPage  = lazy(() => import('./pages/vehicles/VehicleDetailPage'));
const VehicleFormPage    = lazy(() => import('./pages/vehicles/VehicleFormPage'));
const BookingsPage       = lazy(() => import('./pages/bookings/BookingsPage'));
const BookingDetailPage  = lazy(() => import('./pages/bookings/BookingDetailPage'));
const NewBookingPage     = lazy(() => import('./pages/bookings/NewBookingPage'));
const BookingPaymentPage = lazy(() => import('./pages/bookings/BookingPaymentPage'));
const CustomersPage      = lazy(() => import('./pages/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'));
const ContractsPage      = lazy(() => import('./pages/contracts/ContractsPage'));
const PaymentsPage       = lazy(() => import('./pages/payments/PaymentsPage'));
const MaintenancePage    = lazy(() => import('./pages/maintenance/MaintenancePage'));
const MaintenanceFormPage = lazy(() => import('./pages/maintenance/MaintenanceFormPage'));
const DriversPage        = lazy(() => import('./pages/drivers/DriversPage'));
const ReportsPage        = lazy(() => import('./pages/reports/ReportsPage'));
const NotificationsPage  = lazy(() => import('./pages/notifications/NotificationsPage'));
const ProfilePage        = lazy(() => import('./pages/profile/ProfilePage'));
const AuditLogPage       = lazy(() => import('./pages/audit/AuditLogPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'));

// Smart home: if logged in → dashboard, else → landing
function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              {/* ── Home: landing or dashboard ── */}
              <Route path="/" element={<HomeRoute />} />

              {/* ── Auth routes (redirect to dashboard if already logged in) ── */}
              <Route element={<AuthLayout />}>
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/register"        element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
              </Route>

              {/* ── Protected app routes ── */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard"         element={<DashboardPage />} />

                <Route path="/vehicles"          element={<VehiclesPage />} />
                <Route path="/vehicles/new"      element={<VehicleFormPage />} />
                <Route path="/vehicles/:id"      element={<VehicleDetailPage />} />
                <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />

                <Route path="/bookings"          element={<BookingsPage />} />
                <Route path="/bookings/new"      element={<NewBookingPage />} />
                <Route path="/bookings/:id"      element={<BookingDetailPage />} />
                <Route path="/bookings/:id/pay"  element={<BookingPaymentPage />} />

                <Route path="/customers"         element={<CustomersPage />} />
                <Route path="/customers/:id"     element={<CustomerDetailPage />} />
                <Route path="/contracts"         element={<ContractsPage />} />
                <Route path="/payments"          element={<PaymentsPage />} />
                <Route path="/maintenance"       element={<MaintenancePage />} />
                <Route path="/maintenance/new"   element={<MaintenanceFormPage />} />
                <Route path="/maintenance/:id/edit" element={<MaintenanceFormPage />} />
                <Route path="/drivers"           element={<DriversPage />} />
                <Route path="/reports"           element={<ReportsPage />} />
                <Route path="/notifications"     element={<NotificationsPage />} />
                <Route path="/profile"           element={<ProfilePage />} />

                <Route path="/audit"             element={<AuditLogPage />} />
                <Route path="/inspections/*"     element={<Navigate to="/bookings" replace />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
