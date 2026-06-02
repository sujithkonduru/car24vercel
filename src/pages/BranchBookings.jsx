import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { getBranchHeadProfile, getBranchBookingsByDate, approveCancelBooking } from "../api.js";
import { formatINR, formatDateTime } from "../utils/formatters.js";
import "./BranchBooking.css";

export default function BranchBookings() {
  const navigate = useNavigate(); // Add this hook
  const [branchId, setBranchId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Get branchId from profile (branch_id from the JOIN)
  useEffect(() => {
    getBranchHeadProfile()
      .then((prof) => setBranchId(prof?.branch_id))
      .catch(console.error);
  }, []);

  const loadBookings = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBranchBookingsByDate(branchId, selectedDate);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleApproveCancel = async (bookingId) => {
    if (!window.confirm("Approve cancellation and refund advance to customer wallet?")) return;
    try {
      await approveCancelBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert(err.message || "Failed to approve cancellation");
    }
  };

  // Filter by status tab
  const filtered = bookings.filter((b) => {
    const status = (b.system_status || "").toLowerCase();
    const matchesFilter = filter === "all" || status === filter;
    const matchesSearch =
      !search ||
      b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.car_model?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.booking_id).includes(search) ||
      b.number_plate?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.system_status === "pending").length,
    confirmed: bookings.filter((b) => b.system_status === "confirmed").length,
    ongoing: bookings.filter((b) => b.ride_start_time && !b.ride_end_time).length,
    completed: bookings.filter((b) => b.ride_end_time).length,
    cancelled: bookings.filter((b) => b.system_status === "cancelled").length,
    cancelRequests: bookings.filter((b) => b.cancellation_status === "pending").length,
  };

  const statusBadgeClass = (b) => {
    if (b.ride_end_time) return "status-completed";
    if (b.ride_start_time) return "status-ongoing";
    const s = (b.system_status || "").toLowerCase();
    return { pending: "status-pending", confirmed: "status-confirmed", cancelled: "status-cancelled" }[s] || "status-pending";
  };

  const statusLabel = (b) => b.live_status || b.system_status || "Unknown";

  return (
    <div className="branch-bookings-container">
      <div className="bookings-header">
        {/* Add back button here */}
        <button 
          className="back-button" 
          onClick={() => navigate(-1)} // Navigate back to previous page
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1>Branch Bookings</h1>
      </div>

      {/* Date Picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <label style={{ color: "#94a3b8", fontSize: 14 }}>Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#e5e7eb", fontSize: 14 }}
        />
        <button className="refresh-btn" onClick={loadBookings}>↻ Refresh</button>
      </div>

      {/* Stats */}
      <div className="stats-summary">
        {[
          ["Total", stats.total],
          ["Confirmed", stats.confirmed],
          ["On Road", stats.ongoing],
          ["Completed", stats.completed],
          ["Cancelled", stats.cancelled],
          ["Cancel Requests", stats.cancelRequests],
        ].map(([label, count]) => (
          <div key={label} className="stat-badge">
            <span>{label}:</span>
            <span className="stat-count">{count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search customer, car, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <div className="loading-state"><div className="loading-spinner" /><p>Loading bookings...</p></div>}
      {error && <div className="error-state"><p>{error}</p><button className="retry-btn" onClick={loadBookings}>Try Again</button></div>}

      {!loading && !error && (
        <div className="bookings-table-wrapper">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Car</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    No bookings found for {selectedDate}
                   </td>
                 </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.booking_id}>
                    <td>#{b.booking_id}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{b.customer_name || "Guest"}</span>
                        {b.customer_phone && <span className="customer-phone">{b.customer_phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="car-info">
                        <span className="car-model">{b.car_model || "N/A"}</span>
                        {b.number_plate && <span className="car-plate">{b.number_plate}</span>}
                      </div>
                     </td>
                    <td className="date">{formatDateTime(b.pickupDate) || "-"}</td>
                    <td className="date">{formatDateTime(b.dropoffDate) || "-"}</td>
                    <td className="amount">{formatINR(b.totalPrice || 0)}</td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(b)}`}>
                        {statusLabel(b)}
                      </span>
                      {b.cancellation_status === "pending" && (
                        <span className="status-badge status-pending" style={{ marginLeft: 4 }}>Cancel Req</span>
                      )}
                     </td>
                    <td>
                      <div className="action-buttons">
                        {b.cancellation_status === "pending" && (
                          <button className="action-btn btn-confirm" onClick={() => handleApproveCancel(b.booking_id)}>
                            ✓ Approve Cancel
                          </button>
                        )}
                      </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}