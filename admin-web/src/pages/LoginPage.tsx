import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ username: username.trim(), password });
      if (res.user.role !== 'ADMIN') {
        throw new Error('Access Restricted: This web console is reserved for System Administrators. Field sales representatives should use the field mobile application.');
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
          <div className="login-logo">
            <Store size={32} />
          </div>
          <h1 className="login-title">RetailFlow Portal</h1>
          <p className="login-sub">Enterprise Web Management Console</p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            color: '#DC2626',
            fontSize: '13px',
            lineHeight: 1.4,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Administrator Username / ID</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                autoComplete="username"
              />
              <User
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '13px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Security Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
              <Lock
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '13px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Verifying Credentials…</span>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #E2E8F0',
          fontSize: '12px',
          color: '#94A3B8',
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>PostgreSQL Active · TLS 1.3 · Production Auth</span>
        </div>
      </div>
    </div>
  );
};
