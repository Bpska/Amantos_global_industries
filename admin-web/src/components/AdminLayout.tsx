import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck,
  Radio,
  Menu,
  X,
  Sun,
  Moon,
  Package,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('retailflow_admin_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('retailflow_admin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Admin Portal?')) {
      logout();
      navigate('/login');
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const initial = (user?.name?.[0] || user?.username?.[0] || 'A').toUpperCase();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Executive Overview';
    if (location.pathname.startsWith('/shops')) return 'Retailer Master';
    if (location.pathname.startsWith('/products')) return 'Product & SKU Catalog';
    if (location.pathname.startsWith('/invoices')) return 'Billing & Invoices';
    if (location.pathname.startsWith('/salespersons')) return 'Field Sales Team';
    if (location.pathname.startsWith('/reports')) return 'Financial Reports';
    return 'Admin Console';
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-icon">
            <Store size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h1>RetailFlow</h1>
            <span>ADMIN CONSOLE</span>
          </div>
          {/* Mobile close button */}
          <button
            className="mobile-close-btn"
            onClick={closeMobile}
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Executive Overview</span>
          </NavLink>

          <NavLink
            to="/shops"
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Store size={18} />
            <span>Retailers Master</span>
          </NavLink>

          <NavLink
            to="/products"
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>Product Catalog</span>
          </NavLink>

          <NavLink
            to="/invoices"
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Receipt size={18} />
            <span>Billing & Invoices</span>
          </NavLink>

          <NavLink
            to="/salespersons"
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Field Sales Force</span>
          </NavLink>

          <NavLink
            to="/reports"
            onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            <span>Analytics & Audit</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#94A3B8',
          }}>
            <Radio size={14} color="#10B981" />
            <span>PostgreSQL API :5000</span>
          </div>

          <div className="user-profile-bar">
            <div className="user-avatar">{initial}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || user?.username || 'Administrator'}</div>
              <div className="user-role">SYSTEM ADMIN</div>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-content">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger button for mobile/tablet */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="breadcrumb-row">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  RetailFlow Suite
                </span>
                <span style={{ color: '#CBD5E1' }}>/</span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{getPageTitle()}</span>
              </div>
              <h2 className="mobile-header-title">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="top-nav-actions">
            {/* Theme Toggle Button (Both Options Present) */}
            <button
              onClick={toggleTheme}
              className="btn btn-outline"
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'White'} Theme`}
            >
              {theme === 'light' ? <Sun size={14} color="#D97706" /> : <Moon size={14} color="#FBBF24" />}
              <span>{theme === 'light' ? 'White Theme' : 'Dark Theme'}</span>
            </button>

            <div className="status-indicator">
              <span className="live-dot"></span>
              <span className="status-indicator-text">Cloud Live</span>
            </div>

            <div className="secure-badge">
              <ShieldCheck size={14} color="#1D4ED8" />
              <span>TLS 1.3</span>
            </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
