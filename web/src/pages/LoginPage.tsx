import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getApiErrorMessage } from '../services/api';
import { SessionStatus } from '../components/SessionStatus';
import { HeyLaneLogo } from '../components/HeyLaneLogo';
import { InstallAppButton } from '../components/InstallAppButton';
import { panelHome } from '../services/access';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user, token, isLoading, sessionError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      login(res.token, res.user);
      navigate(panelHome(res.user.role), { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Authentication failed. Please verify credentials.'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || sessionError) return <SessionStatus />;
  if (token && user) return <Navigate to={panelHome(user.role)} replace />;

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

        {error && (
          <div className="login-error-box" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="username" className="heylane-label" style={{ marginBottom: '8px' }}>
              Username / Account ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="heylane-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin or staff handle)"
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
            <label htmlFor="password" className="heylane-label">Security Keyphrase</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
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
