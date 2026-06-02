import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { sendStaffOtp, verifyStaffOtp, setToken } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Staffverify.css";

export default function StaffVerify() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Get email from URL or show email input
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setIsEditingEmail(false);
      // Auto-send OTP if email from registration link
      sendOtp({ preventDefault: () => {} });
    } else {
      setIsEditingEmail(true);
    }
  }, [searchParams]);

  // Send OTP to email
  async function sendOtp(e) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await sendStaffOtp(email);
      if (res?.success) {
        setMessage("OTP sent successfully! Check your email.");
        setIsEditingEmail(false);
      } else {
        setError(res?.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP
  async function verifyOtp(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await verifyStaffOtp(email, otp);

      if (res?.token || res?.Logintoken) {
        const token = res.token || res.Logintoken;
        setToken(token);
        login(res.user || null, token);

        setMessage("Email verified! Redirecting to dashboard...");
        setTimeout(() => {
          if (res.user?.role === 'admin' || res.user?.role === 'super_admin') {
            navigate("/admin/dashboard");
          } else if (res.user?.role === 'branch_head' || res.user?.role === 'sub_admin') {
            navigate("/branch_dashboard");
          } else {
            navigate("/staff/dashboard");
          }
        }, 1500);
      } else {
        setError("Invalid OTP or server response");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function resendOtp() {
    setError(null);
    setMessage(null);
    setResendingOtp(true);

    try {
      const res = await sendStaffOtp(email);
      if (res?.success) {
        setMessage("New OTP sent successfully.");
      } else {
        setError(res?.message || "Could not resend OTP");
      }
    } catch (err) {
      setError(err.message || "Could not resend OTP");
    } finally {
      setResendingOtp(false);
    }
  }

  return (
    <div className="staff-verify-page">
      <div className="staff-verify-container">
        <div className="staff-verify-header">
          <div className="staff-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Staff Verification Portal
          </div>
          <h1>Verify Staff Account</h1>
          <p className="muted">
            {isEditingEmail 
              ? "Step 1: Enter staff email → Step 2: Enter 6-digit OTP from email" 
              : `Step 2: Enter OTP sent to ${email} (expires in 5 min)`}
          </p>
        </div>

        {/* Email Input Form */}
        {isEditingEmail && (
          <form className="staff-verify-form" onSubmit={sendOtp}>
            <div className="form-group">
              <label>Staff Email Address</label>
              <input
                type="email"
                placeholder="staff@car24.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            {error?.includes('Staff not found') && (
              <div className="warning-message">
                Staff email not registered. Contact admin to add to management table.
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <div className="footer-links">
              <Link to="/staff/login" className="footer-link">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* OTP Verification Form */}
        {!isEditingEmail && (
          <form className="staff-verify-form" onSubmit={verifyOtp}>
            <div className="info-box">
              <p>We sent a verification code to:</p>
              <strong>{email}</strong>
              <button
                type="button"
                className="change-email-link"
                onClick={() => setIsEditingEmail(true)}
              >
                Change email
              </button>
            </div>

            <div className="form-group">
              <label>Enter OTP Code</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                required
                autoFocus
              />
              <small className="hint">OTP expires in 10 minutes</small>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>

            <button
              type="button"
              className="btn-ghost"
              disabled={resendingOtp}
              onClick={resendOtp}
            >
              {resendingOtp ? "Sending..." : "Resend OTP"}
            </button>

            <div className="footer-links">
              <Link to="/staff/login" className="footer-link">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}