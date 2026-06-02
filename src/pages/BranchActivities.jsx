import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getBranchHeadProfile, getCancellationRequests, approveCancelBooking, apiPost } from "../api.js";
import { formatINR, formatDateTime } from "../utils/formatters.js";
import "./BranchHeadDashboard.css";

export default function BranchActivities() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState(null);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("cancellations");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prof = await getBranchHeadProfile();
      const bid = prof?.branch_id;
      if (!bid) throw new Error("Branch not assigned to your account");
      setBranchId(bid);

      const [cancels, extensions] = await Promise.all([
        getCancellationRequests(bid).catch(() => ({ data: [] })),
        apiPost ? fetch(`${import.meta.env.VITE_API_URL}bookingApi/extension-requests?branchId=${bid}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("car24_token")}` }
        }).then((r) => r.json()).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      setCancelRequests(Array.isArray(cancels?.data) ? cancels.data : []);
      setExtensionRequests(Array.isArray(extensions?.data) ? extensions.data : []);
    } catch (err) {
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApproveCancel = async (bookingId) => {
    if (!window.confirm("Approve cancellation? Advance will be refunded to customer wallet.")) return;
    try {
      await approveCancelBooking(bookingId);
      load();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const handleRejectCancel = async (bookingId) => {
    if (!window.confirm("Reject this cancellation request?")) return;
    try {
      const token = localStorage.getItem("car24_token");
      await fetch(`${import.meta.env.VITE_API_URL}bookingApi/reject-cancel/${bookingId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      load();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const handleApproveExtension = async (bookingId) => {
    if (!window.confirm("Approve this extension request?")) return;
    try {
      const token = localStorage.getItem("car24_token");
      await fetch(`${import.meta.env.VITE_API_URL}bookingApi/approveExtend`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      load();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const handleRejectExtension = async (bookingId) => {
    if (!window.confirm("Reject this extension request?")) return;
    try {
      const token = localStorage.getItem("car24_token");
      await fetch(`${import.meta.env.VITE_API_URL}bookingApi/rejectExtend`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      load();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const tabStyle = (tab) => ({
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    background: activeTab === tab ? "var(--bhd-accent)" : "var(--bhd-bg-tertiary)",
    color: activeTab === tab ? "#fff" : "var(--bhd-text-muted)",
    transition: "all 0.2s",
  });

  return (
    <div className="bhd-root" style={{ display: "block" }}>
      <div className="bhd-main" style={{ marginLeft: 0, padding: "24px 20px" }}>
        <div
          className="bhd-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                border: "1px solid rgba(15, 23, 42, 0.12)",
                background: "#fff",
                color: "#0f172a",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              ← Back
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="bhd-title" style={{ margin: 0, fontSize: "1.75rem" }}>
                Branch Activities
              </h1>
              <p
                className="bhd-subtitle"
                style={{ margin: "8px 0 0", color: "var(--bhd-text-muted)", fontSize: "0.95rem" }}
              >
                Manage cancellation and extension requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            style={{
              border: "none",
              background: "var(--bhd-accent)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.18)",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button style={tabStyle("cancellations")} onClick={() => setActiveTab("cancellations")}>
            Cancellation Requests
            {cancelRequests.length > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "2px 7px",
                  fontSize: 11,
                }}
              >
                {cancelRequests.length}
              </span>
            )}
          </button>
          <button style={tabStyle("extensions")} onClick={() => setActiveTab("extensions")}>
            Extension Requests
            {extensionRequests.length > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: "#6366f1",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "2px 7px",
                  fontSize: 11,
                }}
              >
                {extensionRequests.length}
              </span>
            )}
          </button>
        </div>

        {loading && (
          <div className="bhd-loading">
            <div className="bhd-skeleton-grid">
              {[1, 2, 3].map((i) => <div key={i} className="bhd-skeleton-card" />)}
            </div>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 24, background: "rgba(239,68,68,0.1)", borderRadius: 12, color: "#f87171" }}>
            {error}
          </div>
        )}

        {!loading && !error && activeTab === "cancellations" && (
          <div className="bhd-section">
            <div className="bhd-section-header">
              <h2 className="bhd-section-title">Pending Cancellation Requests ({cancelRequests.length})</h2>
            </div>
            {cancelRequests.length === 0 ? (
              <p style={{ color: "var(--bhd-text-muted)", textAlign: "center", padding: "2rem" }}>No pending cancellation requests</p>
            ) : (
              <div className="bhd-bookings-table">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Booking ID", "Customer", "Car", "Pickup", "Dropoff", "Advance Paid", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "12px", background: "var(--bhd-bg-tertiary)", color: "var(--bhd-text-muted)", fontSize: 12, textAlign: "left", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cancelRequests.map((req) => (
                      <tr key={req.booking_id} style={{ borderBottom: "1px solid var(--bhd-border)" }}>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-primary)" }}>#{req.booking_id}</td>
                        <td style={{ padding: "14px 12px" }}>
                          <div style={{ color: "var(--bhd-text-primary)", fontWeight: 600 }}>{req.user_name}</div>
                          <div style={{ color: "var(--bhd-text-muted)", fontSize: 12 }}>{req.user_mobile}</div>
                        </td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-secondary)" }}>
                          <div>{req.car_name}</div>
                          <div style={{ fontSize: 12, color: "var(--bhd-text-muted)", fontFamily: "monospace" }}>{req.car_number}</div>
                        </td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-secondary)", fontSize: 13 }}>{formatDateTime(req.pickupDate)}</td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-secondary)", fontSize: 13 }}>{formatDateTime(req.dropoffDate)}</td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-accent)", fontWeight: 700 }}>{formatINR(req.advance_paid)}</td>
                        <td style={{ padding: "14px 12px" }}>
                          <div className="bhd-actions">
                            <button className="bhd-btn-confirm" onClick={() => handleApproveCancel(req.booking_id)}>✓ Approve</button>
                            <button className="bhd-btn-cancel" onClick={() => handleRejectCancel(req.booking_id)}>✗ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && !error && activeTab === "extensions" && (
          <div className="bhd-section">
            <div className="bhd-section-header">
              <h2 className="bhd-section-title">Pending Extension Requests ({extensionRequests.length})</h2>
            </div>
            {extensionRequests.length === 0 ? (
              <p style={{ color: "var(--bhd-text-muted)", textAlign: "center", padding: "2rem" }}>No pending extension requests</p>
            ) : (
              <div className="bhd-bookings-table">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Booking ID", "Customer", "Car", "Current Dropoff", "Extension", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "12px", background: "var(--bhd-bg-tertiary)", color: "var(--bhd-text-muted)", fontSize: 12, textAlign: "left", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extensionRequests.map((req) => (
                      <tr key={req.booking_id} style={{ borderBottom: "1px solid var(--bhd-border)" }}>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-primary)" }}>#{req.booking_id}</td>
                        <td style={{ padding: "14px 12px" }}>
                          <div style={{ color: "var(--bhd-text-primary)", fontWeight: 600 }}>{req.user_name}</div>
                          <div style={{ color: "var(--bhd-text-muted)", fontSize: 12 }}>{req.user_mobile}</div>
                        </td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-secondary)" }}>
                          <div>{req.car_name}</div>
                          <div style={{ fontSize: 12, color: "var(--bhd-text-muted)", fontFamily: "monospace" }}>{req.car_number}</div>
                        </td>
                        <td style={{ padding: "14px 12px", color: "var(--bhd-text-secondary)", fontSize: 13 }}>{formatDateTime(req.dropoffDate)}</td>
                        <td style={{ padding: "14px 12px" }}>
                          <span
                            style={{
                              background: "#6366f122",
                              color: "#6366f1",
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            +{req.extension_hours}h
                          </span>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <div className="bhd-actions">
                            <button className="bhd-btn-confirm" onClick={() => handleApproveExtension(req.booking_id)}>✓ Approve</button>
                            <button className="bhd-btn-cancel" onClick={() => handleRejectExtension(req.booking_id)}>✗ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
