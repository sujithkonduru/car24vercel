import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { decodeToken } from "../context/AuthContext.jsx";
import "./Login.css";

export default function BranchLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/user/userLoginnn", { email, password });
      if (res.Logintoken) {
        setAuth(res.Logintoken);
        const decoded = decodeToken(res.Logintoken);
        if (decoded?.role === "branch_head" || decoded?.role === "sub_admin") {
          navigate("/branch_dashboard");
        } else if (decoded?.role === "admin" || decoded?.role === "superadmin") {
          navigate("/admin/dashboard");
        } else if (decoded?.role === "staff") {
          setError("This portal is for Branch Heads only. Please use Staff Login.");
          setAuth(null);
        } else {
          setError("Access denied. This portal is only for Branch Heads.");
          setAuth(null);
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="portal-badge branch-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Branch Head Portal
          </div>
          <h1>Branch Head Login</h1>
          <p className="muted">Access your branch management dashboard</p>
          <p className="small muted">
            <Link to="/login">User Login</Link>
            {" · "}<Link to="/owner/login">Owner Login</Link>
            {" · "}<Link to="/staff/login">Staff Login</Link>
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="branch@car24.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in…" : "Login to Branch Portal"}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/branch-verify">New branch head? Verify OTP</Link>
          <span className="divider">•</span>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>

      <style>{`
        .portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 999px;
          color: #c9a84c;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .branch-badge {
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.3);
          color: #10b981;
        }
      `}</style>
    </div>
  );
}
