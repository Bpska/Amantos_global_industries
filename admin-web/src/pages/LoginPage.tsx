import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      if (res.user.role !== 'ADMIN') {
        throw new Error('Access Restricted: This web console is reserved for Heylane System Administrators. Field sales representatives should use the field mobile application.');
      }
      login(res.token, res.user);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify administrator credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          {/* Official Heylane AGI Gold Emblem Logo */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src="/assets/agi-logo.jpg"
              alt="Heylane AGI Emblem"
              className="login-logo-emblem"
              onError={(e) => {
                // Fallback if image asset path needs dot or relative
                (e.target as HTMLImageElement).src = './assets/agi-logo.jpg';
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="login-brand-tag">
              <Sparkles size={12} color="#D4AF37" />
              <span>Executive Portal</span>
            </div>
          </div>

          <h1 className="login-title">HEYLANE</h1>
          <p className="login-sub">
            Enterprise Industrial & Retail Network
          </p>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
            Authoritative Node: <span className="login-domain-pill">industri.heylane.in</span>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            color: '#FCA5A5',
            fontSize: '13px',
            lineHeight: 1.4,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="heylane-label" style={{ margin: 0 }}>
                Administrator Username / ID
              </label>
              <button
                type="button"
                onClick={handleDemoFill}
                className="demo-shortcut-btn"
                title="Autofill default master admin credentials"
              >
                Use Demo Credentials
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="heylane-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter master username (e.g. admin)"
                required
                autoComplete="username"
              />
              <User
                size={16}
                color="#D4AF37"
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
                size={16}
                color="#D4AF37"
                style={{ position: 'absolute', left: '14px', top: '15px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-heylane-gold"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating Session…</span>
            ) : (
              <>
                <span>Sign In to Executive Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Quick Portal Switcher */}
        <div style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#94A3B8',
        }}>
          <span>Are you a Field Representative?</span>
          <a
            href="/"
            style={{
              color: '#F5E6BE',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderBottom: '1px dotted rgba(212, 175, 55, 0.6)',
              paddingBottom: '1px',
            }}
          >
            <span>Open Field App</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Security Trust Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px',
          fontSize: '11px',
          color: '#64748B',
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>TLS 1.3 Active · PostgreSQL Dedicated · industri.heylane.in</span>
        </div>
      </div>
    </div>
  );
};
