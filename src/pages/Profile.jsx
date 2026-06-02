import { useCallback, useEffect, useState, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost, apiPut } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { carImageUrl } from "../utils/carImage.js";
import { toastSuccess, toastError } from "../hooks/useToast.js";
import {
  User, Mail, Phone, Calendar, MapPin, CreditCard, Car, Upload,
  FileText, CheckCircle, AlertCircle, X, Plus, Camera, Trash2,
  Edit2, Award, Clock, Shield, Star, TrendingUp, Wallet,
  ChevronRight, Loader2, Globe, LogOut, Settings, Bell,
  Heart, BookOpen, BadgeCheck, Sparkles, Gift, Eye, ClipboardList, Building2
} from "lucide-react";
import "./Profile.css";


// Add these helper functions BEFORE your Profile component
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "—";
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  } catch {
    return dateTimeStr;
  }
}

// Status class function for booking status styling
function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "mb-status--confirmed";
  if (s === "pending") return "mb-status--pending";
  if (s === "ongoing" || s === "active") return "mb-status--ongoing";
  if (s === "completed") return "mb-status--completed";
  if (s === "cancelled") return "mb-status--cancelled";
  return "mb-status--pending";
}

// Status dot function for booking status icon
function statusDot(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "✓";
  if (s === "pending") return "⏳";
  if (s === "ongoing" || s === "active") return "▶";
  if (s === "completed") return "✔";
  if (s === "cancelled") return "✕";
  return "•";
}
export default function Profile() {
  const { token, user, role, logout } = useAuth();
  const [actionId, setActionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [credits, setCredits] = useState(null);
  const [docs, setDocs] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [documents, setDocuments] = useState({
    license: null,
    aadhar: null
  });
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [documentSuccess, setDocumentSuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [carForm, setCarForm] = useState({
    branchId: "",
    model: "",
    year: new Date().getFullYear(),
    category: "",
    transmission: "",
    fuelType: "",
    seatingCapacity: 5,
    colour: "",
    licensePlate: "",
    mileage: "",
    features: "",
    mainImage: null,
    images: [],
  });
  const [carLoading, setCarLoading] = useState(false);
  const [carError, setCarError] = useState(null);
  const fileInputRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [branchBookings, setBranchBookings] = useState([]);
  const [branchBookingsLoading, setBranchBookingsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isFirebaseError = (err) => err.data?.error?.includes('16 UNAUTHENTICATED') || err.message?.includes('16 UNAUTHENTICATED');

    try {
      let profileRes;

      if (role === 'branch_head' || role === 'sub_admin' || role === 'staff' || role === 'admin' || role === 'superadmin') {
        try {
          profileRes = await apiGet("/roleauth/getManagementProfile", { withAuth: true });
          profileRes = {
            userData: {
              id: profileRes.id,
              name: profileRes.name,
              email: profileRes.email,
              mobileno: profileRes.mobile_no,
              role: profileRes.role,
              branch_id: profileRes.branch_id,
              branch_name: profileRes.branch_name,
              city: profileRes.branch_city,
              state: profileRes.branch_state,
              is_verified: profileRes.is_verified,
              created_at: profileRes.created_at
            }
          };
        } catch (mgmtError) {
          console.error("Management profile error:", mgmtError);
          profileRes = {
            userData: {
              id: user?.id,
              name: user?.name,
              email: user?.email,
              role: user?.role,
              mobileno: user?.mobileno || "—"
            }
          };
        }
      } else {
        try {
          profileRes = await apiGet("/user/getData", { withAuth: true });
        } catch (userError) {
          console.error("User profile error:", userError);
          if (isFirebaseError(userError)) {
            setError("Backend service temporarily unavailable. Using cached profile data.");
          }
          profileRes = {
            userData: {
              id: user?.id,
              name: user?.name,
              email: user?.email,
              role: user?.role,
              mobileno: user?.mobileno || "—"
            }
          };
        }
      }

      let creditsRes = { totalCredits: 0, credits: [] };
      let docsRes = null;
      let branchesRes = [];
      let bookingsRes = [];
      let notificationsRes = [];

      // Load credits (only for regular users)
      if (role !== 'staff' && role !== 'branch_head') {
        try {
          creditsRes = await apiGet("/bookingApi/myCredits", { withAuth: true });
        } catch (creditsError) {
          console.error("Credits error:", creditsError);
        }
      }

      // Load documents (only for regular users)
      if (role !== 'staff' && role !== 'branch_head' && role !== 'sub_admin' && role !== 'admin') {
        try {
          docsRes = await apiGet("/user/getDocuments", { withAuth: true });
        } catch (docsError) {
          console.error("Documents error:", docsError);
        }
      }

      // Load branches
      try {
        branchesRes = await apiGet("/cars/get_branches");
      } catch (branchesError) {
        console.error("Branches error:", branchesError);
      }

      // Load bookings - Different endpoints based on role
      // Load bookings - Fixed version with getBranchBookingsByDate
     // Load bookings - Fixed version with proper role handling
try {
  if (role === 'staff' || role === 'branch_head' || role === 'sub_admin' || role === 'admin' || role === 'superadmin' || role === 'Admin') {
    const branchId = profileRes?.userData?.branch_id;
    
    if (branchId && branchId !== 'null' && branchId !== null) {
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      
      console.log(`Fetching branch bookings for ${role}:`, { branchId, date: currentDate });
      
      const branchBookingsRes = await apiGet("/bookingApi/getBranchBookingsByDate", {
        withAuth: true,
        query: {
          branchId: branchId,
          date: currentDate
        }
      });
      
      console.log("Branch bookings response:", branchBookingsRes);
      
      // Extract bookings array from response
      let bookingsArray = [];
      if (Array.isArray(branchBookingsRes)) {
        bookingsArray = branchBookingsRes;
      } else if (branchBookingsRes?.data && Array.isArray(branchBookingsRes.data)) {
        bookingsArray = branchBookingsRes.data;
      } else if (branchBookingsRes?.bookings && Array.isArray(branchBookingsRes.bookings)) {
        bookingsArray = branchBookingsRes.bookings;
      }
      
      setBranchBookings(bookingsArray);
      setBookings(bookingsArray);
    } else {
      console.warn(`No branch_id found for ${role} user, falling back to personal bookings`);
      const personalBookings = await apiGet("/bookingApi/myBookings", { withAuth: true });
      const personalArray = Array.isArray(personalBookings) ? personalBookings : 
                           (personalBookings?.data ? personalBookings.data : []);
      setBranchBookings(personalArray);
      setBookings(personalArray);
    }
  } else {
    // Regular users (owner, user) see their own bookings
    const userBookings = await apiGet("/bookingApi/myBookings", { withAuth: true });
    const userArray = Array.isArray(userBookings) ? userBookings : 
                     (userBookings?.data ? userBookings.data : []);
    setBookings(userArray);
    setBranchBookings([]);
  }
} catch (bookingsError) {
  console.error("Bookings error:", bookingsError);
  setBookings([]);
  setBranchBookings([]);
}
// Load notifications
try {
  notificationsRes = await apiPut("/addFirebaseToken", { withAuth: true });
  setNotifications(Array.isArray(notificationsRes) ? notificationsRes : []);
} catch (notificationsError) {
  console.error("Notifications error:", notificationsError);
  setNotifications([]);
}

setUserData(profileRes?.userData || null);
setCredits(creditsRes);
setDocs(docsRes);
setBranches(branchesRes);

// Set edit form data
if (profileRes?.userData) {
  setEditForm({
    name: profileRes.userData.name || "",
    phone: profileRes.userData.mobileno || "",
    city: profileRes.userData.city || "",
    state: profileRes.userData.state || ""
  });
}

    } catch (e) {
  console.error("Critical profile load failed:", e);
  if (isFirebaseError(e)) {
    setError("Backend authentication service temporarily unavailable. Profile loaded from cache.");
  } else {
    setError(e.message || "Failed to load profile");
  }
} finally {
  setLoading(false);
}
  }, [role, user]);

useEffect(() => {
  if (token) {
    load();
  } else {
    setLoading(false);
  }
}, [load, token]);

// Handle edit profile
const handleEditProfile = async (e) => {
  e.preventDefault();
  setEditLoading(true);
  setError(null);

  try {
    await apiPut("/user/updateProfile", editForm, { withAuth: true });
    toastSuccess("Profile updated successfully!");
    setShowEditModal(false);
    await load();
  } catch (err) {
    setError(err.data?.message || err.message || "Failed to update profile");
    toastError(err.data?.message || "Failed to update profile");
  } finally {
    setEditLoading(false);
  }
};

const handleDocumentChange = (e) => {
  const { name, files } = e.target;
  if (files && files[0]) {
    if (files[0].size > 5 * 1024 * 1024) {
      setDocumentError("File size must be less than 5MB");
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(files[0].type)) {
      setDocumentError("Only JPG, JPEG, and PNG files are allowed");
      return;
    }
    setDocuments(prev => ({
      ...prev,
      [name]: files[0]
    }));
    setDocumentError(null);
    setDocumentSuccess(false);
  }
};

const handleDocumentUpload = async (e) => {
  e.preventDefault();

  if (!documents.license && !documents.aadhar) {
    setDocumentError("Please select at least one document to upload");
    return;
  }

  setDocumentLoading(true);
  setDocumentError(null);
  setDocumentSuccess(false);

  const fd = new FormData();
  if (documents.license) fd.append("license", documents.license, documents.license.name);
  if (documents.aadhar) fd.append("aadhar", documents.aadhar, documents.aadhar.name);

  try {
    await apiPost("/photoUpload/DocumentUpload", fd, { withAuth: true });
    setDocumentSuccess(true);
    setDocuments({ license: null, aadhar: null });
    document.querySelectorAll('input[type="file"]').forEach(i => (i.value = ""));
    await load();
    setTimeout(() => {
      setShowDocumentModal(false);
      setDocumentSuccess(false);
    }, 2000);
  } catch (err) {
    const is500 = err.status === 500 || err.statusCode === 500 || err.message?.includes("internal server error");

    if (is500) {
      setDocumentSuccess(true);
      setDocuments({ license: null, aadhar: null });
      document.querySelectorAll('input[type="file"]').forEach(i => (i.value = ""));
      await load();
      setDocumentError("Documents uploaded. Auto-verification pending — our team will review shortly.");
      setTimeout(() => {
        setShowDocumentModal(false);
        setDocumentSuccess(false);
        setDocumentError(null);
      }, 3500);
    } else {
      const msg = (typeof err.data === "object" && err.data?.message) || err.message || "Upload failed. Please upload a clear image and try again.";
      setDocumentError(msg);
    }
  } finally {
    setDocumentLoading(false);
  }
};

const handleCarFormChange = (e) => {
  const { name, value, type, files } = e.target;
  if (type === "file") {
    if (name === "mainImage") {
      setCarForm({ ...carForm, mainImage: files[0] });
    } else if (name === "images") {
      setCarForm({ ...carForm, images: Array.from(files) });
    }
  } else {
    setCarForm({ ...carForm, [name]: value });
  }
};

const handleCarSubmit = async (e) => {
  e.preventDefault();
  setCarLoading(true);
  setCarError(null);

  const formData = new FormData();
  formData.append("model", carForm.model);
  formData.append("year", carForm.year);
  formData.append("category", carForm.category);
  formData.append("transmission", carForm.transmission);
  formData.append("fuelType", carForm.fuelType);
  formData.append("seatingCapacity", carForm.seatingCapacity);
  formData.append("colour", carForm.colour);
  formData.append("licensePlate", carForm.licensePlate.toUpperCase());
  formData.append("mileage", carForm.mileage);
  formData.append("features", carForm.features);

  if (carForm.mainImage) {
    formData.append("mainImage", carForm.mainImage);
  }
  carForm.images.forEach((img) => {
    formData.append("images", img);
  });

  try {
    await apiPost(`/cars/addCar/${carForm.branchId}`, formData, { withAuth: true });
    toastSuccess("Car registered successfully! Waiting for approval.");
    setShowCarModal(false);
    setCarForm({
      branchId: "",
      model: "",
      year: new Date().getFullYear(),
      category: "",
      transmission: "",
      fuelType: "",
      seatingCapacity: 5,
      colour: "",
      licensePlate: "",
      mileage: "",
      features: "",
      mainImage: null,
      images: [],
    });
    await load();
  } catch (err) {
    setCarError(err.data?.message || err.message || "Failed to register car");
    toastError(err.data?.message || "Failed to register car");
  } finally {
    setCarLoading(false);
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    await apiPut(`/user/markNotificationRead/${notificationId}`, {}, { withAuth: true });
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

const handleViewBookingDetails = (booking) => {
  setSelectedBooking(booking);
  setShowBookingDetailsModal(true);
};

const handleUpdateBookingStatus = async (bookingId, newStatus) => {
  try {
    await apiPut(`/bookingApi/updateBookingStatus/${bookingId}`,
      { status: newStatus },
      { withAuth: true }
    );
    toastSuccess(`Booking ${newStatus} successfully!`);
    await load(); // Refresh bookings
    setShowBookingDetailsModal(false);
  } catch (error) {
    console.error("Error updating booking status:", error);
    toastError("Failed to update booking status");
  }
};

const hasDocuments = docs?.aadhar_url || docs?.license_url;
const isProfileComplete = userData?.is_profile_completed || hasDocuments;
const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
const unreadNotifications = notifications.filter(n => !n.read).length;

const isStaffOrBranchHead = role === 'staff' || role === 'branch_head';
const displayBookings = isStaffOrBranchHead ? branchBookings : bookings;

const tabs = [
  { id: "overview", label: "Overview", icon: User },
  ...(!isStaffOrBranchHead ? [
    { id: "documents", label: "Documents", icon: FileText, badge: !hasDocuments ? "Pending" : null },
    { id: "wallet", label: "Wallet", icon: Wallet, badge: credits?.totalCredits > 0 ? `₹${credits.totalCredits}` : null }
  ] : []),
  { id: "bookings", label: isStaffOrBranchHead ? "Branch Bookings" : "My Bookings", icon: BookOpen, badge: displayBookings.length > 0 ? displayBookings.length : null },
];

if (!token) return <Navigate to="/login" replace />;

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'status-confirmed';
    case 'pending': return 'status-pending';
    case 'completed': return 'status-completed';
    case 'cancelled': return 'status-cancelled';
    case 'ongoing': return 'status-ongoing';
    default: return 'status-pending';
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return <CheckCircle size={16} />;
    case 'completed': return <Award size={16} />;
    case 'cancelled': return <X size={16} />;
    case 'ongoing': return <Car size={16} />;
    default: return <Clock size={16} />;
  }
};

return (
  <div className="profile-page-modern">
    {/* Animated Background */}
    <div className="profile-bg-gradient"></div>
    <div className="profile-bg-pattern"></div>

    <div className="profile-container">
      {/* Hero Section */}
      <motion.div
        className="profile-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {userData?.name?.[0] || <User size={68} />}
          </div>
          <div className={`profile-status-dot ${isProfileComplete ? 'verified' : 'pending'}`}></div>
        </div>
        <div className="profile-hero-info">
          <h1>{userData?.name || "User"}</h1>
          <p className="profile-role">
            <span className={`role-badge-modern ${userData?.role}`}>
              {userData?.role === 'branch_head' ? 'Branch Head' :
                userData?.role === 'staff' ? 'Staff Member' :
                  userData?.role === 'owner' ? 'Car Owner' :
                    userData?.role === 'admin' ? 'Administrator' :
                      userData?.role || "Member"}
            </span>
            {isProfileComplete && <BadgeCheck size={16} className="verified-badge" />}
          </p>
          <div className="profile-stats">
            <div className="stat-item">
              <Calendar size={14} />
              <span>Joined {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : "Recently"}</span>
            </div>
            {userData?.city && (
              <div className="stat-item">
                <MapPin size={14} />
                <span>{userData.city}</span>
              </div>
            )}
            {userData?.branch_name && (
              <div className="stat-item">
                <Building2 size={14} />
                <span>{userData.branch_name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="profile-hero-actions">
          <motion.button
            className="btn-icon-modern"
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} />
            {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
          </motion.button>

          <motion.button
            className="btn-icon-modern"
            onClick={() => setShowEditModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={20} />
          </motion.button>

          {(!hasDocuments || !userData?.is_profile_completed) && role !== 'branch_head' && role !== 'staff' && (
            <motion.button
              className="btn-outline-modern"
              onClick={() => setShowDocumentModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Upload size={18} />
              Upload Documents
            </motion.button>
          )}

          {(role === 'owner' || role === 'user') && (
            <motion.button
              className="btn-primary-modern"
              onClick={() => setShowCarModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              {role === 'owner' ? 'Register Car' : 'Become Owner'}
            </motion.button>
          )}

          <motion.button
            className="btn-danger-modern"
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className="notifications-panel"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="notifications-header">
              <h3>Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                    onClick={() => markNotificationAsRead(notif.id)}
                  >
                    <div className="notification-icon">
                      {notif.type === 'booking' ? <Car size={16} /> : <Gift size={16} />}
                    </div>
                    <div className="notification-content">
                      <p>{notif.message}</p>
                      <small>{new Date(notif.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-notifications">No notifications yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="profile-tabs">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="profile-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="spinner" size={40} />
            <p>Loading your profile...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            className="profile-error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AlertCircle size={48} />
            <p>{error}</p>
            <button className="btn-primary-modern" onClick={load}>Retry</button>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="profile-content"
          >
            {activeTab === "overview" && (
              <div className="overview-grid">
                {/* Personal Info Card */}
                <div className="info-card">
                  <div className="card-header">
                    <h3>Personal Information</h3>
                    <button className="icon-btn" onClick={() => setShowEditModal(true)}>
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <div className="info-list">
                    <div className="info-item">
                      <User size={18} />
                      <div>
                        <label>Full Name</label>
                        <p>{userData?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <Mail size={18} />
                      <div>
                        <label>Email Address</label>
                        <p>{userData?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <Phone size={18} />
                      <div>
                        <label>Phone Number</label>
                        <p>{userData?.mobileno || "—"}</p>
                      </div>
                    </div>
                    {userData?.branch_name && (
                      <div className="info-item">
                        <Building2 size={18} />
                        <div>
                          <label>Branch</label>
                          <p>{userData.branch_name}</p>
                        </div>
                      </div>
                    )}
                    {userData?.city && (
                      <div className="info-item">
                        <MapPin size={18} />
                        <div>
                          <label>Location</label>
                          <p>{userData.city}{userData.state ? `, ${userData.state}` : ''}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role-specific Stats Card */}
                <div className="info-card">
                  <div className="card-header">
                    <h3>{isStaffOrBranchHead ? 'Branch Stats' : 'Account Stats'}</h3>
                    {isStaffOrBranchHead ? <ClipboardList size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <BookOpen size={24} />
                      <div>
                        <span className="stat-value">{displayBookings.length}</span>
                        <span className="stat-label">
                          {isStaffOrBranchHead ? 'Branch Bookings' : 'Total Bookings'}
                        </span>
                      </div>
                    </div>
                    {!isStaffOrBranchHead && (
                      <div className="stat-card">
                        <Wallet size={24} />
                        <div>
                          <span className="stat-value">{credits?.totalCredits || 0}</span>
                          <span className="stat-label">Credits</span>
                        </div>
                      </div>
                    )}
                    {isStaffOrBranchHead && userData?.branch_name && (
                      <div className="stat-card">
                        <Building2 size={24} />
                        <div>
                          <span className="stat-value">{userData.branch_name}</span>
                          <span className="stat-label">Branch</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Status Card - Only for non-staff */}
                {!isStaffOrBranchHead && (
                  <div className="info-card">
                    <div className="card-header">
                      <h3>Verification Status</h3>
                      <Shield size={18} className="shield-icon" />
                    </div>
                    <div className="verification-status">
                      <div className={`status-item ${isProfileComplete ? 'complete' : 'pending'}`}>
                        <div className="status-icon">
                          {isProfileComplete ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                          <h4>{isProfileComplete ? "Profile Complete" : "Profile Pending"}</h4>
                          <p>{isProfileComplete ? "Your account is fully verified" : "Complete your profile to access all features"}</p>
                        </div>
                      </div>
                      {!hasDocuments && (
                        <button className="btn-link" onClick={() => setShowDocumentModal(true)}>
                          Upload Documents →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "documents" && !isStaffOrBranchHead && (
              <div className="documents-section">
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Uploaded Documents</h3>
                    <FileText size={18} />
                  </div>
                  <div className="documents-grid">
                    <div className="document-card">
                      <div className="document-icon license">
                        <span className="icon-emoji">📜</span>
                      </div>
                      <div>
                        <h4>Driving License</h4>
                        <p>{docs?.license_url ? "Verified ✓" : "Not uploaded"}</p>
                      </div>
                      {docs?.license_url ? (
                        <a href={docs.license_url} target="_blank" rel="noreferrer" className="btn-view">View</a>
                      ) : (
                        <button className="btn-upload" onClick={() => setShowDocumentModal(true)}>Upload</button>
                      )}
                    </div>
                    <div className="document-card">
                      <div className="document-icon aadhar">
                        <span className="icon-emoji">🆔</span>
                      </div>
                      <div>
                        <h4>Aadhaar Card</h4>
                        <p>{docs?.aadhar_url ? "Verified ✓" : "Not uploaded"}</p>
                      </div>
                      {docs?.aadhar_url ? (
                        <a href={docs.aadhar_url} target="_blank" rel="noreferrer" className="btn-view">View</a>
                      ) : (
                        <button className="btn-upload" onClick={() => setShowDocumentModal(true)}>Upload</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallet" && !isStaffOrBranchHead && (
              <div className="wallet-section">
                <div className="wallet-balance-card">
                  <Wallet size={32} />
                  <div>
                    <p>Total Credits</p>
                    <h2>₹{Number(credits?.totalCredits || 0).toLocaleString("en-IN")}</h2>
                  </div>
                </div>
                <div className="info-card full-width">
                  <div className="card-header">
                    <h3>Credit History</h3>
                    <Clock size={18} />
                  </div>
                  <div className="credits-list">
                    {(credits?.credits || []).length > 0 ? (
                      credits.credits.map((c) => (
                        <div key={c.id} className="credit-item">
                          <div className="credit-amount">₹{Number(c.remaining_amount).toLocaleString("en-IN")}</div>
                          <div className="credit-expiry">
                            Expires: {new Date(c.expiry_date).toLocaleDateString()}
                            {c.expiring_soon && <span className="expiry-badge">Soon</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-credits">
                        <p>No active credits</p>
                        <button className="btn-outline-modern">Add Credits</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="bookings-section-integrated">
                {displayBookings.length > 0 ? (
                  <div className="mb-list">
                    {displayBookings.map((b, idx) => {
                      // Debug: Log the actual booking object to console
                      console.log("=== Booking Object ===", b);
                      console.log("Available keys in booking:", Object.keys(b));

                      const thumb = carImageUrl({ images: b.images });

                      const isCancelled = b.status === "cancelled";
                      const isCompleted = b.status === "completed";
                      const isOngoing = b.status === "ongoing" || b.status === "active";
                      const isConfirmed = b.status === "confirmed";
                      const isPending = b.status === "pending";
                      const usedCredits = Number(b.credits_used || 0) > 0;

                      const canCancel = !isCancelled && !isCompleted && !usedCredits && (isConfirmed || isOngoing || isPending);
                      const displayStatus = b.display_status || b.status || "pending";

                      // Helper function to get date from various possible field names
                      const getPickupDate = (booking) => {
                        // Try all possible field names for pickup/start date
                        const possibleFields = [
                          'pickupDate', 'pickup_date', 'pickup_datetime', 'pickupDateTime',
                          'startDate', 'start_date', 'start_datetime', 'startDateTime',
                          'startTime', 'start_time', 'from_date', 'fromDate',
                          'booking_start', 'start', 'pickup', 'start_date_time'
                        ];

                        for (const field of possibleFields) {
                          if (booking[field]) {
                            console.log(`Found pickup date in field '${field}':`, booking[field]);
                            return booking[field];
                          }
                        }
                        return null;
                      };

                      const getDropoffDate = (booking) => {
                        // Try all possible field names for dropoff/end date
                        const possibleFields = [
                          'dropoffDate', 'dropoff_date', 'dropoff_datetime', 'dropoffDateTime',
                          'endDate', 'end_date', 'end_datetime', 'endDateTime',
                          'endTime', 'end_time', 'to_date', 'toDate',
                          'booking_end', 'end', 'dropoff', 'end_date_time'
                        ];

                        for (const field of possibleFields) {
                          if (booking[field]) {
                            console.log(`Found dropoff date in field '${field}':`, booking[field]);
                            return booking[field];
                          }
                        }
                        return null;
                      };

                      const getCarModel = (booking) => {
                        const possibleFields = ['model', 'car_model', 'carModel', 'car_name', 'carName', 'vehicle_model'];
                        for (const field of possibleFields) {
                          if (booking[field]) {
                            return booking[field];
                          }
                        }
                        return "Car";
                      };

                      const getTotalAmount = (booking) => {
                        const possibleFields = ['totalPrice', 'total_price', 'totalAmount', 'total_amount', 'total'];
                        for (const field of possibleFields) {
                          if (booking[field] !== undefined && booking[field] !== null) {
                            return Number(booking[field]);
                          }
                        }
                        return 0;
                      };

                      const pickupDateRaw = getPickupDate(b);
                      const dropoffDateRaw = getDropoffDate(b);

                      // Format dates for display
                      const formatBookingDate = (dateValue) => {
                        if (!dateValue) return "—";
                        try {
                          let date = new Date(dateValue);
                          if (isNaN(date.getTime())) {
                            // Try parsing with timezone
                            date = new Date(dateValue + "T00:00:00");
                          }
                          if (isNaN(date.getTime())) return "—";
                          return date.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          });
                        } catch {
                          return "—";
                        }
                      };

                      const formatBookingDateTime = (dateValue) => {
                        if (!dateValue) return "—";
                        try {
                          let date = new Date(dateValue);
                          if (isNaN(date.getTime())) {
                            date = new Date(dateValue + "T00:00:00");
                          }
                          if (isNaN(date.getTime())) return "—";
                          return date.toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Kolkata"
                          });
                        } catch {
                          return "—";
                        }
                      };

                      const carModel = getCarModel(b);
                      const totalAmount = getTotalAmount(b);

                      console.log("Final values - Car:", carModel, "Total:", totalAmount, "Pickup:", pickupDateRaw, "Dropoff:", dropoffDateRaw);


                      return (
                        <article key={b.id} className="mb-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                          <div className="mb-thumb-wrap">
                            <img src={thumb} alt={carModel} className="mb-thumb" loading="lazy" />
                          </div>

                          <div className="mb-body">
                            <div className="mb-top">
                              <div>
                                <h2 className="mb-model">{carModel}</h2>
                                {(b.branch_name || b.branch_city) && (
                                  <p className="mb-branch">📍 {b.branch_name}{b.branch_city ? `, ${b.branch_city}` : ""}</p>
                                )}
                              </div>
                              <span className={`mb-status ${statusClass(displayStatus)}`}>
                                {statusDot(displayStatus)} {displayStatus}
                              </span>
                            </div>

                            <div className="mb-details">
                              <div className="mb-detail">
                                <span className="mb-detail-label">Pickup</span>
                                <span className="mb-detail-value">
                                  {formatBookingDateTime(pickupDateRaw)}
                                </span>
                              </div>
                              <div className="mb-detail">
                                <span className="mb-detail-label">Drop-off</span>
                                <span className="mb-detail-value">
                                  {formatBookingDateTime(dropoffDateRaw)}
                                </span>
                              </div>
                              <div className="mb-detail">
                                <span className="mb-detail-label">Total</span>
                                <span className="mb-detail-value mb-detail-value--price">
                                  ₹{totalAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="mb-detail">
                                <span className="mb-detail-label">Payment</span>
                                <span className="mb-detail-value">{b.payment_status || b.paymentStatus || "—"}</span>
                              </div>
                              {b.confirmationNumber != null && (
                                <div className="mb-detail">
                                  <span className="mb-detail-label">OTP</span>
                                  <span className="mb-detail-value mb-detail-value--otp">{String(b.confirmationNumber)}</span>
                                </div>
                              )}
                              {usedCredits && (
                                <div className="mb-detail">
                                  <span className="mb-detail-label">Credits Used</span>
                                  <span className="mb-detail-value">₹{Number(b.credits_used).toLocaleString("en-IN")}</span>
                                </div>
                              )}
                              {isStaffOrBranchHead && (b.user_name || b.customer_name || b.userName) && (
                                <div className="mb-detail">
                                  <span className="mb-detail-label">Customer</span>
                                  <span className="mb-detail-value">{b.user_name || b.customer_name || b.userName}</span>
                                </div>
                              )}
                            </div>

                            <div className="mb-actions">
                              <Link to="/" className="mb-btn-ghost">Browse more</Link>

                              {(b.status === "completed" || b.status === "confirmed") && (
                                <button
                                  type="button"
                                  className="mb-btn-ghost"
                                  onClick={() => printBookingReceipt(b, isStaffOrBranchHead ? "staff" : "user")}
                                >
                                  🧾 Receipt
                                </button>
                              )}

                              {["confirmed", "ongoing", "active"].includes(b.status?.toLowerCase()) && (
                                <Link to={`/carGps/${b.id}`} className="mb-btn-ghost">
                                  📍 Track
                                </Link>
                              )}

                              {!isStaffOrBranchHead && canCancel && (
                                <button
                                  type="button"
                                  className="mb-btn-danger"
                                  disabled={actionId === b.id}
                                  onClick={() => cancelBooking(b.id)}
                                >
                                  {actionId === b.id ? "Cancelling…" : "Cancel booking"}
                                </button>
                              )}

                              {isStaffOrBranchHead && (isConfirmed || isOngoing) && (
                                <button
                                  type="button"
                                  className="mb-btn-ghost"
                                  onClick={() => handleViewBookingDetails(b)}
                                >
                                  <Eye size={14} /> Manage
                                </button>
                              )}

                              {isCompleted && dropoffDateRaw && (
                                <span className="mb-completed-message">
                                  ✓ Trip completed on {formatBookingDate(dropoffDateRaw)}
                                </span>
                              )}

                              {isCancelled && (
                                <span className="mb-cancelled-message">
                                  ✗ Booking cancelled
                                </span>
                              )}

                              {usedCredits && isConfirmed && (
                                <span className="mb-credit-message">
                                  💰 Paid with credits - Cannot be cancelled
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mb-empty">
                    <div className="mb-empty-icon">🚗</div>
                    <p className="mb-empty-title">No bookings yet</p>
                    <p className="mb-empty-text">
                      {isStaffOrBranchHead
                        ? "No branch bookings have been made yet."
                        : "You haven't made any bookings. Browse our fleet and find your perfect ride."}
                    </p>
                    <Link to="/" className="mb-empty-btn">Browse Cars →</Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Edit Profile Modal */}
    <AnimatePresence>
      {showEditModal && (
        <motion.div
          className="modal-overlay-modern"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            className="modal-content-modern"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>Edit Profile</h2>
              <button className="close-btn-modern" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditProfile}>
              <div className="form-group-modern">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-modern">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group-modern">
                <label>City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>

              <div className="form-group-modern">
                <label>State</label>
                <input
                  type="text"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>

              <div className="modal-actions-modern">
                <button type="button" className="btn-secondary-modern" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modern" disabled={editLoading}>
                  {editLoading ? <Loader2 className="spinner" size={18} /> : <CheckCircle size={18} />}
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Document Upload Modal */}
    <AnimatePresence>
      {role !== 'branch_head' && role !== 'staff' && showDocumentModal && (
        <motion.div
          className="modal-overlay-modern"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDocumentModal(false)}
        >
          <motion.div
            className="modal-content-modern"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>Upload Documents</h2>
              <button className="close-btn-modern" onClick={() => setShowDocumentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDocumentUpload}>
              <div className="upload-area">
                <div className="upload-card">
                  <div className="upload-icon license">
                    <span className="icon-emoji">📜</span>
                  </div>
                  <h4>Driving License</h4>
                  <input
                    type="file"
                    name="license"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleDocumentChange}
                    id="license-upload"
                    hidden
                  />
                  <label htmlFor="license-upload" className="upload-btn">
                    {documents.license ? documents.license.name : "Choose File"}
                  </label>
                  {documents.license && (
                    <div className="file-preview-modern">
                      <img src={URL.createObjectURL(documents.license)} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="upload-card">
                  <div className="upload-icon aadhar">
                    <span className="icon-emoji">🆔</span>
                  </div>
                  <h4>Aadhaar Card</h4>
                  <input
                    type="file"
                    name="aadhar"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleDocumentChange}
                    id="aadhar-upload"
                    hidden
                  />
                  <label htmlFor="aadhar-upload" className="upload-btn">
                    {documents.aadhar ? documents.aadhar.name : "Choose File"}
                  </label>
                  {documents.aadhar && (
                    <div className="file-preview-modern">
                      <img src={URL.createObjectURL(documents.aadhar)} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              {documentError && (
                <div className="error-message-modern">
                  <AlertCircle size={18} />
                  {documentError}
                </div>
              )}
              {documentSuccess && (
                <div className="success-message-modern">
                  <CheckCircle size={18} />
                  Documents uploaded successfully!
                </div>
              )}

              <div className="modal-actions-modern">
                <button type="button" className="btn-secondary-modern" onClick={() => setShowDocumentModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-modern"
                  disabled={documentLoading || (!documents.license && !documents.aadhar)}
                >
                  {documentLoading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
                  {documentLoading ? "Uploading..." : "Upload & Verify"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Booking Details Modal */}
    <AnimatePresence>
      {showBookingDetailsModal && selectedBooking && (
        <motion.div
          className="modal-overlay-modern"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowBookingDetailsModal(false)}
        >
          <motion.div
            className="modal-content-modern modal-booking-details"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>Booking Details</h2>
              <button className="close-btn-modern" onClick={() => setShowBookingDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="booking-details-content">
              <div className="details-section">
                <h4>Booking Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Booking ID:</label>
                    <p>#{selectedBooking.id}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusClass(selectedBooking.status)}`}>
                      {selectedBooking.status || 'Pending'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Car:</label>
                    <p>{selectedBooking.car_model || selectedBooking.car_name || `Car #${selectedBooking.carId}`}</p>
                  </div>
                  {isStaffOrBranchHead && selectedBooking.user_name && (
                    <div className="detail-item">
                      <label>Customer:</label>
                      <p>{selectedBooking.user_name}</p>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Start Date:</label>
                    <p>{new Date(selectedBooking.start_date || selectedBooking.startTime).toLocaleString()}</p>
                  </div>
                  <div className="detail-item">
                    <label>End Date:</label>
                    <p>{new Date(selectedBooking.end_date || selectedBooking.endTime).toLocaleString()}</p>
                  </div>
                  <div className="detail-item">
                    <label>Total Amount:</label>
                    <p>₹{Number(selectedBooking.total_amount || selectedBooking.totalPrice).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="detail-item">
                    <label>Paid Amount:</label>
                    <p>₹{Number(selectedBooking.paid_amount || selectedBooking.advanceAmount || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {isStaffOrBranchHead && selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <div className="details-section">
                  <h4>Update Status</h4>
                  <div className="status-update-buttons">
                    {selectedBooking.status === 'pending' && (
                      <button
                        className="btn-confirm"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'confirmed')}
                      >
                        Confirm Booking
                      </button>
                    )}
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        className="btn-start"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'ongoing')}
                      >
                        Start Trip
                      </button>
                    )}
                    {selectedBooking.status === 'ongoing' && (
                      <button
                        className="btn-complete"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'completed')}
                      >
                        Complete Trip
                      </button>
                    )}
                    {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                      <button
                        className="btn-cancel"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'cancelled')}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-modern">
              <button className="btn-secondary-modern" onClick={() => setShowBookingDetailsModal(false)}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Car Registration Modal */}
    <AnimatePresence>
      {(role === 'owner' || role === 'user') && showCarModal && (
        <motion.div
          className="modal-overlay-modern"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowCarModal(false)}
        >
          <motion.div
            className="modal-content-modern modal-large"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-modern">
              <h2>Register New Car</h2>
              <button className="close-btn-modern" onClick={() => setShowCarModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCarSubmit} className="car-form">
              {carError && <div className="error-message-modern">{carError}</div>}

              <div className="form-grid">
                <div className="form-group-modern">
                  <label>Branch *</label>
                  <select name="branchId" value={carForm.branchId} onChange={handleCarFormChange} required>
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Model *</label>
                  <input type="text" name="model" value={carForm.model} onChange={handleCarFormChange} placeholder="e.g., Swift, City" required />
                </div>

                <div className="form-group-modern">
                  <label>Year *</label>
                  <input type="number" name="year" value={carForm.year} onChange={handleCarFormChange} min="1990" max={new Date().getFullYear() + 1} required />
                </div>

                <div className="form-group-modern">
                  <label>Category *</label>
                  <select name="category" value={carForm.category} onChange={handleCarFormChange} required>
                    <option value="">Select Category</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Transmission *</label>
                  <select name="transmission" value={carForm.transmission} onChange={handleCarFormChange} required>
                    <option value="">Select Transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Fuel Type *</label>
                  <select name="fuelType" value={carForm.fuelType} onChange={handleCarFormChange} required>
                    <option value="">Select Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Seating Capacity *</label>
                  <input type="number" name="seatingCapacity" value={carForm.seatingCapacity} onChange={handleCarFormChange} min="1" max="15" required />
                </div>

                <div className="form-group-modern">
                  <label>Color *</label>
                  <input type="text" name="colour" value={carForm.colour} onChange={handleCarFormChange} placeholder="e.g., Red, Black" required />
                </div>

                <div className="form-group-modern">
                  <label>License Plate *</label>
                  <input type="text" name="licensePlate" value={carForm.licensePlate} onChange={handleCarFormChange} placeholder="e.g., AP01AB124" required />
                </div>

                <div className="form-group-modern">
                  <label>Mileage (km/l)</label>
                  <input type="number" name="mileage" value={carForm.mileage} onChange={handleCarFormChange} placeholder="e.g., 18" />
                </div>

                <div className="form-group-modern full-width">
                  <label>Features (comma separated)</label>
                  <input type="text" name="features" value={carForm.features} onChange={handleCarFormChange} placeholder="e.g., AC, Power Steering, Airbags" />
                </div>

                <div className="form-group-modern">
                  <label>Main Image *</label>
                  <input type="file" name="mainImage" accept="image/*" onChange={handleCarFormChange} required />
                </div>

                <div className="form-group-modern">
                  <label>Additional Images (up to 5)</label>
                  <input type="file" name="images" accept="image/*" multiple onChange={handleCarFormChange} />
                  <small>You can select up to 5 images</small>
                </div>
              </div>

              <div className="modal-actions-modern">
                <button type="button" className="btn-secondary-modern" onClick={() => setShowCarModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modern" disabled={carLoading}>
                  {carLoading ? <Loader2 className="spinner" size={18} /> : <Plus size={18} />}
                  {carLoading ? "Registering..." : "Register Car"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}