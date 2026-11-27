import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SessionStatus } from './components/SessionStatus';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { canAccessPanel, panelHome } from './services/access';
import type { Role } from './types';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const StaffDashboardPage = lazy(() => import('./pages/StaffDashboardPage').then((module) => ({ default: module.StaffDashboardPage })));
const StaffProfilePage = lazy(() => import('./pages/StaffDashboardPage').then((module) => ({ default: module.StaffProfilePage })));
const ShopsPage = lazy(() => import('./pages/ShopsPage').then((module) => ({ default: module.ShopsPage })));
const SalespersonsPage = lazy(() => import('./pages/SalespersonsPage').then((module) => ({ default: module.SalespersonsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const PublicInvoicePage = lazy(() => import('./pages/PublicInvoicePage').then((module) => ({ default: module.PublicInvoicePage })));

const ProtectedRoute: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { user, token, isLoading, sessionError } = useAuth();
  if (isLoading || sessionError) return <SessionStatus />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!canAccessPanel(user.role, role)) return <Navigate to={panelHome(user.role)} replace />;
  return <>{children}</>;
};

const PanelRedirect = () => {
  const { user, token, isLoading, sessionError } = useAuth();
  const location = useLocation();
  if (isLoading || sessionError) return <SessionStatus />;
  if (!token || !user) return <Navigate to="/login" replace />;
  const legacyPages = ['/shops', '/products', '/invoices', '/salespersons', '/reports'];
  const suffix = legacyPages.includes(location.pathname) ? location.pathname + location.search : '';
  return <Navigate to={panelHome(user.role) + suffix} replace />;
};

export function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
  return (
    <AuthProvider>
      <BrowserRouter basename={base}>
        <Suspense fallback={<div className="session-loading" role="status">Loading your screen...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invoice/:id" element={<PublicInvoicePage />} />
          <Route path="/bill/:id" element={<PublicInvoicePage />} />
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="salespersons" element={<SalespersonsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="/staff" element={
            <ProtectedRoute role="SALESPERSON"><AdminLayout panel="staff" /></ProtectedRoute>
          }>
            <Route index element={<StaffDashboardPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="profile" element={<StaffProfilePage />} />
            <Route path="*" element={<Navigate to="/staff" replace />} />
          </Route>
          <Route path="*" element={<PanelRedirect />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
