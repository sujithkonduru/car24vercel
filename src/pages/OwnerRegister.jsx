import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api.js";
import "../Auth.css";

export default function OwnerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    Name: "",
    Username: "",
    Email: "",
    DOB: "",
    NativePlace: "",
    Mobileno: "",
    pass: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validateForm() {
    if (!form.Name.trim()) return "Full name is required";
    if (!form.Username.trim()) return "Username is required";
    if (!form.Email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(form.Email)) return "Enter a valid email";
    if (!form.pass) return "Password is required";
    if (form.pass.length < 6) return "Password must be at least 6 characters";
    if (form.pass !== form.confirmPassword) return "Passwords do not match";
    if (!form.Mobileno.trim()) return "Mobile number is required";
    if (!/^\d{10}$/.test(form.Mobileno)) return "Enter a valid 10-digit mobile number";
    if (!form.NativePlace.trim()) return "Native place is required";
    if (!form.DOB) return "Date of birth is required";
    return null;
  }

  async function submitRegister(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    // Payload exactly matching backend expectations
    const payload = {
  name: form.Name,
  username: form.Username,
  email: form.Email,
  DOB: form.DOB,
  marriedDate: form.marriedDate || null,  // Fixed: added proper field name and null fallback
  NativePlace: form.NativePlace,
  mobileno: form.Mobileno,  // Fixed: changed to lowercase 'mobileno' (consistent with backend)
  password: form.pass,      // Fixed: changed to 'password' (not 'pass')
  role: "owner"
};

    console.log("Sending payload:", payload);

    try {
      const response = await apiPost("/user/CreateUser", payload);

      if (response.message) {
        setMessage(response.message || "OTP sent to your email. Please verify.");
        if (response.Email) {
          setUserEmail(response.Email);
        }
        setStep("otp");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.data?.message || err.message || "Registration failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    
    try {
      // Using the correct endpoint from your backend
      const response = await apiPut("/user/verifyuserRegister", { 
        email: form.Email, 
        otp: otp 
      });

      if (response.message) {
        setMessage(response.message || "Email verified successfully!");
        setTimeout(() => {
          setStep("done");
        }, 2000);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorMsg = err.data?.message || err.message || "Invalid or expired OTP";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError(null);
    setMessage(null);
    setResendingOtp(true);
    
    try {
      // Using the resend endpoint from your backend
      const response = await apiPost("/user/resendOTP", { 
        email: form.Email 
      });
      setMessage(response.message || "A new OTP has been sent to your email.");
    } catch (err) {
      console.error("Resend OTP error:", err);
      const errorMsg = err.data?.message || err.message || "Could not resend OTP";
      setError(errorMsg);
    } finally {
      setResendingOtp(false);
    }
  }

  const handleBackToForm = () => {
    setStep("form");
    setOtp("");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Register as Car Owner</h1>
          <p className="muted">List your cars on Car24 and start earning</p>
        </div>

        {/* Step 1: Registration Form */}
        {step === "form" && (
          <form className="auth-form" onSubmit={submitRegister}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  name="Name"
                  type="text"
                  placeholder="John Doe"
                  value={form.Name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  name="Username"
                  type="text"
                  placeholder="john_doe"
                  value={form.Username}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  name="Email"
                  type="email"
                  placeholder="owner@example.com"
                  value={form.Email}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  name="Mobileno"
                  type="tel"
                  placeholder="9876543210"
                  value={form.Mobileno}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  name="DOB"
                  type="date"
                  value={form.DOB}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Native Place *</label>
                <input
                  name="NativePlace"
                  type="text"
                  placeholder="e.g., Nellore"
                  value={form.NativePlace}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  name="pass"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.pass}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  placeholder="Your full address"
                  value={form.address}
                  onChange={onChange}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={onChange}
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  name="state"
                  type="text"
                  placeholder="State"
                  value={form.state}
                  onChange={onChange}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  name="pincode"
                  type="text"
                  placeholder="524001"
                  value={form.pincode}
                  onChange={onChange}
                />
              </div>
            </div>

            {error && <div className="banner error">{error}</div>}
            {message && <div className="banner success">{message}</div>}

            <button type="submit" className="btn primary btn-full" disabled={loading}>
              {loading ? "Sending OTP..." : "Register as Owner"}
            </button>

            <div className="auth-links">
              <span className="auth-text">Already have an owner account?</span>
              <Link to="/owner/login" className="auth-link">Sign in</Link>
            </div>
            <div className="auth-links">
              <span className="auth-text">Want to rent a car?</span>
              <Link to="/register" className="auth-link">Register as User</Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form className="auth-form" onSubmit={submitOtp}>
            <div className="otp-container">
              <div className="form-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="muted small">
                  We sent a verification code to <strong>{form.Email}</strong>
                </p>
                <p className="muted small">
                  OTP expires in 5 minutes
                </p>
              </div>
            </div>

            {message && <div className="banner success">{message}</div>}
            {error && <div className="banner error">{error}</div>}

            <button
              type="submit"
              className="btn primary btn-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <button
              type="button"
              className="btn ghost btn-full"
              disabled={resendingOtp}
              onClick={resendOtp}
            >
              {resendingOtp ? "Sending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              className="btn ghost btn-full"
              onClick={handleBackToForm}
            >
              Back to registration
            </button>
          </form>
        )}

        {/* Step 3: Completion */}
        {step === "done" && (
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2>Registration Complete!</h2>
            <p className="muted">Your account has been successfully created and verified.</p>
            <div className="success-actions">
              <Link to="/owner/login" className="btn primary btn-full">
                Go to Owner Login
              </Link>
              <Link to="/" className="btn ghost btn-full">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}