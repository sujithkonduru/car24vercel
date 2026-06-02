import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getBranchHeadProfile,
  getBranchDashboardStats,
  getBranchIncome,
  formatINR,
} from "../api.js";
import "./BranchHeadDashboard.css";

/* ─── Branch Nav History ──────────────────────────────── */
const BRANCH_NAV_HISTORY_KEY = "branch_nav_history";

const readBranchNavHistory = () => {
  try {
    const raw = window.sessionStorage.getItem(BRANCH_NAV_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeBranchNavHistory = (history) => {
  try {
    window.sessionStorage.setItem(
      BRANCH_NAV_HISTORY_KEY,
      JSON.stringify(history.slice(-20))
    );
  } catch {}
};

/* ─── Helpers ─────────────────────────────────────────── */
const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const today = new Date();
const DEFAULT_FROM = toDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
const DEFAULT_TO   = toDateStr(today);

/* ─── Persistent date state (survives refresh) ────────── */
const getStoredFrom = () => sessionStorage.getItem("bhd_from") || DEFAULT_FROM;
const getStoredTo   = () => sessionStorage.getItem("bhd_to")   || DEFAULT_TO;

/* ─── Nav Items ───────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",  path: "/branch_dashboard",  icon: "🏠" },
  { label: "Bookings",   path: "/branch/bookings",   icon: "📋" },
  { label: "Fleet",      path: "/branch/fleet",      icon: "🚗" },
  { label: "Staff",      path: "/branch/staff",      icon: "👥" },
  { label: "Activities", path: "/branch/activities", icon: "📊" },
];

/* ─── Sidebar (shared, standalone) ───────────────────── */
export function BranchSidebar({ profile, sidebarOpen, setSidebarOpen, onLogout }) {
  const location = useLocation();

  return (
    <>
      {sidebarOpen && (
        <div className="bhd-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`bhd-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="bhd-sidebar-inner">
          <div className="bhd-sidebar-header">
            <div
  className="bhd-logo"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    color: "#ffffff",
    textTransform: "uppercase",
  }}
>
  <span
    className="bhd-logo-icon"
    style={{
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #f59e0b, #f97316)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 12px rgba(245, 158, 11, 0.8)",
    }}
  >
    C
  </span>

  <span
    style={{
      background: "linear-gradient(90deg, #59def9, #53d4fb, #05dff7)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontWeight: "800",
      textShadow: "0 2px 10px rgba(245, 158, 11, 0.25)",
    }}
  >
    Car24Travels
  </span>
</div>
            <div className="bhd-branch-info">
              🏢 {profile?.branch_name || "Branch"},{" "}
              {profile?.branch_city || ""}
            </div>
          </div>

          <nav className="bhd-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`bhd-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="bhd-nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="bhd-sidebar-footer">
            <button className="bhd-nav-item bhd-logout-btn" onClick={onLogout}>
              <span className="bhd-nav-icon">🚪</span> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Main Dashboard ──────────────────────────────────── */
export default function BranchHeadDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile,       setProfile]       = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [incomeData,    setIncomeData]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  // Date range — persisted across refreshes
  const [fromDate, setFromDate] = useState(getStoredFrom);
  const [toDate,   setToDate]   = useState(getStoredTo);

  const handleFromChange = (v) => { setFromDate(v); sessionStorage.setItem("bhd_from", v); };
  const handleToChange   = (v) => { setToDate(v);   sessionStorage.setItem("bhd_to",   v); };

  /* ── Load Profile ── */
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const prof = await getBranchHeadProfile();
        if (!cancelled) setProfile(prof);
      } catch (e) {
        console.error("Profile load error:", e);
        if (!cancelled) {
          setError("Failed to load profile. Please refresh.");
          setLoading(false);
        }
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  /* ── Load Dashboard Data ── */
  useEffect(() => {
    if (!profile) return;
    const branchId = profile.branch_id;
    if (!branchId) { setLoading(false); return; }

    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [dash, income] = await Promise.all([
          getBranchDashboardStats(branchId, fromDate, toDate),
          getBranchIncome(branchId, fromDate, toDate),
        ]);
        if (!cancelled) {
          setDashboardData(dash || {});
          setIncomeData(Array.isArray(income) ? income : []);
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [profile, fromDate, toDate]);

  /* ── Income Totals ── */
  const { monthlyGross, monthlyBranchRetained, monthlySuperadminPayout, monthlyOwnerPayout } =
    useMemo(() => {
      let mGross = 0, mOwner = 0, mBranch = 0, mSuper = 0;
      incomeData.forEach((row) => {
        mGross  += Number(row.full_booking_price) || 0;
        mOwner  += Number(row.owner_cut)          || 0;
        mBranch += Number(row.branch_cut)         || 0;
        mSuper  += Number(row.superadmin_cut)     || 0;
      });
      return {
        monthlyGross:           mGross,
        monthlyOwnerPayout:     mOwner,
        monthlyBranchRetained:  mBranch,
        monthlySuperadminPayout: mSuper,
      };
    }, [incomeData]);

  const stats = {
    totalCars:         dashboardData.totalCars        || 0,
    onRoad:            dashboardData.onRoadToday      || 0,
    idleCars:          dashboardData.idleCars         || 0,
    totalBookings:     dashboardData.totalBookings    || 0,
    completedBookings: dashboardData.completedBookings || 0,
    cancelledBookings: dashboardData.cancelledBookings || 0,
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("branch_id");
    sessionStorage.removeItem("branch_id");
    sessionStorage.removeItem("bhd_from");
    sessionStorage.removeItem("bhd_to");
    logout();
    navigate("/branch/login");
  }, [logout, navigate]);

  const handleGoBack = () => {
    const history = readBranchNavHistory();
    let target = null;

    for (let i = history.length - 2; i >= 0; i -= 1) {
      if (history[i] !== location.pathname) {
        target = history[i];
        break;
      }
    }

    if (target) {
      navigate(target);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/branch_dashboard");
    }
  };

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="bhd-root">
        <BranchSidebar
          profile={profile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
        <main className="bhd-main">
          <div className="bhd-loading">
            <div className="bhd-skeleton-header" />
            <div className="bhd-skeleton-grid">
              {[1, 2, 3, 4].map((i) => <div key={i} className="bhd-skeleton-card" />)}
            </div>
            <div className="bhd-skeleton-grid" style={{ marginTop: 16 }}>
              {[1, 2].map((i) => <div key={i} className="bhd-skeleton-card" />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="bhd-root">
        <BranchSidebar
          profile={profile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
        <main className="bhd-main">
          <div className="bhd-error-state">
            <span className="bhd-error-icon">⚠️</span>
            <p>{error}</p>
            <button className="bhd-retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main Render ── */
  return (
    <div className="bhd-root">
      {/* Mobile Menu Toggle */}
      <button
        className="bhd-mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <BranchSidebar
        profile={profile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <main className="bhd-main">
        {/* Back Button */}
        {/* <button className="bhd-back-button" onClick={handleGoBack} title="Go back">
          <span className="bhd-back-arrow">←</span>
          <span className="bhd-back-text">Back</span>
        </button> */}

        {/* Header */}
        <div className="bhd-header">
          <div className="bhd-header-content">
            <div className="bhd-header-text">
              <div className="bhd-title-wrapper">
                <span className="bhd-title-icon">📊</span>
                <h1 className="bhd-title">
                  Branch Head Dashboard
                  <span className="bhd-branch-name">
                    {profile?.branch_name || "Branch"}
                  </span>
                </h1>
              </div>
              <div className="bhd-subtitle-wrapper">
                <span className="bhd-welcome-icon">👋</span>
                <p className="bhd-subtitle">
                  Welcome back,{" "}
                  <strong>{profile?.name || user?.name || "Branch Head"}</strong>
                </p>
              </div>
            </div>

            <div className="bhd-header-badge">
              <div className="bhd-role-badge">
                <span className="bhd-role-icon">👑</span>
                <span className="bhd-role-text">Branch Head</span>
              </div>
              <div className="bhd-date-badge">
                <span className="bhd-date-icon">📅</span>
                <span className="bhd-date-text">
                  {today.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bhd-date-filter">
          <div className="bhd-date-field">
            <label className="bhd-date-label">From Date</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => handleFromChange(e.target.value)}
              className="bhd-date-input"
            />
          </div>
          <div className="bhd-date-field">
            <label className="bhd-date-label">To Date</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={toDateStr(new Date())}
              onChange={(e) => handleToChange(e.target.value)}
              className="bhd-date-input"
            />
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bhd-revenue-card">
          <div className="bhd-revenue-header">
            <p className="bhd-revenue-label">Total Booking Volume</p>
            <p className="bhd-revenue-date-range">{fromDate} → {toDate}</p>
          </div>
          <p className="bhd-revenue-amount">{formatINR(monthlyGross)}</p>
          <div className="bhd-revenue-footer">
            {[
              { label: "Branch Retained", value: monthlyBranchRetained },
              { label: "Admin Retained",  value: monthlySuperadminPayout },
              { label: "Owner Payouts",   value: monthlyOwnerPayout },
            ].map((item) => (
              <div key={item.label} className="bhd-revenue-item">
                <p className="bhd-revenue-sub-label">{item.label}</p>
                <p className="bhd-revenue-sub-amount">{formatINR(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet + Booking Stats Grid */}
        <div className="bhd-stats-grid">
          {[
            { label: "Total Fleet",    value: stats.totalCars,     color: "#14b8a6", icon: "🚗" },
            { label: "On the Road",    value: stats.onRoad,        color: "#10b981", icon: "🛣️" },
            { label: "Present Cars",   value: stats.idleCars,      color: "#6366f1", icon: "🅿️" },
            { label: "Total Bookings", value: stats.totalBookings, color: "#f59e0b", icon: "📋" },
          ].map((s) => (
            <div key={s.label} className="bhd-stat-card">
              <div className="bhd-stat-icon" style={{ background: `${s.color}22` }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
              </div>
              <div className="bhd-stat-content">
                <span className="bhd-stat-value" style={{ color: s.color }}>{s.value}</span>
                <span className="bhd-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Status Grid */}
        <div className="bhd-booking-stats-grid">
          <div className="bhd-stat-card">
            <div className="bhd-stat-icon" style={{ background: "#10b98122" }}>
              <span style={{ fontSize: 24 }}>✅</span>
            </div>
            <div className="bhd-stat-content">
              <span className="bhd-stat-value" style={{ color: "#10b981" }}>
                {stats.completedBookings}
              </span>
              <span className="bhd-stat-label">Completed Bookings</span>
            </div>
          </div>
          <div className="bhd-stat-card">
            <div className="bhd-stat-icon" style={{ background: "#ef444422" }}>
              <span style={{ fontSize: 24 }}>❌</span>
            </div>
            <div className="bhd-stat-content">
              <span className="bhd-stat-value" style={{ color: "#ef4444" }}>
                {stats.cancelledBookings}
              </span>
              <span className="bhd-stat-label">Cancelled Bookings</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bhd-section">
          <div className="bhd-section-header">
            <h2 className="bhd-section-title">Quick Actions</h2>
          </div>
          <div className="bhd-actions-grid">
            {[
              { label: "Manage Bookings",  desc: "View and manage all bookings",   path: "/branch/bookings",   icon: "📋" },
              { label: "Fleet Management", desc: "View and manage branch cars",     path: "/branch/fleet",      icon: "🚗" },
              { label: "Staff Management", desc: "Manage branch staff",             path: "/branch/staff",      icon: "👥" },
              { label: "Activities Log",   desc: "View recent branch activities",   path: "/branch/activities", icon: "📊" },
            ].map((a) => (
              <Link key={a.path} to={a.path} className="bhd-action-card">
                <div className="bhd-action-icon">{a.icon}</div>
                <h3>{a.label}</h3>
                <p>{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
