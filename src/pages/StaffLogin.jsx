import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { decodeToken } from "../context/AuthContext.jsx";
import "./StaffLogin.css";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost("/user/userLoginnn", { email, password });
      if (res.Logintoken) {
        login(res.Logintoken);
        const decoded = decodeToken(res.Logintoken);
        const role = decoded?.role;
        if (role === "admin" || role === "superadmin") {
          navigate("/admin/dashboard");
        } else if (role === "branch_head" || role === "sub_admin" || role === "subadmin") {
          navigate("/branch_dashboard");
        } else if (role === "staff") {
          navigate("/staff/dashboard");
        } else {
          setError("This portal is for staff, branch head & admin accounts only.");
          login(null);
        }
        return;
      }
      setError("Login failed. Please check your credentials.");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="portal-badge staff-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Staff &amp; Admin Portal
          </div>
          <h1>Staff Login</h1>
          <p className="muted">For staff, branch heads and admin accounts</p>
          <p className="small muted">
            <Link to="/login">User login</Link>
            {" · "}<Link to="/owner/login">Owner login</Link>
            {" · "}<Link to="/branch/login">Branch Head</Link>
          </p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="staff@car24.in"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to Staff Portal"}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/staff-verify">New staff? Verify OTP</Link>
          <span className="divider">•</span>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>

      {/* <style>{`
        .portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 999px;
          color: #070707;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .staff-badge {
          background: rgba(59,130,246,0.1);
          border-color: rgba(59,130,246,0.3);
          color: #3b83f685;
        }
      `}</style> */}
    </div>
  );
}
