import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStaffTasks,
  verifyCarKey,
  startRide,
  endRide,
  getUserData,
  collectRemainingPayment,
  getBookingDetails,
  getCarGpsLocation,
  getBranches,
  getCars,
  createOfflineBooking,
  getMyBookings,
  decodeToken,
  API_BASE,
  apiGet
} from "../api.js";
import { toastSuccess, toastError } from "../hooks/useToast.js";
import {
  Search, Clock, TrendingUp, CheckCircle, Users, Calendar,
  CreditCard, Smartphone, Banknote, ChevronDown, ChevronUp,
  MapPin, Navigation, AlertCircle, RefreshCw, PlusCircle, UserPlus,
  X, DollarSign, Fuel, Gauge, Shield, FileText, Eye, Phone, Mail,
  Hash, Car, Home, Key, Truck, User, Image, IdCard, Award, Camera,
  AlertTriangle
} from 'lucide-react';
import { printBookingReceipt } from "../utils/receiptUtils.js";
import "./StaffDashboard.css";

const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

// ==================== UTILITY FUNCTIONS ====================
function formatDt(iso) {
  if (!iso) return "—";
  try {
    if (typeof iso === 'string') {
      let datePart = "";
      let timePart = "";
      
      if (iso.includes('T')) {
        [datePart, timePart] = iso.split('T');
        if (timePart && timePart.includes('.')) {
          timePart = timePart.split('.')[0];
        }
        if (timePart && timePart.endsWith('Z')) {
          timePart = timePart.slice(0, -1);
        }
      } else if (iso.includes(' ')) {
        [datePart, timePart] = iso.split(' ');
      } else {
        return iso;
      }
      
      // Format date from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = datePart.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      // Format time to 12-hour with AM/PM
      let formattedTime = "";
      if (timePart) {
        let [hours, minutes] = timePart.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        formattedTime = `${hour12}:${minutes} ${ampm}`;
      }
      
      return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
    }
    return iso;
  } catch { 
    return iso; 
  }
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatElapsed(isoString) {
  if (!isoString) return "—";
  const now = new Date();
  const start = new Date(isoString);
  const diffMs = now - start;
  if (diffMs < 0) return "Not started";
  const diffSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  else if (minutes > 0) return `${minutes}m ${seconds}s`;
  else return `${seconds}s`;
}

function calculateDuration(pickupDate, dropoffDate) {
  if (!pickupDate || !dropoffDate) return "—";
  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const diffMs = end - start;
  if (diffMs <= 0) return "—";
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (remainingHours > 0) return `${days}d ${Math.round(remainingHours)}h`;
    return `${days}d`;
  }
  return `${Math.round(diffHours)}h`;
}

// Track Button Component
function TrackButton({ carId, carModel, carPlate, onTrack, size = "normal" }) {
  if (!carId) return null;
  const isSmall = size === "small";
  return (
    <button
      onClick={() => onTrack(carId, carModel, carPlate)}
      title={`Track ${carModel} live`}
      className={`track-btn ${isSmall ? 'small' : ''}`}
    >
      <MapPin size={isSmall ? 12 : 14} />
      Track Live
    </button>
  );
}

// Document Viewer Modal
function DocumentViewer({ url, title, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FileText size={18} /> {title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <img src={url} alt={title} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
        </div>
      </div>
    </div>
  );
}

// Create Booking Form Component
function CreateBookingForm({ onSuccess, onCancel, userBranchId }) {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    carId: "",
    branchId: userBranchId || "",
    pickupDate: "",
    dropoffDate: "",
    advancePaid: 0,
  });
  const [cars, setCars] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Failed to load branches:", err);
        setBranches([]);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (!formData.branchId) { setCars([]); return; }
    const loadCars = async () => {
      try {
        const response = await getCars({ branchId: formData.branchId, status: "available" });
        setCars(Array.isArray(response) ? response : response?.data || []);
      } catch (err) {
        console.error("Failed to load cars:", err);
        setCars([]);
      }
    };
    loadCars();
  }, [formData.branchId]);

  useEffect(() => {
    if (!formData.pickupDate || !formData.dropoffDate || !formData.carId || !cars.length) return;
    const start = new Date(formData.pickupDate);
    const end = new Date(formData.dropoffDate);
    const diffHours = (end - start) / (1000 * 60 * 60);
    const car = cars.find((c) => c.id === parseInt(formData.carId));
    if (!car) return;

    let price = 0;
    if (diffHours <= 6) price = car.six_hr_price;
    else if (diffHours <= 12) price = car.twelve_hr_price;
    else {
      const days = Math.floor(diffHours / 24);
      const rem = diffHours % 24;
      price = days * car.twentyfour_hr_price + rem * (car.twentyfour_hr_price / 24);
    }
    setCalculatedPrice(Math.round(price));
    setSelectedCar(car);
  }, [formData.pickupDate, formData.dropoffDate, formData.carId, cars]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerName || !formData.customerPhone) {
      setError("Please enter customer name and phone number");
      return;
    }
    if (!formData.carId || !formData.branchId || !formData.pickupDate || !formData.dropoffDate) {
      setError("Please fill all required fields");
      return;
    }

    const authToken = localStorage.getItem("car24_token") || token;
    if (!authToken) {
      setError("No authentication token found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const userIdValue = Math.floor(Date.now() / 1000) % 2000000000;

      const response = await createOfflineBooking({
        userId: userIdValue,
        carId: parseInt(formData.carId),
        branchId: parseInt(formData.branchId),
        startTime: formData.pickupDate,
        endTime: formData.dropoffDate,
        advancePaid: parseFloat(formData.advancePaid) || 0,
      });

      toastSuccess(response.message || "Booking created successfully!");
      if (response.booking?.confirmationNumber) {
        toastSuccess(`OTP for customer: ${response.booking.confirmationNumber}`);
      }
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        carId: "",
        branchId: userBranchId || "",
        pickupDate: "",
        dropoffDate: "",
        advancePaid: 0,
      });
      setSelectedCar(null);
      setCalculatedPrice(null);
      onSuccess();
    } catch (err) {
      const msg = err.message || "Failed to create booking";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-booking-form">
      <div className="form-header">
        <h3><UserPlus size={20} /> Create New Booking</h3>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Customer Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} disabled={loading} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Booking Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Branch *</label>
              <select name="branchId" value={formData.branchId} onChange={handleChange} required disabled={loading}>
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Car *</label>
              <select name="carId" value={formData.carId} onChange={handleChange} required disabled={!formData.branchId || loading}>
                <option value="">Select Car</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>{car.model} - {car.license_plate}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pickup Date & Time *</label>
              <input type="datetime-local" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Dropoff Date & Time *</label>
              <input type="datetime-local" name="dropoffDate" value={formData.dropoffDate} onChange={handleChange} required disabled={loading} />
            </div>
          </div>

          {selectedCar && calculatedPrice && (
            <div className="price-breakdown">
              <h4>Price Breakdown</h4>
              <div className="price-row"><span>Car Model:</span><strong>{selectedCar.model}</strong></div>
              <div className="price-row"><span>Base Rental:</span><strong>{formatCurrency(calculatedPrice)}</strong></div>
              <div className="price-row">
                <span>Advance Payment:</span>
                <input type="number" name="advancePaid" value={formData.advancePaid} onChange={handleChange} min="0" max={calculatedPrice} step="100" disabled={loading} />
              </div>
              <div className="price-row total"><span>Remaining:</span><strong>{formatCurrency(Math.max(0, calculatedPrice - (formData.advancePaid || 0)))}</strong></div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn primary" disabled={loading}>{loading ? "Creating..." : "Create Booking"}</button>
        </div>
      </form>
    </div>
  );
}

// ==================== CANCELLATION REQUESTS COMPONENT ====================
function CancellationRequests({ branchId, onRequestProcessed }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!branchId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/cancellation-requests?branchId=${branchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        console.error("Failed to fetch cancellation requests");
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching cancellation requests:", error);
      toastError("Failed to load cancellation requests");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/approve-cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toastSuccess(data.message || "Cancellation approved successfully");
        fetchRequests();
        if (onRequestProcessed) onRequestProcessed();
        setShowConfirm(null);
      } else {
        const error = await response.json();
        toastError(error.message || "Failed to approve cancellation");
      }
    } catch (error) {
      console.error("Error approving cancellation:", error);
      toastError("Failed to approve cancellation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/reject-cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toastSuccess("Cancellation request rejected");
        fetchRequests();
        if (onRequestProcessed) onRequestProcessed();
        setShowConfirm(null);
      } else {
        const error = await response.json();
        toastError(error.message || "Failed to reject cancellation");
      }
    } catch (error) {
      console.error("Error rejecting cancellation:", error);
      toastError("Failed to reject cancellation");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="cancellation-section">
        <div className="section-header">
          <h3><AlertCircle size={18} /> Cancellation Requests</h3>
        </div>
        <div className="loading-state-small">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="cancellation-section">
        <div className="section-header">
          <h3><AlertCircle size={18} /> Cancellation Requests</h3>
        </div>
        <div className="empty-state-small">
          <CheckCircle size={32} />
          <p>No pending cancellation requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cancellation-section">
      <div className="section-header">
        <h3><AlertCircle size={18} /> Cancellation Requests ({requests.length})</h3>
        <button className="refresh-small" onClick={fetchRequests}><RefreshCw size={14} /></button>
      </div>
      <div className="cancellation-list">
        {requests.map((request) => (
          <div key={request.booking_id} className="cancellation-card">
            <div className="cancellation-header">
              <div className="booking-info">
                <span className="booking-id">Booking #{request.booking_id}</span>
                <span className="customer-name">{request.user_name}</span>
              </div>
              <span className="status-badge warning">Pending</span>
            </div>
            
            <div className="cancellation-details">
              <div className="detail-row">
                <span className="label">Customer:</span>
                <span>{request.user_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Contact:</span>
                <span>{request.user_mobile} • {request.user_email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Car:</span>
                <span>{request.car_name} ({request.car_number})</span>
              </div>
              <div className="detail-row">
                <span className="label">Booking Period:</span>
                <span>{formatDt(request.pickupDate)} - {formatDt(request.dropoffDate)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span>Total: {formatCurrency(request.totalPrice)} | Advance: {formatCurrency(request.advance_paid)}</span>
              </div>
            </div>
            
            <div className="cancellation-actions">
              <button 
                className="btn-success small" 
                onClick={() => setShowConfirm({ bookingId: request.booking_id, action: 'approve' })}
                disabled={processingId === request.booking_id}
              >
                {processingId === request.booking_id ? "Processing..." : "✓ Approve"}
              </button>
              <button 
                className="btn-danger small" 
                onClick={() => setShowConfirm({ bookingId: request.booking_id, action: 'reject' })}
                disabled={processingId === request.booking_id}
              >
                {processingId === request.booking_id ? "Processing..." : "✗ Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showConfirm.action === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}</h3>
              <button className="close-btn" onClick={() => setShowConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {showConfirm.action === 'approve' ? 'approve' : 'reject'} this cancellation request?</p>
              {showConfirm.action === 'approve' && (
                <p className="warning-text">
                  <AlertTriangle size={16} /> This will cancel the booking and refund the advance amount to customer's wallet.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
              <button 
                className={showConfirm.action === 'approve' ? "btn-success" : "btn-danger"}
                onClick={() => {
                  if (showConfirm.action === 'approve') {
                    handleApprove(showConfirm.bookingId);
                  } else {
                    handleReject(showConfirm.bookingId);
                  }
                }}
              >
                Confirm {showConfirm.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== EXTENSION REQUESTS COMPONENT ====================
function ExtensionRequests({ branchId, onRequestProcessed }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!branchId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/extension-requests?branchId=${branchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        console.error("Failed to fetch extension requests");
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching extension requests:", error);
      toastError("Failed to load extension requests");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/approveExtend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });
      
      if (response.ok) {
        toastSuccess("Extension approved successfully");
        fetchRequests();
        if (onRequestProcessed) onRequestProcessed();
        setShowConfirm(null);
      } else {
        const error = await response.json();
        toastError(error.message || "Failed to approve extension");
      }
    } catch (error) {
      console.error("Error approving extension:", error);
      toastError("Failed to approve extension");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/rejectExtend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("car24_token")}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });
      
      if (response.ok) {
        toastSuccess("Extension request rejected");
        fetchRequests();
        if (onRequestProcessed) onRequestProcessed();
        setShowConfirm(null);
      } else {
        const error = await response.json();
        toastError(error.message || "Failed to reject extension");
      }
    } catch (error) {
      console.error("Error rejecting extension:", error);
      toastError("Failed to reject extension");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="extension-section">
        <div className="section-header">
          <h3><Clock size={18} /> Extension Requests</h3>
        </div>
        <div className="loading-state-small">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="extension-section">
        <div className="section-header">
          <h3><Clock size={18} /> Extension Requests</h3>
        </div>
        <div className="empty-state-small">
          <CheckCircle size={32} />
          <p>No pending extension requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="extension-section">
      <div className="section-header">
        <h3><Clock size={18} /> Extension Requests ({requests.length})</h3>
        <button className="refresh-small" onClick={fetchRequests}><RefreshCw size={14} /></button>
      </div>
      <div className="extension-list">
        {requests.map((request) => (
          <div key={request.booking_id} className="extension-card">
            <div className="extension-header">
              <div className="booking-info">
                <span className="booking-id">Booking #{request.booking_id}</span>
                <span className="customer-name">{request.user_name}</span>
              </div>
              <span className="status-badge warning">Pending</span>
            </div>
            
            <div className="extension-details">
              <div className="detail-row">
                <span className="label">Customer:</span>
                <span>{request.user_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Contact:</span>
                <span>{request.user_mobile} • {request.user_email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Car:</span>
                <span>{request.car_name} ({request.car_number})</span>
              </div>
              <div className="detail-row">
                <span className="label">Current Period:</span>
                <span>{formatDt(request.pickupDate)} - {formatDt(request.dropoffDate)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Requested Hours:</span>
                <span><strong>{request.extension_hours} hours</strong></span>
              </div>
            </div>
            
            <div className="extension-actions">
              <button 
                className="btn-success small" 
                onClick={() => setShowConfirm({ bookingId: request.booking_id, action: 'approve', hours: request.extension_hours })}
                disabled={processingId === request.booking_id}
              >
                {processingId === request.booking_id ? "Processing..." : "✓ Approve"}
              </button>
              <button 
                className="btn-danger small" 
                onClick={() => setShowConfirm({ bookingId: request.booking_id, action: 'reject' })}
                disabled={processingId === request.booking_id}
              >
                {processingId === request.booking_id ? "Processing..." : "✗ Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showConfirm.action === 'approve' ? 'Approve Extension' : 'Reject Extension'}</h3>
              <button className="close-btn" onClick={() => setShowConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {showConfirm.action === 'approve' ? 'approve' : 'reject'} this extension request?</p>
              {showConfirm.action === 'approve' && showConfirm.hours && (
                <p className="warning-text">
                  <AlertTriangle size={16} /> This will extend the booking by {showConfirm.hours} hours. Additional charges will apply.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
              <button 
                className={showConfirm.action === 'approve' ? "btn-success" : "btn-danger"}
                onClick={() => {
                  if (showConfirm.action === 'approve') {
                    handleApprove(showConfirm.bookingId);
                  } else {
                    handleReject(showConfirm.bookingId);
                  }
                }}
              >
                Confirm {showConfirm.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN STAFF DASHBOARD COMPONENT ====================
export default function StaffDashboard() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [userBranchId, setUserBranchId] = useState(null);
  const [userBranchName, setUserBranchName] = useState("");

  // Tasks/Bookings state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  // Branch specific bookings
  const [branchBookings, setBranchBookings] = useState([]);
  const [branchBookingsLoading, setBranchBookingsLoading] = useState(false);

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Tracking state
  const [trackingCar, setTrackingCar] = useState(null);
  const [trackingLocation, setTrackingLocation] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [trackingLastUpdate, setTrackingLastUpdate] = useState(null);
  const [trackingAddress, setTrackingAddress] = useState(null);
  const trackingIntervalRef = useRef(null);

  // Verify state
  const [verifyForm, setVerifyForm] = useState({ bookingId: "", key: "" });
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Start ride state
  const [startForm, setStartForm] = useState({ odometer: "", fuelLevel: "", fastagBalance: "" });
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState(null);

  // End ride state
  const [endForm, setEndForm] = useState({ 
    bookingId: "", 
    odometer: "", 
    fuelLevel: "", 
    fastagBalance: "", 
    paymentMethod: "cash",
    cashAmount: "",
    upiTransactionId: "",
    cardReference: ""
  });
  const [endLoading, setEndLoading] = useState(false);
  const [endError, setEndError] = useState(null);

  // Payment modal state
  const [showStartPaymentModal, setShowStartPaymentModal] = useState(false);
  const [startPaymentMethod, setStartPaymentMethod] = useState("cash");
  const [startPaymentAmount, setStartPaymentAmount] = useState(0);
  const [pendingStartBooking, setPendingStartBooking] = useState(null);

  // UI states
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [elapsedTimes, setElapsedTimes] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Helper functions
  const getTotalAmount = (item) => {
    return Number(item.totalPrice) || Number(item.total_amount) || Number(item.totalprice) || 0;
  };

  const getAdvancePaid = (item) => {
    return Number(item.advance_paid) || Number(item.advancePaid) || Number(item.advancepaid) || 0;
  };

  const getRemainingAmount = (item) => {
    return getTotalAmount(item) - getAdvancePaid(item);
  };

  // Get user's branch ID
  useEffect(() => {
    const getBranchInfo = async () => {
      const token = localStorage.getItem("car24_token");
      if (!token) {
        console.warn("No token found");
        setUserBranchId(1);
        setUserBranchName("Demo Branch");
        return;
      }

      try {
        const profile = await apiGet("/roleauth/getManagementProfile", { withAuth: true });
        console.log("Staff profile response:", profile);

        const branchId = profile?.branch || profile?.branch_id || profile?.branchId;
        const branchName = profile?.branch_name || profile?.branchName || "Your Branch";

        if (branchId) {
          setUserBranchId(branchId);
          setUserBranchName(branchName);
          console.log("Staff branch ID from profile:", branchId);
        } else {
          const userData = await getUserData();
          const userBranch = userData?.branch_id || userData?.branchId;
          setUserBranchId(userBranch || 1);
          setUserBranchName("Your Branch");
        }
      } catch (err) {
        console.error("Failed to fetch staff profile:", err);
        setUserBranchId(1);
        setUserBranchName("Your Branch");
      }
    };

    getBranchInfo();
  }, []);

  // Load branch-specific bookings
  const loadBranchBookings = useCallback(async () => {
    if (!userBranchId) return;

    setBranchBookingsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/getBranchBookingsByDate?branchId=${userBranchId}&date=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("car24_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let bookingsData = [];
        if (data?.data && Array.isArray(data.data)) {
          bookingsData = data.data;
        } else if (Array.isArray(data)) {
          bookingsData = data;
        }
        setBranchBookings(bookingsData);
        console.log(`Loaded ${bookingsData.length} bookings for branch ${userBranchId}`);
      } else {
        setBranchBookings([]);
      }
    } catch (error) {
      console.error("Failed to load branch bookings:", error);
      setBranchBookings([]);
    } finally {
      setBranchBookingsLoading(false);
    }
  }, [userBranchId, dateFilter]);

  // Load customers from branch bookings
  const loadCustomers = useCallback(async () => {
    if (!userBranchId) return;

    setCustomersLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookingApi/getBranchBookingsByDate?branchId=${userBranchId}&date=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("car24_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let bookingsData = [];
        if (data?.data && Array.isArray(data.data)) {
          bookingsData = data.data;
        } else if (Array.isArray(data)) {
          bookingsData = data;
        }

        const customerMap = new Map();

        for (const booking of bookingsData) {
          const customerKey = booking.user_id || booking.customer_email || booking.email || booking.customer_name;
          
          if (customerKey && !customerMap.has(customerKey)) {
            let userDetails = {};
            if (booking.user_id) {
              try {
                const userResponse = await fetch(`${API_BASE}/user/getUserById/${booking.user_id}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("car24_token")}` },
                });
                if (userResponse.ok) {
                  userDetails = await userResponse.json();
                }
              } catch (err) {
                console.warn("Failed to fetch user details:", err);
              }
            }

            const customerEmail = booking.customer_email || booking.email || userDetails?.email || "—";
            const customerAddress = booking.customer_address || booking.address || userDetails?.address || "—";
            const customerCity = booking.customer_city || booking.city || userDetails?.city || "—";
            const customerPhone = booking.customer_phone || booking.phone || userDetails?.mobileno || "—";
            const customerName = booking.customer_name || userDetails?.name || booking.name || "Unknown Customer";

            customerMap.set(customerKey, {
              id: booking.user_id,
              name: customerName,
              phone: customerPhone,
              email: customerEmail,
              address: customerAddress,
              city: customerCity,
              dob: userDetails?.dob || booking.dob || "—",
              totalBookings: 1,
              totalSpent: Number(booking.totalPrice) || 0,
              lastBooking: booking.pickupDate,
              dp_url: booking.customer_dp_url || userDetails?.dp_url,
              id_url: booking.customer_id_masked_url || userDetails?.aadhar_masked_url,
              license_url: booking.customer_license_masked_url || userDetails?.license_masked_url,
            });
          } else if (customerMap.has(customerKey)) {
            const existing = customerMap.get(customerKey);
            existing.totalBookings++;
            existing.totalSpent += Number(booking.totalPrice) || 0;
          }
        }

        setCustomers(Array.from(customerMap.values()));
        console.log(`Loaded ${customerMap.size} customers for branch ${userBranchId}`);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [userBranchId, dateFilter]);

  // Load tasks (rides for today)
  // Load tasks (rides for today and active rides)
const loadTasks = useCallback(async () => {
  if (!userBranchId) return;

  setTasksLoading(true);
  setTasksError(null);
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // 1. Fetch pending tasks from staff tasks API
    let tasksData = [];
    try {
      const rows = await getStaffTasks(today, userBranchId);
      tasksData = Array.isArray(rows) ? rows : [];
      console.log("Staff tasks (pending):", tasksData.length);
    } catch (err) {
      console.error("Error fetching staff tasks:", err);
    }
    
    // 2. ALSO fetch active rides from branch bookings for today
    try {
      const response = await fetch(`${API_BASE}/bookingApi/getBranchBookingsByDate?branchId=${userBranchId}&date=${today}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("car24_token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        let allBookings = [];
        if (data?.data && Array.isArray(data.data)) {
          allBookings = data.data;
        } else if (Array.isArray(data)) {
          allBookings = data;
        }
        
        // Filter active rides (started but not ended)
        const activeRidesFromBookings = allBookings.filter(booking => 
          booking.ride_start_time && !booking.ride_end_time
        );
        
        console.log("Active rides from branch bookings:", activeRidesFromBookings.length);
        
        // Merge active rides with pending tasks (avoid duplicates)
        const existingBookingIds = new Set(tasksData.map(t => t.booking_id));
        const newActiveRides = activeRidesFromBookings.filter(booking => 
          !existingBookingIds.has(booking.booking_id)
        );
        
        tasksData = [...tasksData, ...newActiveRides];
        console.log("Total tasks after merge:", tasksData.length);
      }
    } catch (err) {
      console.error("Error fetching active rides from bookings:", err);
    }

    // 3. Enrich tasks with additional booking details
    if (tasksData.length > 0) {
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          try {
            const bookingDetails = await getBookingDetails(task.booking_id);
            return {
              ...task,
              ...bookingDetails,
              totalPrice: bookingDetails.totalPrice || task.totalPrice || 0,
              advance_paid: bookingDetails.advance_paid || task.advance_paid || 0,
              duration: calculateDuration(task.pickupDate, task.dropoffDate),
              customer_dp_url: task.customer_dp_url || bookingDetails.customer_dp_url,
              customer_id_masked_url: task.customer_id_masked_url || bookingDetails.customer_id_masked_url,
              customer_license_masked_url: task.customer_license_masked_url || bookingDetails.customer_license_masked_url,
            };
          } catch (err) {
            console.error(`Failed to fetch booking details for ${task.booking_id}:`, err);
            return task;
          }
        })
      );
      tasksData = enrichedTasks;
    }

    setTasks(tasksData);
    console.log(`Loaded ${tasksData.length} total tasks`);
    console.log("Pending pickup:", tasksData.filter(t => !t.ride_start_time).length);
    console.log("Active rides:", tasksData.filter(t => t.ride_start_time && !t.ride_end_time).length);
    
  } catch (e) {
    console.error("Load tasks error:", e);
    setTasksError(e.message || "Could not load tasks");
  } finally {
    setTasksLoading(false);
  }
}, [userBranchId]);

  // Load all data when branch ID is available
  useEffect(() => {
    if (userBranchId) {
      loadTasks();
      loadBranchBookings();
      loadCustomers();
    }
  }, [userBranchId, loadTasks, loadBranchBookings, loadCustomers]);

  // Filter tasks - ACTIVE RIDES are those with ride_start_time AND no ride_end_time
  const pendingPickup = tasks.filter((t) => !t.ride_start_time);
  const activeRides = tasks.filter((t) => t.ride_start_time && !t.ride_end_time);
  const completedRides = tasks.filter((t) => t.ride_end_time);

  // Debug log to check active rides
  useEffect(() => {
    console.log("Total tasks:", tasks.length);
    console.log("Active rides:", activeRides.length);
    console.log("Active rides data:", activeRides);
  }, [tasks, activeRides]);

  // Filtered bookings based on search
  const filteredBookings = useMemo(() => {
    let filtered = [...branchBookings];

    if (bookingFilter !== "all") {
      filtered = filtered.filter(booking => {
        if (bookingFilter === "pending") return !booking.ride_start_time;
        if (bookingFilter === "active") return booking.ride_start_time && !booking.ride_end_time;
        if (bookingFilter === "completed") return booking.ride_end_time;
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(term) ||
        booking.car_model?.toLowerCase().includes(term) ||
        booking.car_plate?.toLowerCase().includes(term) ||
        booking.booking_id?.toString().includes(term)
      );
    }

    return filtered;
  }, [branchBookings, bookingFilter, searchTerm]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // Update elapsed times for active rides
  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsed = {};
      activeRides.forEach((ride) => {
        if (ride.ride_start_time) newElapsed[ride.booking_id] = formatElapsed(ride.ride_start_time);
      });
      setElapsedTimes(newElapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRides]);

  // Tracking functions
  const fetchAddress = async (latitude, longitude) => {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const geoData = await geoRes.json();
      setTrackingAddress(geoData.display_name || null);
    } catch {
      setTrackingAddress(null);
    }
  };

  const fetchTrackingLocation = async (carId, isRefresh = false) => {
    if (!carId) return;
    if (!isRefresh) setTrackingLoading(true);
    setTrackingError(null);

    try {
      const response = await getCarGpsLocation(carId);
      if (response?.success && response?.location?.latitude != null) {
        setTrackingLocation(response.location);
        setTrackingLastUpdate(new Date());
        await fetchAddress(response.location.latitude, response.location.longitude);
      } else {
        setTrackingError(response?.message || "Location not available");
      }
    } catch (err) {
      setTrackingError(err?.message || "Failed to fetch location");
    } finally {
      if (!isRefresh) setTrackingLoading(false);
    }
  };

  const handleTrackCar = (carId, carModel, carPlate) => {
    setTrackingLocation(null);
    setTrackingError(null);
    setTrackingAddress(null);
    setTrackingCar({ id: carId, model: carModel, license_plate: carPlate });
    setActiveTab("tracking");
  };

  useEffect(() => {
    if (trackingCar && trackingCar.id && activeTab === "tracking") {
      fetchTrackingLocation(trackingCar.id);
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = setInterval(() => {
        if (trackingCar && trackingCar.id) fetchTrackingLocation(trackingCar.id, true);
      }, 10000);
      return () => {
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      };
    }
  }, [trackingCar, activeTab]);

  // Verification and Ride functions
  async function handleVerify(e) {
    e.preventDefault();
    setVerifyError(null);
    setVerifyResult(null);
    setVerifyLoading(true);

    try {
      const booking = tasks.find(t => t.booking_id === parseInt(verifyForm.bookingId)) ||
        branchBookings.find(b => b.booking_id === parseInt(verifyForm.bookingId));
      if (!booking) throw new Error("Booking not found");
      const customerUserId = booking.userId || booking.user_id;
      if (!customerUserId) throw new Error("Customer ID not found");

      const res = await verifyCarKey(verifyForm.bookingId, verifyForm.key, customerUserId);
      setVerifyResult({ ...res, bookingDetails: booking });
      toastSuccess("Key verified successfully!");
    } catch (err) {
      setVerifyError(err.message || "Verification failed");
      toastError(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function executeStartRide({ bookingToken, odometer, fuelLevel, fastagBalance, paymentMethod, ride_start_amount }) {
    setStartError(null);
    setStartLoading(true);

    try {
      const res = await startRide({
        odometer, fuelLevel, fastagBalance, bookingToken,
        paymentMethod, ride_start_amount
      });

      toastSuccess(`Ride started!${ride_start_amount > 0 ? ` Collected ${formatCurrency(ride_start_amount)}` : ''}`);
      loadTasks();
      loadBranchBookings();
      setVerifyResult(null);
      setVerifyForm({ bookingId: "", key: "" });
      setStartForm({ odometer: "", fuelLevel: "", fastagBalance: "" });
      setShowStartPaymentModal(false);
      setPendingStartBooking(null);
    } catch (err) {
      setStartError(err.message || "Failed to start ride");
      toastError(err.message || "Failed to start ride");
    } finally {
      setStartLoading(false);
    }
  }

  async function handleStartRideWithPayment(e) {
    e.preventDefault();
    if (!verifyResult?.bookingToken) {
      setStartError("Please verify customer key first");
      return;
    }

    const fastagBalanceNum = parseFloat(startForm.fastagBalance?.toString().replace(/[₹,]/g, '') || '0');
    const odometerNum = Number(startForm.odometer) || 0;

    if (odometerNum <= 0) {
      setStartError("Odometer reading required");
      return;
    }
    if (!startForm.fuelLevel) {
      setStartError("Please select fuel level");
      return;
    }

    const remainingAmount = getRemainingAmount(verifyResult.bookingDetails);

    if (remainingAmount > 0) {
      setStartPaymentAmount(remainingAmount);
      setPendingStartBooking({
        bookingToken: verifyResult.bookingToken,
        odometer: odometerNum,
        fuelLevel: startForm.fuelLevel,
        fastagBalance: fastagBalanceNum,
        bookingDetails: verifyResult.bookingDetails
      });
      setShowStartPaymentModal(true);
    } else {
      await executeStartRide({
        bookingToken: verifyResult.bookingToken,
        odometer: odometerNum,
        fuelLevel: startForm.fuelLevel,
        fastagBalance: fastagBalanceNum,
        paymentMethod: null,
        ride_start_amount: 0
      });
    }
  }

  async function handleEndRide(e) {
    e.preventDefault();
    setEndError(null);

    const odometerNum = Number(endForm.odometer) || 0;
    if (odometerNum <= 0) {
      setEndError("Odometer reading required");
      return;
    }
    if (!endForm.fuelLevel) {
      setEndError("Please select fuel level");
      return;
    }

    // Validate payment details based on method
    if (endForm.paymentMethod === "cash") {
      const cashAmount = parseFloat(endForm.cashAmount) || 0;
      if (cashAmount <= 0) {
        setEndError("Please enter the cash amount collected");
        return;
      }
    } else if (endForm.paymentMethod === "upi") {
      if (!endForm.upiTransactionId || endForm.upiTransactionId.trim() === "") {
        setEndError("Please enter UPI transaction ID");
        return;
      }
    } else if (endForm.paymentMethod === "card") {
      if (!endForm.cardReference || endForm.cardReference.trim() === "") {
        setEndError("Please enter card transaction reference");
        return;
      }
    }

    setEndLoading(true);

    try {
      const bookingDetails = await getBookingDetails(endForm.bookingId);
      const totalAmount = getTotalAmount(bookingDetails);
      const advancePaid = getAdvancePaid(bookingDetails);
      const pendingAmount = totalAmount - advancePaid;
      
      let rideEndAmount = 0;
      
      if (endForm.paymentMethod === "cash") {
        rideEndAmount = parseFloat(endForm.cashAmount) || 0;
        if (rideEndAmount < pendingAmount) {
          setEndError(`Please collect full pending amount of ${formatCurrency(pendingAmount)}`);
          setEndLoading(false);
          return;
        }
      }

      const res = await endRide(endForm.bookingId, {
        odometer: odometerNum,
        fuelLevel: endForm.fuelLevel,
        fastagBalance: parseFloat(endForm.fastagBalance?.toString().replace(/[₹,]/g, '') || '0'),
        ride_end_amount: rideEndAmount,
        paymentMethod: endForm.paymentMethod,
        upiTransactionId: endForm.paymentMethod === "upi" ? endForm.upiTransactionId : null,
        cashAmount: endForm.paymentMethod === "cash" ? rideEndAmount : null,
        cardReference: endForm.paymentMethod === "card" ? endForm.cardReference : null
      });

      toastSuccess("Ride ended successfully!");
      loadTasks();
      loadBranchBookings();
      setEndForm({ 
        bookingId: "", 
        odometer: "", 
        fuelLevel: "", 
        fastagBalance: "", 
        paymentMethod: "cash",
        cashAmount: "",
        upiTransactionId: "",
        cardReference: ""
      });
    } catch (err) {
      setEndError(err.message || "Could not end ride");
      toastError(err.message || "Could not end ride");
    } finally {
      setEndLoading(false);
    }
  }

  function prefillVerify(bookingId, bookingData) {
    setVerifyForm({ bookingId: String(bookingId), key: "" });
    setVerifyResult({ bookingDetails: bookingData });
    setActiveTab("verify");
  }

  function prefillEndRide(bookingId, bookingData) {
    const totalAmount = getTotalAmount(bookingData);
    const advancePaid = getAdvancePaid(bookingData);
    const pendingAmount = totalAmount - advancePaid;
    
    setEndForm({
      bookingId: String(bookingId),
      odometer: "",
      fuelLevel: "",
      fastagBalance: "",
      paymentMethod: "cash",
      cashAmount: pendingAmount > 0 ? pendingAmount.toString() : "",
      upiTransactionId: "",
      cardReference: ""
    });
    setActiveTab("verify");
  }

  const handleBookingCreated = () => {
    setShowCreateBooking(false);
    loadTasks();
    loadBranchBookings();
    loadCustomers();
  };

  const refreshAllData = () => {
    loadTasks();
    loadBranchBookings();
    loadCustomers();
    toastSuccess("Data refreshed");
  };

  const getStatusClass = (booking) => {
    if (booking.ride_end_time) return "completed";
    if (booking.ride_start_time) return "active";
    if (booking.status === "cancelled") return "cancelled";
    return "pending";
  };

  const getStatusText = (booking) => {
    if (booking.ride_end_time) return "Completed";
    if (booking.ride_start_time) return "Active";
    if (booking.status === "cancelled") return "Cancelled";
    return "Pending";
  };

  // Task Card Renderer
 const renderTaskCard = (task, type) => {
  const totalAmount = getTotalAmount(task);
  const advancePaid = getAdvancePaid(task);
  const remainingAmount = totalAmount - advancePaid;
  const hasDocuments = task.customer_dp_url || task.customer_id_masked_url || task.customer_license_masked_url;
  
  // Get license plate from various possible fields
  const licensePlate = task.licensePlate || task.car_plate || task.car_number || task.number_plate || task.license_plate || "—";

  return (
    <div key={task.booking_id} className={`task-card ${type === "pending" ? "pending" : "active"}`}>
      <div className="task-header">
        <div>
          <h4>{task.car_model || "Unknown Car"}</h4>
          <p className="license-plate">
            <Truck size={12} /> {licensePlate}
          </p>
        </div>
        <div className="task-badges">
          <TrackButton carId={task.car_id} carModel={task.car_model} carPlate={licensePlate} onTrack={handleTrackCar} size="small" />
          <span className={`status-badge ${type === "pending" ? "pending" : "active"}`}>
            {type === "pending" ? "Pending Pickup" : "Active Ride"}
          </span>
        </div>
      </div>

      <div className="task-customer-info">
        <div className="customer-details">
          <User size={14} /> <strong>{task.customer_name || "Unknown"}</strong>
          <span className="customer-phone">📞 {task.customer_phone || "—"}</span>
          <span className="customer-email">✉️ {task.customer_email || "—"}</span>
        </div>
      </div>

      {hasDocuments && (
        <div className="task-documents">
          <h4><FileText size={12} /> Customer Documents</h4>
          <div className="documents-grid">
            {task.customer_dp_url && (
              <div className="doc-item" onClick={() => setSelectedDocument({ url: task.customer_dp_url, title: "Profile Photo" })}>
                <img src={task.customer_dp_url} alt="Profile" className="doc-thumb" />
                <span><Camera size={10} /> Profile</span>
              </div>
            )}
            {task.customer_id_masked_url && (
              <div className="doc-item" onClick={() => setSelectedDocument({ url: task.customer_id_masked_url, title: "Aadhar Card" })}>
                <img src={task.customer_id_masked_url} alt="Aadhar" className="doc-thumb" />
                <span><IdCard size={10} /> Aadhar</span>
              </div>
            )}
            {task.customer_license_masked_url && (
              <div className="doc-item" onClick={() => setSelectedDocument({ url: task.customer_license_masked_url, title: "Driving License" })}>
                <img src={task.customer_license_masked_url} alt="License" className="doc-thumb" />
                <span><Award size={10} /> License</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="task-time">
        <Calendar size={14} /> Pickup: {formatDt(task.pickupDate)}
      </div>
      {type === "active" && task.ride_start_time && (
        <div className="task-time">
          <Clock size={14} /> Elapsed: {elapsedTimes[task.booking_id] || formatElapsed(task.ride_start_time)}
        </div>
      )}

      <div className="task-payment">
        <div>💰 Total: {formatCurrency(totalAmount)}</div>
        <div>✅ Paid: {formatCurrency(advancePaid)}</div>
        <div className={remainingAmount > 0 ? "pending-amount" : "paid-amount"}>
          ⏳ Pending: {formatCurrency(remainingAmount)}
        </div>
      </div>

      <div className="task-actions">
        {type === "pending" && (
          <button className="btn-primary small" onClick={() => prefillVerify(task.booking_id, task)}>
            Verify & Start Ride
          </button>
        )}
        {type === "active" && (
          <button
            className="btn-danger small"
            onClick={() => prefillEndRide(task.booking_id, task)}
          >
            End Ride
          </button>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="sdb-root">
      {/* Header */}
      <div className="sdb-header">
        <div>
          <p className="sdb-eyebrow">
            <Shield size={14} />
            Staff Dashboard • {userBranchName}
          </p>
          <h1 className="sdb-title">Welcome, {user?.name || "Staff"}</h1>
        </div>
        <div className="sdb-header-stats">
          <div className="sdb-mini-stat">
            <span className="sdb-mini-num">{pendingPickup.length}</span>
            <span className="sdb-mini-label">Pending</span>
          </div>
          <div className="sdb-mini-stat active">
            <span className="sdb-mini-num">{activeRides.length}</span>
            <span className="sdb-mini-label">Active</span>
          </div>
          <div className="sdb-mini-stat completed">
            <span className="sdb-mini-num">{branchBookings.length}</span>
            <span className="sdb-mini-label">Bookings</span>
          </div>
          <div className="sdb-mini-stat customers">
            <span className="sdb-mini-num">{customers.length}</span>
            <span className="sdb-mini-label">Customers</span>
          </div>
          <button className="refresh-btn" onClick={refreshAllData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sdb-tabs">
        <button className={`sdb-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          <Home size={14} /> Overview
        </button>
        <button className={`sdb-tab ${activeTab === "customers" ? "active" : ""}`} onClick={() => setActiveTab("customers")}>
          <Users size={14} /> Customers <span className="badge">{customers.length}</span>
        </button>
        <button className={`sdb-tab ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
          <Calendar size={14} /> Bookings <span className="badge">{branchBookings.length}</span>
        </button>
        <button className={`sdb-tab ${activeTab === "tasks" ? "active" : ""}`} onClick={() => setActiveTab("tasks")}>
          <Car size={14} /> Tasks {(pendingPickup.length + activeRides.length) > 0 && <span className="badge">{pendingPickup.length + activeRides.length}</span>}
        </button>
        <button className={`sdb-tab ${activeTab === "cancellations" ? "active" : ""}`} onClick={() => setActiveTab("cancellations")}>
          <AlertCircle size={14} /> Cancellations
        </button>
        <button className={`sdb-tab ${activeTab === "extensions" ? "active" : ""}`} onClick={() => setActiveTab("extensions")}>
          <Clock size={14} /> Extensions
        </button>
        <button className={`sdb-tab ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>
          <PlusCircle size={14} /> Create Booking
        </button>
        <button className={`sdb-tab ${activeTab === "tracking" ? "active" : ""}`} onClick={() => setActiveTab("tracking")}>
          <MapPin size={14} /> Live Tracking
        </button>
        <button className={`sdb-tab ${activeTab === "verify" ? "active" : ""}`} onClick={() => setActiveTab("verify")}>
          <Key size={14} /> Verify & Control
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="sdb-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon pending"><Clock size={24} /></div>
              <div className="stat-info">
                <h3>{pendingPickup.length}</h3>
                <p>Pending Pickup</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon active"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <h3>{activeRides.length}</h3>
                <p>Active Rides</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completed"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <h3>{completedRides.length}</h3>
                <p>Completed Today</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon customers"><Users size={24} /></div>
              <div className="stat-info">
                <h3>{customers.length}</h3>
                <p>Total Customers</p>
              </div>
            </div>
          </div>

          <div className="recent-section">
            <h3>Recent Bookings</h3>
            <div className="recent-list">
              {branchBookings.slice(0, 5).map(booking => (
                <div key={booking.booking_id} className="recent-item">
                  <div className="recent-info">
                    <strong>{booking.customer_name || "Unknown"}</strong>
                    <span>{booking.car_model}</span>
                    <small>{formatDt(booking.pickupDate)}</small>
                  </div>
                  <span className={`status-badge ${getStatusClass(booking)}`}>
                    {getStatusText(booking)}
                  </span>
                </div>
              ))}
              {branchBookings.length === 0 && (
                <div className="empty-state">No bookings found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="sdb-panel">
          <div className="section-header">
            <h2><Users size={20} /> Customers - {userBranchName}</h2>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, phone, email or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {customersLoading ? (
            <div className="loading-state">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No customers found for this branch</p>
            </div>
          ) : (
            <div className="customers-grid">
              {filteredCustomers.map((customer, idx) => (
                <div key={idx} className="customer-card">
                  <div className="customer-avatar">
                    {customer.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="customer-details">
                    <h4>{customer.name}</h4>
                    <p><Phone size={12} /> {customer.phone}</p>
                    <p><Mail size={12} /> {customer.email}</p>
                    <p><MapPin size={12} /> {customer.city}, {customer.address}</p>
                    <div className="customer-stats">
                      <span><Calendar size={12} /> {customer.totalBookings} bookings</span>
                      <span><DollarSign size={12} /> {formatCurrency(customer.totalSpent)}</span>
                      <span>Last: {formatDt(customer.lastBooking)}</span>
                    </div>
                    {customer.dob && customer.dob !== "—" && (
                      <p className="customer-dob"><Award size={12} /> DOB: {new Date(customer.dob).toLocaleDateString()}</p>
                    )}
                    {(customer.dp_url || customer.id_url || customer.license_url) && (
                      <div className="customer-documents">
                        {customer.dp_url && (
                          <span className="doc-badge" onClick={() => setSelectedDocument({ url: customer.dp_url, title: `${customer.name}'s Profile` })}>
                            <Camera size={12} /> Photo
                          </span>
                        )}
                        {customer.id_url && (
                          <span className="doc-badge" onClick={() => setSelectedDocument({ url: customer.id_url, title: `${customer.name}'s Aadhar Card` })}>
                            <IdCard size={12} /> Aadhar
                          </span>
                        )}
                        {customer.license_url && (
                          <span className="doc-badge" onClick={() => setSelectedDocument({ url: customer.license_url, title: `${customer.name}'s Driving License` })}>
                            <Award size={12} /> License
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="sdb-panel">
          <div className="section-header">
            <h2><Calendar size={20} /> Bookings - {userBranchName}</h2>
            <div className="filters">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="date-filter"
              />
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Pickup</option>
                <option value="active">Active Rides</option>
                <option value="completed">Completed</option>
              </select>
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {branchBookingsLoading ? (
            <div className="loading-state">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <p>No bookings found for {dateFilter}</p>
            </div>
          ) : (
            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr><th>ID</th><th>Customer</th><th>Car</th><th>Plate</th><th>Pickup</th><th>Dropoff</th><th>Amount</th><th>Paid</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const total = getTotalAmount(booking);
                    const paid = getAdvancePaid(booking);
                    const status = getStatusClass(booking);
                    return (
                      <tr key={booking.booking_id}>
                        <td>#{booking.booking_id}</td>
                        <td>{booking.customer_name || "—"}</td>
                        <td>{booking.car_model || "—"}</td>
                        <td>{booking.licensePlate || booking.car_plate || booking.car_number || booking.number_plate||"—"}</td>
                        <td>{formatDt(booking.pickupDate)}</td>
                        <td>{formatDt(booking.dropoffDate)}</td>
                        <td className="amount">{formatCurrency(total)}</td>
                        <td className="amount paid">{formatCurrency(paid)}</td>
                        <td><span className={`status-badge ${status}`}>{getStatusText(booking)}</span></td>
                        <td className="actions">
                          {booking.car_id && (
                            <TrackButton
                              carId={booking.car_id}
                              carModel={booking.car_model}
                              carPlate={booking.licensePlate || booking.number_plate}
                              onTrack={handleTrackCar}
                              size="small"
                            />
                          )}
                          {status === "pending" && (
                            <button className="btn-small primary" onClick={() => prefillVerify(booking.booking_id, booking)}>Verify</button>
                          )}
                          {status === "active" && (
                            <button className="btn-small danger" onClick={() => prefillEndRide(booking.booking_id, booking)}>End</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="sdb-panel">
          {tasksError && <div className="error-banner">{tasksError}</div>}

          {tasksLoading ? (
            <div className="loading-state">Loading tasks...</div>
          ) : (
            <>
              <div className="task-section">
                <h3><Clock size={16} /> Pending Pickup ({pendingPickup.length})</h3>
                {pendingPickup.length === 0 ? (
                  <div className="empty-state small">No pending pickups</div>
                ) : (
                  <div className="tasks-grid">
                    {pendingPickup.map(task => renderTaskCard(task, "pending"))}
                  </div>
                )}
              </div>

              <div className="task-section">
                <h3><TrendingUp size={16} /> Active Rides ({activeRides.length})</h3>
                {activeRides.length === 0 ? (
                  <div className="empty-state small">No active rides</div>
                ) : (
                  <div className="tasks-grid">
                    {activeRides.map(task => renderTaskCard(task, "active"))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cancellation Requests Tab */}
      {activeTab === "cancellations" && (
        <div className="sdb-panel">
          <CancellationRequests 
            branchId={userBranchId} 
            onRequestProcessed={() => {
              loadTasks();
              loadBranchBookings();
            }}
          />
        </div>
      )}

      {/* Extension Requests Tab */}
      {activeTab === "extensions" && (
        <div className="sdb-panel">
          <ExtensionRequests 
            branchId={userBranchId} 
            onRequestProcessed={() => {
              loadTasks();
              loadBranchBookings();
            }}
          />
        </div>
      )}

      {/* Create Booking Tab */}
      {activeTab === "create" && (
        <div className="sdb-panel">
          {showCreateBooking ? (
            <CreateBookingForm onSuccess={handleBookingCreated} onCancel={() => setShowCreateBooking(false)} userBranchId={userBranchId} />
          ) : (
            <div className="create-prompt">
              <div className="prompt-icon"><UserPlus size={64} /></div>
              <h3>Create New Booking</h3>
              <p>Register a new booking for a customer at the counter</p>
              <button className="btn-primary" onClick={() => setShowCreateBooking(true)}>
                <PlusCircle size={18} /> Create New Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="sdb-panel tracking-panel">
          {!trackingCar ? (
            <div className="tracking-empty">
              <Navigation size={64} />
              <h3>No Vehicle Selected</h3>
              <p>Click "Track Live" on any active ride to see its location</p>
              {activeRides.length > 0 && (
                <div className="active-rides-list">
                  <h4>Active Rides:</h4>
                  {activeRides.map(ride => (
                    <button key={ride.booking_id} className="track-select-btn" onClick={() => handleTrackCar(ride.car_id, ride.car_model, ride.car_plate)}>
                      <MapPin size={14} /> {ride.car_model} • {ride.car_plate}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="tracking-active">
              <div className="tracking-header">
                <div className="tracking-car-info">
                  <Navigation size={24} />
                  <div><h3>{trackingCar.model}</h3><p>{trackingCar.license_plate}</p></div>
                </div>
                <div className="tracking-controls">
                  <span>Updated: {trackingLastUpdate?.toLocaleTimeString() || "—"}</span>
                  <button onClick={() => fetchTrackingLocation(trackingCar.id)} disabled={trackingLoading}>
                    <RefreshCw size={14} className={trackingLoading ? "spin" : ""} /> Refresh
                  </button>
                  <button className="stop-btn" onClick={() => setTrackingCar(null)}>Stop</button>
                </div>
              </div>
              {trackingLocation && (
                <div className="tracking-location-info">
                  <MapPin size={14} />
                  <span>{trackingAddress || `${trackingLocation.latitude}, ${trackingLocation.longitude}`}</span>
                  <a href={`https://www.google.com/maps?q=${trackingLocation.latitude},${trackingLocation.longitude}`} target="_blank" rel="noopener">Open Maps ↗</a>
                </div>
              )}
              <div className="tracking-map">
                {trackingLoading && !trackingLocation && <div className="map-loading">Loading location...</div>}
                {trackingError && <div className="map-error">{trackingError}</div>}
                {trackingLocation && (
                  <iframe title="Vehicle Location" src={`https://maps.google.com/maps?q=${trackingLocation.latitude},${trackingLocation.longitude}&z=15&output=embed`} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verify Tab */}
      {activeTab === "verify" && (
        <div className="sdb-panel verify-panel">
          <div className="verify-grid">
            <div className="verify-card">
              <h3><Key size={18} /> Verify Customer Key</h3>
              <form onSubmit={handleVerify}>
                <input type="text" placeholder="Booking ID" value={verifyForm.bookingId} onChange={(e) => setVerifyForm({ ...verifyForm, bookingId: e.target.value })} required />
                <input type="text" placeholder="OTP / Key" value={verifyForm.key} onChange={(e) => setVerifyForm({ ...verifyForm, key: e.target.value })} required />
                {verifyError && <div className="error-message">{verifyError}</div>}
                {verifyResult?.bookingDetails && (
                  <div className="booking-summary">
                    <p><strong>Customer:</strong> {verifyResult.bookingDetails.customer_name}</p>
                    <p><strong>Car:</strong> {verifyResult.bookingDetails.car_model}</p>
                    <p><strong>Total:</strong> {formatCurrency(getTotalAmount(verifyResult.bookingDetails))}</p>
                    <p><strong>Paid:</strong> {formatCurrency(getAdvancePaid(verifyResult.bookingDetails))}</p>
                    <p className="pending"><strong>Pending:</strong> {formatCurrency(getRemainingAmount(verifyResult.bookingDetails))}</p>
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={verifyLoading}>{verifyLoading ? "Verifying..." : "Verify Key"}</button>
              </form>
            </div>

            <div className="verify-card">
              <h3><Gauge size={18} /> Start Ride</h3>
              {!verifyResult?.bookingToken ? (
                <p className="hint">🔑 Verify a key first</p>
              ) : (
                <form onSubmit={handleStartRideWithPayment}>
                  <input type="number" step="0.1" placeholder="Odometer (km)" value={startForm.odometer} onChange={(e) => setStartForm({ ...startForm, odometer: e.target.value })} required />
                  <select value={startForm.fuelLevel} onChange={(e) => setStartForm({ ...startForm, fuelLevel: e.target.value })} required>
                    <option value="">Fuel Level</option><option value="Full">Full</option><option value="3/4">3/4</option><option value="1/2">1/2</option><option value="1/4">1/4</option><option value="Empty">Empty</option>
                  </select>
                  <input type="text" placeholder="Fastag Balance" value={startForm.fastagBalance} onChange={(e) => setStartForm({ ...startForm, fastagBalance: e.target.value })} required />
                  {startError && <div className="error-message">{startError}</div>}
                  <button type="submit" className="btn-success" disabled={startLoading}>{startLoading ? "Starting..." : "Start Ride"}</button>
                </form>
              )}
            </div>

            <div className="verify-card">
              <h3><CheckCircle size={18} /> End Ride</h3>
              <form onSubmit={handleEndRide}>
                <input type="text" placeholder="Booking ID" value={endForm.bookingId} onChange={(e) => setEndForm({ ...endForm, bookingId: e.target.value })} required />
                <input type="number" step="0.1" placeholder="Odometer (km)" value={endForm.odometer} onChange={(e) => setEndForm({ ...endForm, odometer: e.target.value })} required />
                <select value={endForm.fuelLevel} onChange={(e) => setEndForm({ ...endForm, fuelLevel: e.target.value })} required>
                  <option value="">Fuel Level</option>
                  <option value="Full">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="Empty">Empty</option>
                </select>
                <input type="text" placeholder="Fastag Balance" value={endForm.fastagBalance} onChange={(e) => setEndForm({ ...endForm, fastagBalance: e.target.value })} />
                
                {/* Payment Method Selection */}
                <div className="payment-method-group">
                  <label>Payment Method *</label>
                  <div className="payment-method-options">
                    <label className={`method-option ${endForm.paymentMethod === "cash" ? "selected" : ""}`}>
                      <input type="radio" name="endPaymentMethod" value="cash" checked={endForm.paymentMethod === "cash"} onChange={(e) => setEndForm({ ...endForm, paymentMethod: e.target.value, cashAmount: "", upiTransactionId: "", cardReference: "" })} />
                      <Banknote size={16} /> Cash
                    </label>
                    <label className={`method-option ${endForm.paymentMethod === "upi" ? "selected" : ""}`}>
                      <input type="radio" name="endPaymentMethod" value="upi" checked={endForm.paymentMethod === "upi"} onChange={(e) => setEndForm({ ...endForm, paymentMethod: e.target.value, cashAmount: "", upiTransactionId: "", cardReference: "" })} />
                      <Smartphone size={16} /> UPI
                    </label>
                    <label className={`method-option ${endForm.paymentMethod === "card" ? "selected" : ""}`}>
                      <input type="radio" name="endPaymentMethod" value="card" checked={endForm.paymentMethod === "card"} onChange={(e) => setEndForm({ ...endForm, paymentMethod: e.target.value, cashAmount: "", upiTransactionId: "", cardReference: "" })} />
                      <CreditCard size={16} /> Card
                    </label>
                  </div>
                </div>

                {/* Cash Amount Field */}
                {endForm.paymentMethod === "cash" && (
                  <div className="payment-detail-field">
                    <label>Cash Amount Collected *</label>
                    <div className="input-with-icon">
                      <DollarSign size={16} className="input-icon-left" />
                      <input type="number" step="100" placeholder="Enter amount collected" value={endForm.cashAmount} onChange={(e) => setEndForm({ ...endForm, cashAmount: e.target.value })} required />
                    </div>
                    <small className="field-hint">Enter the total cash amount collected from customer</small>
                  </div>
                )}

                {/* UPI Transaction ID Field */}
                {endForm.paymentMethod === "upi" && (
                  <div className="payment-detail-field">
                    <label>UPI Transaction ID *</label>
                    <div className="input-with-icon">
                      <Smartphone size={16} className="input-icon-left" />
                      <input type="text" placeholder="e.g., 123456789012" value={endForm.upiTransactionId} onChange={(e) => setEndForm({ ...endForm, upiTransactionId: e.target.value })} required />
                    </div>
                    <small className="field-hint">Enter the UPI transaction ID from the payment</small>
                  </div>
                )}

                {/* Card Reference Field */}
                {endForm.paymentMethod === "card" && (
                  <div className="payment-detail-field">
                    <label>Card Transaction Reference *</label>
                    <div className="input-with-icon">
                      <CreditCard size={16} className="input-icon-left" />
                      <input type="text" placeholder="Enter transaction reference number" value={endForm.cardReference} onChange={(e) => setEndForm({ ...endForm, cardReference: e.target.value })} required />
                    </div>
                    <small className="field-hint">Enter the card transaction reference number</small>
                  </div>
                )}

                {endError && <div className="error-message">{endError}</div>}
                
                <button type="submit" className="btn-danger" disabled={endLoading}>
                  {endLoading ? "Ending..." : "End Ride"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Start Payment Modal */}
      {showStartPaymentModal && pendingStartBooking && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header"><h3><DollarSign size={18} /> Collect Payment</h3><button className="close-btn" onClick={() => setShowStartPaymentModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="payment-amount"><span>Pending Amount:</span><strong>{formatCurrency(startPaymentAmount)}</strong></div>
              <div className="payment-methods">
                <label className={`method ${startPaymentMethod === "cash" ? "selected" : ""}`}><input type="radio" value="cash" checked={startPaymentMethod === "cash"} onChange={(e) => setStartPaymentMethod(e.target.value)} /><Banknote size={20} /> Cash</label>
                <label className={`method ${startPaymentMethod === "upi" ? "selected" : ""}`}><input type="radio" value="upi" checked={startPaymentMethod === "upi"} onChange={(e) => setStartPaymentMethod(e.target.value)} /><Smartphone size={20} /> UPI</label>
              </div>
              <div className="modal-actions"><button className="btn-secondary" onClick={() => setShowStartPaymentModal(false)}>Cancel</button><button className="btn-primary" onClick={() => executeStartRide({ bookingToken: pendingStartBooking.bookingToken, odometer: pendingStartBooking.odometer, fuelLevel: pendingStartBooking.fuelLevel, fastagBalance: pendingStartBooking.fastagBalance, paymentMethod: startPaymentMethod, ride_start_amount: startPaymentAmount })} disabled={startLoading}>{startLoading ? "Processing..." : "Confirm & Start"}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && <DocumentViewer url={selectedDocument.url} title={selectedDocument.title} onClose={() => setSelectedDocument(null)} />}
    </div>
  );
}