import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, PlusCircle, Receipt, RefreshCw, Store, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DashboardSummary } from '../types';
import './StaffDashboardPage.css';

const money = (value: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(value);

export function StaffDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    api.getDashboard().then((data) => { if (active) setSummary(data); })
      .catch((err: Error) => { if (active) setError(err.message || 'Unable to load your dashboard.'); });
    return () => { active = false; };
  }, [user?.id, refresh]);

  if (error) return <div className="card staff-error" role="alert">
    <p>{error}</p><button className="btn btn-outline" onClick={() => setRefresh(refresh + 1)}>Try again</button>
  </div>;
  if (!summary) return <div className="session-loading" role="status"><RefreshCw className="animate-spin" />Loading your field activity...</div>;

  const metrics = [
    { title: 'My Retailers', value: String(summary.totalShops), icon: Store },
    { title: 'My Sales', value: money(summary.totalSales), icon: Receipt },
    { title: 'Collected', value: money(summary.totalCollected), icon: Banknote },
    { title: 'BAKI to Collect', value: money(summary.totalBaki), icon: Banknote },
  ];

  return <div className="staff-dashboard">
    <section className="staff-welcome">
      <div>
        <span className="staff-eyebrow">STAFF PANEL / FIELD OPERATIONS</span>
        <h1>Hello, {user?.name?.split(' ')[0] || 'there'}.</h1>
        <p>Your retailers, orders, and collections in one place.</p>
        <span className="staff-account">Signed in as @{user?.username}</span>
      </div>
      <Link className="btn btn-primary" to="/staff/shops?new=1"><PlusCircle size={17} />Onboard Retailer</Link>
    </section>

    <div className="staff-metrics">
      {metrics.map(({ title, value, icon: Icon }) => <div className="card staff-metric" key={title}>
        <span><Icon size={18} />{title}</span><strong>{value}</strong>
      </div>)}
    </div>

    <section className="staff-actions" aria-label="Field actions">
      <Link className="card staff-action" to="/staff/shops"><Store /><div><h2>Visit My Retailers</h2><p>View your route and place repeat orders.</p></div><ArrowRight /></Link>
      <Link className="card staff-action" to="/staff/shops?status=PARTIAL"><Banknote /><div><h2>Collect BAKI</h2><p>Review balances and record payments.</p></div><ArrowRight /></Link>
      <Link className="card staff-action" to="/staff/invoices"><Receipt /><div><h2>My Orders & Invoices</h2><p>Review orders, invoices, and payment balances.</p></div><ArrowRight /></Link>
    </section>

    <div className="staff-columns">
      <section className="card staff-list">
        <div className="staff-section-heading"><h2>Retailers to Follow Up</h2><Link to="/staff/shops">View all <ArrowRight size={14} /></Link></div>
        <p className="staff-caption">Outstanding balances on your assigned route.</p>
        {summary.topBakiShops.length ? summary.topBakiShops.map((shop) =>
          <Link key={shop.id} to={`/staff/shops?id=${encodeURIComponent(shop.id)}`} className="staff-retailer">
            <div><strong>{shop.name}</strong><span>{shop.ownerName}</span></div>
            <b>{money(shop.baki)}</b><ArrowRight size={16} />
          </Link>) : <p className="staff-empty">No outstanding balances. Your collections are up to date.</p>}
      </section>
      <section className="card staff-list staff-progress">
        <h2>My Collection Progress</h2>
        <strong>{summary.collectionRate}%</strong>
        <progress max={100} value={summary.collectionRate} aria-label="My collection rate" />
        <p>{money(summary.totalCollected)} collected from {money(summary.totalSales)} in sales.</p>
        <div><span>Orders placed</span><b>{summary.totalOrders}</b></div>
        <div><span>Assigned retailers</span><b>{summary.totalShops}</b></div>
        <Link to="/staff/profile">View my profile <ArrowRight size={14} /></Link>
      </section>
    </div>
  </div>;
}

export function StaffProfilePage() {
  const { user } = useAuth();
  return <section className="card staff-profile">
    <span className="staff-eyebrow">STAFF PANEL</span>
    <h1>My Profile</h1>
    <div className="staff-profile-heading"><UserRound size={32} /><div><h2>{user?.name}</h2><p>Field Representative</p></div></div>
    <dl>
      <div><dt>Username</dt><dd>@{user?.username}</dd></div>
      <div><dt>Phone</dt><dd>{user?.phone || 'Not provided'}</dd></div>
      <div><dt>Account</dt><dd>{user?.active === false ? 'Inactive' : 'Active'}</dd></div>
    </dl>
    <p>Contact your administrator to update your profile or reset your password.</p>
    <Link className="btn btn-primary" to="/staff/shops">Open My Retailers <ArrowRight size={16} /></Link>
  </section>;
}
