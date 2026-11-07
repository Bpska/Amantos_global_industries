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
  UserRound,
  House,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HeyLaneLogo } from './HeyLaneLogo';
import { InstallAppButton } from './InstallAppButton';

export const AdminLayout: React.FC<{ panel?: 'admin' | 'staff' }> = ({ panel = 'admin' }) => {
  const isStaff = panel === 'staff';
  const panelName = isStaff ? 'Staff Panel' : 'Admin Console';
  const home = isStaff ? '/staff' : '/admin';
  const navItems = isStaff ? [
    { path: home, label: 'Home', icon: House },
    { path: `${home}/shops`, label: 'Retailers', icon: Store },
    { path: `${home}/invoices`, label: 'Orders', icon: Receipt },
    { path: `${home}/profile`, label: 'Profile', icon: UserRound },
  ] : [
    { path: home, label: 'Executive Overview', icon: LayoutDashboard },
    { path: `${home}/shops`, label: 'Retailers Directory', icon: Store },
    { path: `${home}/products`, label: 'Product Catalog', icon: Package },
    { path: `${home}/invoices`, label: 'Billing & Invoices', icon: Receipt },
    { path: `${home}/salespersons`, label: 'Field Sales Team', icon: Users },
    { path: `${home}/reports`, label: 'Analytics & Audit', icon: BarChart3 },
  ];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(`heylane_${panel}_theme`) as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(`heylane_${panel}_theme`, theme);
  }, [theme, panel]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    if (window.confirm(`Sign out of the HeyLane ${panelName}?`)) {
      logout();
      navigate('/login');
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const initial = (user?.name?.[0] || user?.username?.[0] || 'A').toUpperCase();

  const getPageTitle = () => navItems.find((item) => item.path === location.pathname)?.label || panelName;

  return (
    <div className={`app-container${isStaff ? ' staff-panel' : ''}`}>
      {/* Mobile Backdrop Overlay */}
      {!isStaff && mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      {/* Sidebar */}
      {!isStaff && <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeyLaneLogo variant="symbol" height={32} />
            <div className="sidebar-brand-text">
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Hey<span style={{ color: '#007F5F' }}>Lane</span>
              </h1>
              <span style={{ fontSize: '10px', color: '#007F5F', fontWeight: 700, letterSpacing: '0.8px' }}>
                {isStaff ? 'STAFF PANEL' : 'ADMIN CONSOLE'}
              </span>
            </div>
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

        <nav className="sidebar-nav" aria-label={panelName}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === home} onClick={closeMobile}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'var(--subtle)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} color="#007F5F" />
              <span style={{ fontWeight: 600 }}>PWA: Offline Ready</span>
            </div>
            <span style={{ fontSize: '10px', color: '#007F5F', fontWeight: 700 }}>
              STANDALONE
            </span>
          </div>

          <div className="user-profile-bar">
            <div className="user-avatar">{initial}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || user?.username || 'Administrator'}</div>
              <div className="user-role">{isStaff ? 'FIELD REPRESENTATIVE' : 'SYSTEM ADMIN'}</div>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>}

      {/* Main Area */}
      <div className="main-content">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger button for mobile/tablet */}
            {!isStaff && <button
              className="hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Menu"
            >
              <Menu size={22} />
            </button>}

            {isStaff && <HeyLaneLogo variant="symbol" height={30} />}

            <div>
              <div className="breadcrumb-row">
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#007F5F',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  HeyLane
                </span>
                <span style={{ color: 'var(--border)' }}>/</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                  {getPageTitle()}
                </span>
              </div>
              <h2 className="mobile-header-title">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="top-nav-actions">
            {/* Install App Button */}
            <InstallAppButton variant="nav" />

            {/* Theme Toggle Button */}
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
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Canvas'} Theme`}
            >
              {theme === 'light' ? (
                <Sun size={14} color="#007F5F" />
              ) : (
                <Moon size={14} color="#FBBF24" />
              )}
              <span>{theme === 'light' ? 'Canvas' : 'Dark'}</span>
            </button>

            <div className="status-indicator">
              <span className="live-dot"></span>
              <span className="status-indicator-text">PWA Active</span>
            </div>

            <div className="secure-badge">
              <ShieldCheck size={14} color="#007F5F" />
              <span>{isStaff ? 'Staff Access' : 'Admin Access'}</span>
            </div>

            {isStaff && <button
              onClick={handleLogout}
              className="btn btn-outline staff-signout"
              aria-label="Sign out of staff panel"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>}
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>

      {isStaff && <nav className="staff-bottom-nav" aria-label="Staff navigation">
        <div className="staff-bottom-nav-items">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === home}
              className={({ isActive }) => `staff-tab${isActive ? ' active' : ''}`}>
              <span className="staff-tab-icon"><Icon size={22} aria-hidden="true" /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>}
    </div>
  );
};
