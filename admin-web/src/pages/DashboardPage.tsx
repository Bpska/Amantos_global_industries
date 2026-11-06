import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Store,
  Users,
  Receipt,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Award,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardSummary } from '../types';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const loadDashboard = async (fromVal = startDate, toVal = endDate) => {
    try {
      setRefreshing(true);
      const params: { startDate?: string; endDate?: string } = {};
      if (fromVal) params.startDate = fromVal;
      if (toVal) params.endDate = toVal;
      const res = await api.getDashboard(Object.keys(params).length > 0 ? params : undefined);
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePresetChange = (type: 'all' | 'today' | '7days' | 'month') => {
    setDatePreset(type);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
      loadDashboard('', '');
    } else if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      loadDashboard(todayStr, todayStr);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      const pastStr = past.toISOString().slice(0, 10);
      setStartDate(pastStr);
      setEndDate(todayStr);
      loadDashboard(pastStr, todayStr);
    } else if (type === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstStr = first.toISOString().slice(0, 10);
      setStartDate(firstStr);
      setEndDate(todayStr);
      loadDashboard(firstStr, todayStr);
    }
  };

  const handleCustomDateChange = (fromVal: string, toVal: string) => {
    setStartDate(fromVal);
    setEndDate(toVal);
    setDatePreset('custom');
    if (fromVal || toVal) {
      loadDashboard(fromVal, toVal);
    } else {
      setDatePreset('all');
      loadDashboard('', '');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatMoney = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 600 }}>Loading Executive Overview…</div>
      </div>
    );
  }

  const d = data || {
    totalShops: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCollected: 0,
    totalBaki: 0,
    collectionRate: 100,
    salespersonsLeaderboard: [],
    recentShops: [],
    topBakiShops: [],
  };

  return (
    <div>
      {/* Top Banner Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Executive Operations Dashboard
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Real-time field sales velocity, ledger collection ratio, and outstanding retailer credit
          </p>
        </div>

        <button
          onClick={() => loadDashboard()}
          className="btn btn-outline"
          disabled={refreshing}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Date Filter Strip */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', color: '#0F172A', fontSize: '13px', fontWeight: 800 }}>
            <Calendar size={16} color="#1D4ED8" />
            <span>Date Filter:</span>
          </div>

          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 Days' },
            { key: 'month', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetChange(p.key as any)}
              className={`btn ${datePreset === p.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
            />
          </div>
          {(startDate || endDate || datePreset !== 'all') && (
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '11px', color: '#DC2626', borderColor: '#FECACA' }}
              title="Reset to All Time"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Bento Hero Financial Strip */}
      <div className="bento-hero">
        <div className="hero-grid">
          <div className="hero-primary-metric">
            <div className="hero-label">OUTSTANDING STORE CREDIT (BAKI)</div>
            <div className="hero-val" style={{ color: '#FCA5A5' }}>
              {formatMoney(d.totalBaki)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                <ShieldCheck size={13} color="#10B981" />
                <span>{d.collectionRate}% Portfolio Collected</span>
              </div>
            </div>
          </div>

          <div className="hero-sub-metric">
            <div className="hero-sub-label">TOTAL BILLED</div>
            <div className="hero-sub-val" style={{ color: '#F8FAFC' }}>
              {formatMoney(d.totalSales)}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
              Across {d.totalOrders} dispatches
            </div>
          </div>

          <div className="hero-sub-metric">
            <div className="hero-sub-label">CASH & UPI COLLECTED</div>
            <div className="hero-sub-val" style={{ color: '#34D399' }}>
              {formatMoney(d.totalCollected)}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
              Direct bank credit
            </div>
          </div>

          <div className="hero-sub-metric">
            <div className="hero-sub-label">COLLECTION RATIO</div>
            <div className="hero-sub-val" style={{ color: d.collectionRate >= 80 ? '#34D399' : '#FBBF24' }}>
              {d.collectionRate}%
            </div>
            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${d.collectionRate}%`,
                height: '100%',
                backgroundColor: d.collectionRate >= 80 ? '#10B981' : '#3B82F6',
                borderRadius: '3px',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Secondary KPI Cards */}
      <div className="grid-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1D4ED8',
          }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              TOTAL ENROLLED SHOPS
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
              {d.totalShops}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16A34A',
          }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              ORDERS DISPATCHED
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
              {d.totalOrders}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FAF5FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9333EA',
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              ACTIVE FIELD FORCE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
              {d.salespersonsLeaderboard.length} Reps
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Field Rep Leaderboard & Priority Credit Recovery */}
      <div className="grid-2">
        {/* Field Rep Leaderboard */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-title">
                <Award size={18} color="#1D4ED8" />
                <span>Field Rep Leaderboard</span>
              </div>
              <div className="card-sub">Ranked by revenue generation & collection efficiency</div>
            </div>
            <button
              onClick={() => navigate('/salespersons')}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <span>Manage Team</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Representative</th>
                  <th>Stores Visited</th>
                  <th>Billed</th>
                  <th>Collected</th>
                  <th>Recovery</th>
                </tr>
              </thead>
              <tbody>
                {d.salespersonsLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No sales representative data recorded yet.
                    </td>
                  </tr>
                ) : (
                  d.salespersonsLeaderboard.map((rep, idx) => {
                    const sales = rep.totalSales || 0;
                    const collected = rep.totalCollected || 0;
                    const recovery = sales > 0 ? Math.round((collected / sales) * 100) : 100;
                    return (
                      <tr key={rep.id}>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : '#EFF6FF',
                            color: idx === 0 ? '#B45309' : idx === 1 ? '#475569' : '#1D4ED8',
                            fontWeight: 800,
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                          }}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{rep.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>@{rep.username}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>
                            {rep.storesVisited ?? rep.totalShops ?? 0} <span style={{ fontWeight: 500, fontSize: '11px', color: '#64748B' }}>stores</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {rep.todayVisits ? (
                              <span style={{ color: '#15803D', fontWeight: 700 }}>{rep.todayVisits} today</span>
                            ) : (
                              <span>{rep.totalVisits ?? rep.ordersCount ?? 0} visits</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatMoney(rep.totalSales || 0)}</td>
                        <td style={{ fontWeight: 700, color: '#10B981' }}>{formatMoney(rep.totalCollected || 0)}</td>
                        <td>
                          <span className={`badge ${recovery >= 80 ? 'badge-paid' : 'badge-partial'}`}>
                            {recovery}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Credit Recovery (Top BAKI Stores) */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <div className="card-title">
                <AlertTriangle size={18} color="#DC2626" />
                <span>Priority Credit Recovery</span>
              </div>
              <div className="card-sub">Top retailer accounts with outstanding balance due</div>
            </div>
            <button
              onClick={() => navigate('/shops?status=UNPAID')}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <span>View All Due</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store / Merchant</th>
                  <th>Proprietor</th>
                  <th>Assigned Rep</th>
                  <th>Pending BAKI</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {d.topBakiShops.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#10B981', fontWeight: 600 }}>
                      ✓ All retailer accounts are fully settled. Zero outstanding credit!
                    </td>
                  </tr>
                ) : (
                  d.topBakiShops.map((shop) => (
                    <tr key={shop.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{shop.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{shop.location}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{shop.ownerName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{shop.contactNumber}</div>
                      </td>
                      <td style={{ fontSize: '12px', fontWeight: 600, color: '#1D4ED8' }}>
                        {shop.salesperson?.name || 'Assigned Rep'}
                      </td>
                      <td>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#DC2626' }}>
                          {formatMoney(shop.baki)}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/shops?id=${shop.id}`)}
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: '11px', gap: '4px' }}
                        >
                          <span>Open</span>
                          <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
