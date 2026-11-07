import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  Check,
  Copy,
  RefreshCw,
  Search,
  Phone,
  X,
  Sparkles,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api';
import type { User } from '../types';

export const SalespersonsPage: React.FC = () => {
  const [salespersons, setSalespersons] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password reset alert
  const [newGeneratedPass, setNewGeneratedPass] = useState<{ repName: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSalespersons = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.getSalespersons();
      setSalespersons(res);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, 'Failed to load salespersons. Please refresh to try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalespersons();
  }, []);

  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'Rf@';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const openCreateModal = () => {
    setSaveError('');
    setEditingUser(null);
    setName('');
    setUsername('');
    setPhone('');
    setPassword(generatePassword());
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSaveError('');
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPhone(user.phone || '');
    setPassword('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');
    if (name.trim().length < 2) {
      setSaveError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username.trim())) {
      setSaveError('Username must be 3–50 characters and contain only letters, numbers, dots, underscores, or dashes.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setSaveError('Mobile contact number must contain exactly 10 digits.');
      return;
    }
    if (!editingUser && password.length < 6) {
      setSaveError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      if (editingUser) {
        await api.updateSalesperson(editingUser.id, {
          name: name.trim(),
          username: username.trim(),
          phone: phone.trim(),
        });
        alert('Representative details updated successfully.');
      } else {
        await api.createSalesperson({
          name: name.trim(),
          username: username.trim(),
          phone: phone.trim(),
          password,
        });
        alert(`Sales representative @${username} created successfully! Initial password: ${password}`);
      }
      setModalOpen(false);
      fetchSalespersons();
    } catch (err: unknown) {
      setSaveError(getApiErrorMessage(err, 'Failed to save salesperson. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const newActive = user.active === false ? true : false;
    try {
      await api.updateSalesperson(user.id, { active: newActive });
      setSalespersons((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u))
      );
    } catch (e: any) {
      alert('Failed to update status.');
    }
  };

  const handleResetPassword = async (user: User) => {
    const newPass = generatePassword();
    if (!window.confirm(`Are you sure you want to reset password for ${user.name}? A new temporary password will be assigned.`)) {
      return;
    }

    try {
      await api.resetPassword(user.id, newPass);
      setNewGeneratedPass({ repName: user.name, pass: newPass });
      setCopied(false);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to reset password.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = salespersons.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search))
  );

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Field Sales Force Management
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Onboard representatives, manage mobile app authentication credentials, and monitor route efficiency
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchSalespersons} className="btn btn-outline" style={{ gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ gap: '6px' }}>
            <UserPlus size={16} />
            <span>Onboard Representative</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {loadError}
        </div>
      )}

      {/* Password Reset Success Alert Banner */}
      {newGeneratedPass && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#007F5F' }}>
              ✓ New Security Password Assigned for {newGeneratedPass.repName}
            </div>
            <div style={{ fontSize: '13px', color: '#1E40AF', marginTop: '2px' }}>
              Temporary Password: <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: '#0F172A', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px' }}>{newGeneratedPass.pass}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copyToClipboard(newGeneratedPass.pass)}
              className="btn btn-outline"
              style={{ backgroundColor: '#fff', fontSize: '12px', padding: '6px 12px' }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Password'}</span>
            </button>
            <button
              onClick={() => setNewGeneratedPass(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Search representatives by name, handle, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        </div>
      </div>

      {/* Main Staff Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Representative Identity</th>
                <th>Contact Phone</th>
                <th>Stores Visited</th>
                <th>Gross Invoiced</th>
                <th>Collected</th>
                <th>Pending BAKI</th>
                <th>Recovery %</th>
                <th>Route Status</th>
                <th style={{ textAlign: 'right' }}>Security & Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading Representative Roster…</div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#B91C1C' }}>
                    Unable to load representatives. Click Refresh to try again.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>No Sales Representatives Found</div>
                    <div style={{ fontSize: '12px' }}>Click "+ Onboard Representative" above to add your first sales agent.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((rep) => {
                  const initial = (rep.name || 'S').trim().charAt(0).toUpperCase();
                  const recovery = rep.totalSales && rep.totalSales > 0 ? Math.round(((rep.totalCollected || 0) / rep.totalSales) * 100) : 100;
                  const isActive = rep.active !== false;

                  return (
                    <tr key={rep.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: '#EFF6FF',
                            color: '#007F5F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                          }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{rep.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>@{rep.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="#94A3B8" />
                          <span>+91 {rep.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                              {rep.storesVisited ?? rep.totalShops ?? 0}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748B' }}> stores</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748B' }}>
                            <span>{rep.totalVisits ?? rep.ordersCount ?? 0} visits</span>
                            {Boolean(rep.todayVisits && rep.todayVisits > 0) && (
                              <span style={{
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                fontWeight: 800,
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '999px',
                              }}>
                                +{rep.todayVisits} today
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatMoney(rep.totalSales || 0)}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{formatMoney(rep.totalCollected || 0)}</td>
                      <td>
                        <span style={{ fontWeight: 900, color: '#DC2626' }}>
                          {formatMoney(rep.totalBaki || 0)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${recovery >= 80 ? 'badge-paid' : 'badge-partial'}`}>
                          {recovery}%
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rep)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            border: '1px solid',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            backgroundColor: isActive ? '#ECFDF5' : '#F1F5F9',
                            borderColor: isActive ? '#A7F3D0' : '#CBD5E1',
                            color: isActive ? '#059669' : '#64748B',
                          }}
                        >
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#059669' : '#94A3B8',
                          }} />
                          <span>{isActive ? 'ACTIVE ROUTE' : 'INACTIVE'}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(rep)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
                            title="Edit Representative Profile"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleResetPassword(rep)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '12px', gap: '4px', color: '#007F5F' }}
                            title="Assign New Password"
                          >
                            <KeyRound size={13} />
                            <span>Reset Pass</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Representative Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                  {editingUser ? 'Edit Representative Details' : 'Onboard Field Sales Representative'}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {editingUser ? 'Update agent profile and route assignments' : 'Configure login credentials for the mobile sales application'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close representative form"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {saveError && (
                  <div role="alert" style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    {saveError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name of Representative</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Contact Number (10 Digits)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    placeholder="9876543210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Workforce Login Username / Handle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={50}
                    pattern={'[a-zA-Z0-9_.\\-]+'}
                    title="Use letters, numbers, dots, underscores, or dashes."
                    placeholder="e.g. sp_ramesh"
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Initial Account Password</label>
                      <button
                        type="button"
                        onClick={() => setPassword(generatePassword())}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#007F5F',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={password}
                      minLength={6}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Representative…' : editingUser ? 'Update Profile' : 'Onboard Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
