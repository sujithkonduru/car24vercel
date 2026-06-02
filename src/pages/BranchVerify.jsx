// BranchVerify.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { sendStaffOtp, verifyStaffOtp, setToken } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Staffverify.css";

export default function BranchVerify() {
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
  const [cooldown, setCooldown] = useState(0);

  // Get email from URL or show email input
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setIsEditingEmail(false);
    } else {
      setIsEditingEmail(true);
    }
  }, [searchParams]);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

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
      console.log("Send OTP Response:", res);
      
      if (res?.success || res?.message?.includes("OTP")) {
        setMessage("OTP sent successfully! Check your email. It expires in 10 minutes.");
        setIsEditingEmail(false);
        setCooldown(60);
      } else {
        setError(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError(err.message || "Could not send OTP. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP
  async function verifyOtp(e) {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await verifyStaffOtp(email, otp);
      console.log("Verify OTP Response:", res);

      const token = res?.token || res?.Logintoken || res?.data?.token;
      const user = res?.user || res?.data?.user;
      
      if (token) {
        setToken(token);
        
        if (user) {
          login(user, token);
        } else {
          login({ email: email, role: 'branch_head' }, token);
        }

        setMessage("✓ Email verified successfully! Redirecting to branch dashboard...");
        
        setTimeout(() => {
          navigate("/branch_dashboard");
        }, 1500);
      } else {
        setError(res?.message || "Invalid OTP or verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError(err.message || "Verification failed. Please check your OTP and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function resendOtp() {
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting another OTP`);
      return;
    }

    setError(null);
    setMessage(null);
    setResendingOtp(true);

    try {
      const res = await sendStaffOtp(email);
      
      if (res?.success || res?.message?.includes("OTP")) {
        setMessage("New OTP sent successfully! Check your email.");
        setCooldown(60);
      } else {
        setError(res?.message || "Could not resend OTP. Please try again.");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setError(err.message || "Could not resend OTP. Please try again.");
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
            Branch Head Verification Portal
          </div>
          <h1>Verify Branch Head Account</h1>
          <p className="muted">
            {isEditingEmail 
              ? "Enter your email to receive verification OTP" 
              : `Verify your account with OTP sent to ${email}`}
          </p>
        </div>

        {/* Email Input Form */}
        {isEditingEmail && (
          <form className="staff-verify-form" onSubmit={sendOtp}>
            <div className="form-group">
              <label>Branch Head Email Address</label>
              <input
                type="email"
                placeholder="branch@car24.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <div className="footer-links">
              <Link to="/branch/login" className="footer-link">
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
                onClick={() => {
                  setIsEditingEmail(true);
                  setOtp("");
                  setError(null);
                  setMessage(null);
                }}
              >
                Change email
              </button>
            </div>

            <div className="form-group">
              <label>Enter OTP Code</label>
              <div className="otp-input-group">
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  required
                  autoFocus
                  disabled={loading}
                  className="otp-input"
                />
              </div>
              <small className="hint">Enter the 6-digit OTP sent to your email. Expires in 10 minutes.</small>
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
              disabled={resendingOtp || cooldown > 0}
              onClick={resendOtp}
            >
              {resendingOtp ? "Sending..." : cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
            </button>

            <div className="footer-links">
              <Link to="/branch/login" className="footer-link">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}