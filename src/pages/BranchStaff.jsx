import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBranchStaff } from "../api.js";
import "./BranchHeadDashboard.css";

export default function BranchStaff() {
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const branchId = localStorage.getItem("branch_id");

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await getBranchStaff(branchId);
      setStaff(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Staff load error:", e);
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(filter.toLowerCase()) ||
      s.email?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bhd-root">
        <main className="bhd-main">
          <button className="bhd-back-button" onClick={handleGoBack}>
            <span className="bhd-back-arrow">←</span>
            <span className="bhd-back-text">Back</span>
          </button>
          <div className="bhd-staff-header">
            <h2 className="bhd-staff-title">
              <span className="bhd-staff-title-icon">👥</span>Staff Management
            </h2>
          </div>
          <p style={{ textAlign: "center", padding: "40px 20px" }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bhd-root">
      <main className="bhd-main">
        {/* Back Button */}
        <button className="bhd-back-button" onClick={handleGoBack}>
          <span className="bhd-back-arrow">←</span>
          <span className="bhd-back-text">Back</span>
        </button>

        {/* Header */}
        <div
          className="bhd-staff-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <h2
            className="bhd-staff-title"
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="bhd-staff-title-icon">👥</span>Staff Management
          </h2>
          <div
            className="bhd-staff-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="bhd-staff-btn"
              style={{ minHeight: "42px", padding: "10px 18px" }}
              onClick={loadStaff}
            >
              ↻ Refresh
            </button>
            <button
              className="bhd-staff-btn bhd-staff-btn-primary"
              style={{ minHeight: "42px", padding: "10px 18px" }}
            >
              ➕ Add Staff
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="bhd-staff-filters"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div
            className="bhd-staff-filter-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              minWidth: "240px",
            }}
          >
            <label
              className="bhd-staff-filter-label"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--bhd-text-muted)",
              }}
            >
              🔍 Search
            </label>
            <input
              type="text"
              placeholder="Name or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bhd-staff-filter-input"
              style={{
                minWidth: "220px",
                width: "100%",
                maxWidth: "360px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--bhd-border)",
                background: "var(--bhd-bg)",
                color: "var(--bhd-text-primary)",
              }}
            />
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--bhd-text-muted)",
              fontWeight: 600,
              minWidth: "140px",
              textAlign: "right",
            }}
          >
            {filteredStaff.length} Staff Member{filteredStaff.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Staff Cards Grid */}
        {error ? (
          <div className="bhd-staff-empty">
            <div className="bhd-staff-empty-icon">⚠️</div>
            <p className="bhd-staff-empty-text">{error}</p>
            <button className="bhd-staff-btn" onClick={loadStaff}>
              Retry
            </button>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bhd-staff-empty">
            <div className="bhd-staff-empty-icon">👥</div>
            <p className="bhd-staff-empty-text">
              {filter ? "No staff members found" : "No staff members yet"}
            </p>
          </div>
        ) : (
          <div className="bhd-staff-cards-grid">
            {filteredStaff.map((member) => (
              <div key={member.id} className="bhd-staff-card">
                <div className="bhd-staff-card-header">
                  <div className="bhd-staff-card-avatar">
                    {member.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div className="bhd-staff-card-title-section">
                    <h3 className="bhd-staff-card-name">{member.name || "Unknown"}</h3>
                    <span className="bhd-staff-role">STAFF</span>
                  </div>
                </div>

                <div className="bhd-staff-card-body">
                  <div className="bhd-staff-card-item">
                    <span className="bhd-staff-card-label">📧 Email</span>
                    <p className="bhd-staff-card-value">{member.email || "N/A"}</p>
                  </div>

                  <div className="bhd-staff-card-item">
                    <span className="bhd-staff-card-label">📞 Phone</span>
                    <p className="bhd-staff-card-value">{member.phone || "N/A"}</p>
                  </div>

                  <div className="bhd-staff-card-item">
                    <span className="bhd-staff-card-label">📅 Joined</span>
                    <p className="bhd-staff-card-value">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bhd-staff-card-item">
                    <span className="bhd-staff-card-label">✓ Status</span>
                    <span
                      className={`bhd-staff-status ${
                        member.is_verified ? "active" : "inactive"
                      }`}
                    >
                      <span className="bhd-staff-status-dot"></span>
                      {member.is_verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>

                {/* <div className="bhd-staff-card-footer">
                  <button className="bhd-staff-action-btn">Edit</button>
                  <button className="bhd-staff-action-btn delete">Delete</button>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
