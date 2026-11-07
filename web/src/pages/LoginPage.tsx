import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HeyLaneLogo } from '../components/HeyLaneLogo';
import { InstallAppButton } from '../components/InstallAppButton';
import { panelHome } from '../services/access';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user, token, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      login(res.token, res.user);
      navigate(panelHome(res.user.role), { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoading && token && user) return <Navigate to={panelHome(user.role)} replace />;

  return (
    <div className="login-page">
      {/* Audience Bar */}
      <div className="login-audience-bar">
        <span>Discover your neighbourhood</span>
        <a href="https://heylane.in" target="_blank" rel="noopener noreferrer">
          HeyLane Unified Portal · heylane.in
        </a>
      </div>

      <div className="login-card">
        <div className="login-header">
          {/* Official HeyLane Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <HeyLaneLogo variant="master" height={42} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="login-brand-tag">
              <Sparkles size={13} color="#007F5F" />
              <span>Unified Access · Staff & Admin</span>
            </div>
          </div>

          <h1 className="login-title">
            Sign In to <span>HeyLane</span>
          </h1>
          <p className="login-sub">
            One unified login for Field Sales Representatives & Business Administrators
          </p>
        </div>

        {/* Instant 1-Tap Demo Logins */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            Instant 1-Tap Demo Logins
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoFill('sp_rajesh', 'Sales@123Rajesh')}
              className="demo-shortcut-btn"
              style={{ flex: 1, padding: '8px', textAlign: 'center' }}
            >
              <div>Staff Rep: Rajesh</div>
              <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 500 }}>sp_rajesh</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin', 'AdminPassword@123')}
              className="demo-shortcut-btn"
              style={{
                flex: 1,
                padding: '8px',
                textAlign: 'center',
                backgroundColor: '#FAFDFB',
              }}
            >
              <div>Administrator</div>
              <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 500 }}>admin</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error-box">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label className="heylane-label" style={{ marginBottom: '8px' }}>
              Username / Account ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="heylane-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. sp_rajesh or admin)"
                required
                autoComplete="username"
              />
              <User
                size={17}
                color="#007F5F"
                style={{ position: 'absolute', left: '14px', top: '15px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label className="heylane-label">Security Keyphrase</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="heylane-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
              <Lock
                size={17}
                color="#007F5F"
                style={{ position: 'absolute', left: '14px', top: '15px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-heylane-primary"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating Session…</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Install / Download Application Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <InstallAppButton variant="pill" style={{ width: '100%', justifyContent: 'center', height: '42px', borderRadius: '10px' }} />
        </div>

        {/* Unified Role Explanation */}
        <div
          style={{
            marginTop: '18px',
            padding: '12px',
            backgroundColor: 'var(--subtle)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.45,
          }}
        >
          <CheckCircle2 size={16} color="#007F5F" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Unified Sign In: Log in with Admin credentials to access the Executive Console, or Sales Rep credentials for Field Operations on the same portal.
          </span>
        </div>

        {/* Security Trust Badges */}
        <div className="login-security-badge">
          <ShieldCheck size={14} color="#007F5F" />
          <span>Admin & Staff Access · HeyLane</span>
        </div>
      </div>
    </div>
  );
};
