import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost, userLogin } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { decodeToken } from "../context/AuthContext.jsx";
import "../Auth.css";
import logo from "../images/Car 24 logo (1).png";

function roleRedirect(role) {
  switch (role) {
    case "owner":      return "/owner/dashboard";
    case "staff":      return "/staff/dashboard";
    
    case "sub_admin":   return "/branch_dashboard";
    case "branch_head": return "/branch_dashboard";
    case "admin":      return "/admin/dashboard";
    case "superadmin": return "/superadmin/dashboard";
    default:           return "/";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [warn, setWarn]         = useState(null);
  const [loading, setLoading]   = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setWarn(null);
    setLoading(true);
    try {
      const res = await apiPost("/user/userLogin", { email, password });
      if (res.Logintoken) {
        login(res.Logintoken);
        const decoded = decodeToken(res.Logintoken);
        navigate(roleRedirect(decoded?.role));
        return;
      }
      if (res.Verification_token) {
        setWarn("Account not verified. Please complete OTP verification from your registration email, then log in again.");
        return;
      }
      setError("Unexpected response from server.");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* ── Brand Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-glow" />
        <Link to="/" className="auth-brand-logo">
          <img src={logo} alt="Car24" />
        </Link>
        <div className="auth-brand-body">
          <div className="auth-brand-tag">
            <span className="auth-brand-tag-dot" />
            India's Trusted Car Rental
          </div>
          <h2 className="auth-brand-headline">
            Drive your<br /><em>dream car</em><br />today.
          </h2>
          <p className="auth-brand-sub">
            Access 500+ certified vehicles across 50+ cities. Flexible rentals, transparent pricing, zero hassle.
          </p>
          <div className="auth-brand-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-num">500+</span>
              <span className="auth-stat-lbl">Cars</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-num">50+</span>
              <span className="auth-stat-lbl">Cities</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-num">25K+</span>
              <span className="auth-stat-lbl">Renters</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-footer">© {new Date().getFullYear()} Car24 India</div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>
              Sign in to your Car24 account.{" "}
              <Link to="/register">New here? Create account</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="has-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && <div className="auth-banner error">⚠️ {error}</div>}
            {warn  && <div className="auth-banner warn">ℹ️ {warn}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Signing in…</> : "Sign In →"}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/forgot-password">Forgot password?</Link>
            <span className="sep">·</span>
            <Link to="/owner/login">Owner Login</Link>
            <span className="sep">·</span>
            <Link to="/staff/login">Staff Login</Link>
            <span className="sep">·</span>
            <Link to="/owner/register">Become an Owner</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
