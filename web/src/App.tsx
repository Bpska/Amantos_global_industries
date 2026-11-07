import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StaffDashboardPage, StaffProfilePage } from './pages/StaffDashboardPage';
import { ShopsPage } from './pages/ShopsPage';
import { SalespersonsPage } from './pages/SalespersonsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { canAccessPanel, panelHome } from './services/access';
import type { Role } from './types';

const SessionLoading = () => (
  <div className="session-loading" role="status">
    <RefreshCw size={28} className="animate-spin" />
    <p>Opening your HeyLane panel...</p>
  </div>
);

const ProtectedRoute: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { user, token, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!canAccessPanel(user.role, role)) return <Navigate to={panelHome(user.role)} replace />;
  return <>{children}</>;
};

const PanelRedirect = () => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <SessionLoading />;
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
