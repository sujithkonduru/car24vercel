import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api, { decodeToken, getToken, API_BASE, apiPut } from "../api.js";

// ── Colour tokens ──────────────────────────────────────────
const C = {
  bg: "#0B0F1A",
  surface: "#111827",
  card: "#161D2E",
  border: "#1E2A3A",
  accent: "#3B82F6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  text: "#F1F5F9",
  muted: "#64748B",
  subtle: "#1E293B",
};

const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtNum = n => Number(n || 0).toLocaleString("en-IN");
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const s = {
  root: { fontFamily: "'DM Mono', 'Fira Code', monospace", background: C.bg, minHeight: "100vh", color: C.text, display: "flex" },
  sidebar: { width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0", gap: 4, flexShrink: 0 },
  logo: { padding: "0 20px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 },
  logoText: { fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginTop: 2 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", borderRadius: 0, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: active ? 700 : 400, color: active ? C.text : C.muted, background: active ? C.card : "transparent", borderLeft: `3px solid ${active ? C.accent : "transparent"}`, transition: "all .15s" }),
  main: { flex: 1, overflow: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" },
  grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16 }),
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 },
  cardLabel: { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  cardValue: (color) => ({ fontSize: 28, fontWeight: 700, color: color || C.text, letterSpacing: "-1px" }),
  cardSub: { fontSize: 11, color: C.muted, marginTop: 4 },
  badge: (color) => ({ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", background: color + "22", color }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { padding: "10px 12px", textAlign: "left", color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, fontWeight: 400 },
  td: { padding: "12px 12px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" },
  btn: (color = "#3B82F6", ghost = false) => ({ cursor: "pointer", border: ghost ? `1px solid ${color}` : "none", background: ghost ? "transparent" : color, color: ghost ? color : "#fff", padding: "7px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", transition: "opacity .15s" }),
  input: { background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontSize: 12, width: "100%", outline: "none", boxSizing: "border-box" },
  select: { background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontSize: 12, outline: "none", cursor: "pointer" },
  pill: { display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: C.subtle, borderRadius: 20, fontSize: 11, color: C.muted },
  tag: (c) => ({ background: c + "18", color: c, padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }),
  sectionTitle: { fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.border}` },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modalContent: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: "90%", maxWidth: 800, maxHeight: "85vh", overflow: "auto", padding: 24 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.border}` },
  modalTitle: { fontSize: 18, fontWeight: 700 },
  closeBtn: { cursor: "pointer", fontSize: 20, color: C.muted, background: "none", border: "none" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 },
  textarea: { background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontSize: 12, width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical" },
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.cardLabel}>{label}</div>
          <div style={s.cardValue(color)}>{value}</div>
          {sub && <div style={s.cardSub}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22, opacity: .6 }}>{icon}</div>
      </div>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? C.red : C.green;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: bg, color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 2000, letterSpacing: .5, maxWidth: 340 }}>
      {msg}
    </div>
  );
}

// Edit Car Modal Component
function EditCarModal({ car, onClose, onSave }) {
  const [formData, setFormData] = useState({
    model: "",
    year: new Date().getFullYear(),
    category: "",
    transmission: "",
    fuelType: "",
    seatingCapacity: 5,
    colour: "",
    licensePlate: "",
    mileage: "",
    six_hr_price: 0,
    twelve_hr_price: 0,
    twentyfour_hr_price: 0,
    isAvailable: true,
    status: "active",
    branchId: "",
    features: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model || "",
        year: car.year || new Date().getFullYear(),
        category: car.category || "",
        transmission: car.transmission || "",
        fuelType: car.fuelType || "",
        seatingCapacity: car.seatingCapacity || 5,
        colour: car.colour || "",
        licensePlate: car.licensePlate || car.license_plate || "",
        mileage: car.mileage || "",
        six_hr_price: car.six_hr_price || 0,
        twelve_hr_price: car.twelve_hr_price || 0,
        twentyfour_hr_price: car.twentyfour_hr_price || 0,
        isAvailable: car.isAvailable !== undefined ? car.isAvailable : (car.is_available !== undefined ? car.is_available : true),
        status: car.status || "active",
        branchId: car.branchId || car.branch_id || "",
        features: Array.isArray(car.features) ? car.features.join(", ") : (car.features || "")
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        model: formData.model,
        year: parseInt(formData.year),
        category: formData.category,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        seatingCapacity: parseInt(formData.seatingCapacity),
        colour: formData.colour,
        licensePlate: formData.licensePlate.toUpperCase(),
        mileage: formData.mileage,
        six_hr_price: parseFloat(formData.six_hr_price),
        twelve_hr_price: parseFloat(formData.twelve_hr_price),
        twentyfour_hr_price: parseFloat(formData.twentyfour_hr_price),
        isAvailable: formData.isAvailable,
        status: formData.status,
        branchId: parseInt(formData.branchId),
        features: formData.features.split(",").map(f => f.trim()).filter(f => f)
      };

      const response = await apiPut(`/roleauth/updateCar/${car.id}`, updateData, { withAuth: true });
      
      if (response) {
        onSave();
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to update car");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>✏️ Edit Car: {car?.model}</div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Model</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} style={s.input} required />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Year</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} style={s.input} required />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} style={s.select}>
                <option value="">Select Category</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Transmission</label>
              <select name="transmission" value={formData.transmission} onChange={handleChange} style={s.select}>
                <option value="">Select</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Fuel Type</label>
              <select name="fuelType" value={formData.fuelType} onChange={handleChange} style={s.select}>
                <option value="">Select</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Seating Capacity</label>
              <input type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Colour</label>
              <input type="text" name="colour" value={formData.colour} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>License Plate</label>
              <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} style={s.input} required />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Mileage (km/l)</label>
              <input type="text" name="mileage" value={formData.mileage} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Branch ID</label>
              <input type="number" name="branchId" value={formData.branchId} onChange={handleChange} style={s.input} required />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>6 Hour Price (₹)</label>
              <input type="number" name="six_hr_price" value={formData.six_hr_price} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>12 Hour Price (₹)</label>
              <input type="number" name="twelve_hr_price" value={formData.twelve_hr_price} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>24 Hour Price (₹)</label>
              <input type="number" name="twentyfour_hr_price" value={formData.twentyfour_hr_price} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} style={s.select}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>
                <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} style={{ marginRight: 8 }} />
                Available for Booking
              </label>
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Features (comma separated)</label>
            <textarea name="features" value={formData.features} onChange={handleChange} style={s.textarea} rows="3" />
          </div>

          {error && <div style={{ color: C.red, fontSize: 11, marginTop: 12 }}>{error}</div>}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" style={s.btn(C.muted, true)} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.btn(C.accent)} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [stats, setStats] = useState(null);
  const [finances, setFinances] = useState(null);
  const [branchWiseBookings, setBranchWiseBookings] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [selectedBranchForBookings, setSelectedBranchForBookings] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [staff, setStaff] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  
  // Edit car modal state
  const [editingCar, setEditingCar] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Image error state for cars table
  const [imageErrors, setImageErrors] = useState({});
  const [hoveredCar, setHoveredCar] = useState(null);

  const [bookingFilter, setBookingFilter] = useState({ 
    branchId: "", 
    date: new Date().toISOString().slice(0, 10)
  });
  const [carFilter, setCarFilter] = useState({ status: "" });

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Fetch branch-wise bookings for overview
  const fetchBranchWiseBookings = useCallback(async () => {
    try {
      const branches = await api.getBranches();
      const branchesArray = branches?.data || branches || [];
      setBranchesList(branchesArray);
      
      const currentDate = new Date().toISOString().slice(0, 10);
      
      const branchPromises = branchesArray.map(async (branch) => {
        try {
          const bookingsData = await api.getBranchBookingsByDate(branch.id, currentDate);
          return {
            id: branch.id,
            name: branch.name || `Branch ${branch.id}`,
            city: branch.city || "N/A",
            bookingCount: Array.isArray(bookingsData) ? bookingsData.length : 0,
            totalRevenue: Array.isArray(bookingsData) 
              ? bookingsData.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)
              : 0
          };
        } catch (err) {
          console.error(`Failed to fetch bookings for branch ${branch.id}:`, err);
          return {
            id: branch.id,
            name: branch.name || `Branch ${branch.id}`,
            city: branch.city || "N/A",
            bookingCount: 0,
            totalRevenue: 0
          };
        }
      });
      
      const results = await Promise.all(branchPromises);
      setBranchWiseBookings(results.sort((a, b) => b.bookingCount - a.bookingCount));
    } catch (error) {
      console.error("Failed to fetch branch-wise bookings:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const decoded = decodeToken(token);
        const extractedBranchId = decoded?.branch_id || decoded?.branchId || decoded?.branch;
        if (extractedBranchId) {
          setBranchId(extractedBranchId);
          setBookingFilter(prev => ({ ...prev, branchId: extractedBranchId }));
        } else {
          setBranchId(null);
        }
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const [statsRes, financesRes] = await Promise.all([
          api.getAdminDashboardStats(),
          api.getSuperAdminFinances()
        ]);
        setStats(statsRes);
        setFinances(financesRes?.data);
        const staffRes = await api.getManagementUsers("null", "null", "staff", 10, 0);
        setStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);
        await fetchBranchWiseBookings();
      }
      
      if (activeTab === "bookings") {
        try {
          // Use selected branch for bookings, or fall back to user's branch
          const targetBranchId = selectedBranchForBookings || branchId;
          
          if (!targetBranchId) {
            console.warn("No branch selected - showing branch selector");
            setBookings([]);
            setLoading(false);
            return;
          }
          
          let dateToSend = bookingFilter.date;
          if (dateToSend.length === 7) {
            dateToSend = `${dateToSend}-01`;
          }
          
          console.log("Fetching bookings for branch:", targetBranchId, "date:", dateToSend);
          
          const bookingsData = await api.getBranchBookingsByDate(targetBranchId, dateToSend);
          
          console.log(`Loaded ${bookingsData.length} bookings`);
          setBookings(bookingsData);
          
        } catch (error) {
          console.error("Error loading bookings:", error);
          showToast(`Failed to load bookings: ${error.message}`, "error");
          setBookings([]);
        }
      }
      
      if (activeTab === "cars") {
        let carsData = [];
        
        if (!branchId) {
          // Super Admin: Get ALL cars from ALL branches
          console.log("Super Admin: Fetching all cars from all branches");
          
          try {
            // First, get all branches
            const branchesRes = await api.getBranches();
            const branches = branchesRes?.data || branchesRes || [];
            console.log(`Found ${branches.length} branches`);
            
            // Fetch cars for each branch in parallel
            const branchCarPromises = branches.map(async (branch) => {
              try {
                const branchCarsRes = await api.getBranchCars(branch.id);
                const branchCars = Array.isArray(branchCarsRes?.data) ? branchCarsRes.data : [];
                
                // Add branch info to each car for display
                return branchCars.map(car => ({
                  ...car,
                  branchName: branch.name || `Branch ${branch.id}`,
                  branchCity: branch.city || "N/A"
                }));
              } catch (err) {
                console.error(`Failed to fetch cars for branch ${branch.id}:`, err);
                return [];
              }
            });
            
            const allBranchCars = await Promise.all(branchCarPromises);
            carsData = allBranchCars.flat();
            
            console.log(`Total cars from all branches: ${carsData.length}`);
            
          } catch (error) {
            console.error("Failed to fetch branches:", error);
            carsData = [];
          }
          
        } else {
          // Branch Admin: Get cars only for their branch
          console.log(`Branch Admin: Fetching cars for branch ${branchId}`);
          const carsRes = await api.getBranchCars(branchId);
          carsData = Array.isArray(carsRes?.data) ? carsRes.data : [];
        }
        
        // Apply status filter
        if (carFilter.status && carFilter.status !== "all") {
          carsData = carsData.filter(car => {
            if (carFilter.status === "available") {
              return car.isAvailable === true || car.is_available === true;
            }
            return car.isAvailable === false || car.is_available === false;
          });
        }
        
        console.log(`Loaded ${carsData.length} cars total`);
        setCars(carsData);
      }
      
      if (activeTab === "staff") {
        let staffData = [];
        if (!branchId) {
          const staffRes = await api.getManagementUsers("null", "null", "staff", 1000, 0);
          staffData = staffRes?.data || [];
        } else {
          const staffRes = await api.getManagementUsers("null", branchId, "staff", 1000, 0);
          staffData = staffRes?.data || [];
        }
        setStaff(Array.isArray(staffData) ? staffData : []);
      }
      
      if (activeTab === "payments") {
        const financialRes = await api.getFinancialData({ pending_only: true });
        setPendingPayments(Array.isArray(financialRes?.data) ? financialRes.data : []);
      }
    } catch (err) {
      console.error("Load data error:", err);
      showToast(err.message || "Failed to load data", "error");
    }
    setLoading(false);
  }, [activeTab, branchId, bookingFilter, carFilter.status, selectedBranchForBookings, fetchBranchWiseBookings]);

  useEffect(() => {
    console.log("Tab changed to:", activeTab);
    loadData();
  }, [activeTab, loadData]);

  const handleEditCar = (car) => {
    setEditingCar(car);
    setShowEditModal(true);
  };

  const handleCarUpdated = () => {
    showToast("Car updated successfully!");
    loadData();
  };

  const getBookingCounts = () => {
    const bookingsArray = Array.isArray(bookings) ? bookings : [];
    return {
      pending: bookingsArray.filter(b => b?.system_status?.toLowerCase() === "pending" || b?.status?.toLowerCase() === "pending").length,
      confirmed: bookingsArray.filter(b => b?.system_status?.toLowerCase() === "confirmed" || b?.status?.toLowerCase() === "confirmed").length,
      ongoing: bookingsArray.filter(b => b?.live_status === "ongoing" || b?.system_status?.toLowerCase() === "ongoing" || b?.live_status === "Ride Started").length,
      completed: bookingsArray.filter(b => b?.live_status === "completed" || b?.system_status?.toLowerCase() === "completed" || b?.live_status === "Ride Ended").length,
      cancelled: bookingsArray.filter(b => b?.system_status?.toLowerCase() === "cancelled").length,
      total: bookingsArray.length,
    };
  };

  const getCarCounts = () => {
    const carsArray = Array.isArray(cars) ? cars : [];
    return {
      available: carsArray.filter(c => c.isAvailable === true || c.is_available === true).length,
      unavailable: carsArray.filter(c => c.isAvailable === false || c.is_available === false).length,
      total: carsArray.length,
    };
  };

  const getStaffCounts = () => {
    const staffArray = Array.isArray(staff) ? staff : [];
    return {
      total: staffArray.length,
      verified: staffArray.filter(s => s?.is_verified).length,
      pending: staffArray.filter(s => !s?.is_verified).length,
    };
  };

  // Function to get car image URL
  const getCarImageUrl = (car) => {
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      return car.images[0];
    }
    if (car.image && typeof car.image === 'string') {
      return car.image;
    }
    if (car.images && typeof car.images === 'string') {
      try {
        const parsed = JSON.parse(car.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {
        return car.images;
      }
    }
    return null;
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "bookings", label: "Bookings", icon: "◉" },
    { id: "cars", label: "Cars", icon: "◗" },
    { id: "staff", label: "Staff", icon: "◍" },
    { id: "payments", label: "Payments", icon: "◆" },
  ];

  const CarsTab = () => {
    const carsArray = Array.isArray(cars) ? cars : [];
    const carCounts = getCarCounts();
    
    // Define table headers based on admin type
    const tableHeaders = !branchId 
      ? ["Image", "ID", "Model", "License Plate", "Branch", "Status", "Pricing", "Actions"]
      : ["Image", "ID", "Model", "License Plate", "Status", "Pricing", "Actions"];
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
          <span style={s.pill}><span style={{ color: C.green }}>●</span> Available: {carCounts.available}</span>
          <span style={s.pill}><span style={{ color: C.red }}>●</span> Unavailable: {carCounts.unavailable}</span>
          <select value={carFilter.status} onChange={(e) => { setCarFilter({ status: e.target.value }); setTimeout(() => loadData(), 100); }} style={{ ...s.select, width: "auto", padding: "4px 8px", fontSize: 11 }}>
            <option value="">All Cars</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
        </div>

        <div style={s.card}>
          {loading ? (
            <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading cars...</div>
          ) : carsArray.length === 0 ? (
            <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>No cars found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {tableHeaders.map(h => <th key={h} style={s.th}>{h}</th>)}
                </tr>
                </thead>
                <tbody>
                  {carsArray.map((car) => {
                    const imageUrl = getCarImageUrl(car);
                    const hasError = imageErrors[car.id];
                    
                    return (
                      <tr key={car.id}>
                        {/* Image Column */}
                        <td style={s.td}>
                          {imageUrl && !hasError ? (
                            <img 
                              src={imageUrl} 
                              alt={car.model}
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                border: `1px solid ${C.border}`,
                                cursor: "pointer"
                              }}
                              onError={() => {
                                setImageErrors(prev => ({ ...prev, [car.id]: true }));
                              }}
                              onClick={() => {
                                window.open(imageUrl, "_blank");
                              }}
                            />
                          ) : (
                            <div style={{
                              width: "50px",
                              height: "50px",
                              background: C.subtle,
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              border: `1px solid ${C.border}`
                            }}>
                              🚗
                            </div>
                          )}
                        </td>
                        
                        {/* ID */}
                        <td style={s.td}>#{car.id}</td>
                        
                        {/* Model */}
                        <td style={{ ...s.td, fontWeight: 600 }}>{car.model}</td>
                        
                        {/* License Plate */}
                        <td style={s.td}>{car.licensePlate || car.license_plate}</td>
                        
                        {/* Branch (only for Super Admin) */}
                        {!branchId && (
                          <td style={s.td}>
                            <span style={s.badge(C.accent)}>
                              {car.branchName || car.branch || `Branch ${car.branchId}`}
                            </span>
                          </td>
                        )}
                        
                        {/* Status */}
                        <td style={s.td}>
                          <span style={s.tag(car.isAvailable || car.is_available ? C.green : C.red)}>
                            {car.isAvailable || car.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        
                        {/* Pricing */}
                        <td style={s.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, color: C.muted }}>6h: {fmt(car.six_hr_price)}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>12h: {fmt(car.twelve_hr_price)}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>24h: {fmt(car.twentyfour_hr_price)}</span>
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td style={s.td}>
                          <button style={s.btn(C.accent, true)} onClick={() => handleEditCar(car)}>
                            ✏️ Edit
                          </button>
                        </td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OverviewTab = () => {
    const carCounts = getCarCounts();
    const staffCounts = getStaffCounts();
    
    // Calculate total bookings across all branches
    const totalBookingsToday = branchWiseBookings.reduce((sum, b) => sum + b.bookingCount, 0);
    const totalRevenueToday = branchWiseBookings.reduce((sum, b) => sum + b.totalRevenue, 0);
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={s.grid(4)}>
          <StatCard label="Total Gross Revenue" value={fmt(finances?.total_gross_revenue || 0)} sub="all time" color={C.green} icon="💰" />
          <StatCard label="Net Profit" value={fmt(finances?.total_profit || 0)} sub="admin + branch" color={C.cyan} icon="📈" />
          <StatCard label="Today's Bookings" value={fmtNum(totalBookingsToday)} sub="across all branches" color={C.accent} icon="📅" />
          <StatCard label="Today's Revenue" value={fmt(totalRevenueToday)} sub="from today's bookings" color={C.purple} icon="💵" />
        </div>
        <div style={s.grid(3)}>
          <StatCard label="Total Cars" value={fmtNum(stats?.totalCars || carCounts.total)} sub={`${stats?.pendingCars || 0} pending approval`} color={C.purple} icon="🚗" />
          <StatCard label="Total Branches" value={fmtNum(stats?.totalBranches || branchWiseBookings.length)} color={C.accent} icon="🏢" />
          <StatCard label="Cars On Road Today" value={fmtNum(stats?.carsUsedToday || 0)} color={C.green} icon="🛣️" />
        </div>
        
        {/* Branch-wise Bookings Table */}
        <div style={s.card}>
          <div style={s.sectionTitle}>📊 Branch-wise Bookings (Today)</div>
          {branchWiseBookings.length === 0 ? (
            <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>No branch data available</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Branch Name</th>
                    <th style={s.th}>City</th>
                    <th style={s.th}>Today's Bookings</th>
                    <th style={s.th}>Today's Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {branchWiseBookings.map((branch, idx) => (
                    <tr 
                      key={branch.id} 
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        // Set selected branch and switch to bookings tab
                        setSelectedBranchForBookings(branch.id);
                        setActiveTab("bookings");
                        // Small delay to ensure state updates
                        setTimeout(() => loadData(), 100);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.subtle}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={s.td}>{idx + 1}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{branch.name}</td>
                      <td style={s.td}>{branch.city}</td>
                      <td style={s.td}>
                        <span style={s.badge(branch.bookingCount > 0 ? C.green : C.muted)}>
                          {branch.bookingCount}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: C.green, fontWeight: 600 }}>{fmt(branch.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${C.border}` }}>
                    <td style={s.td} colSpan="3"><strong>Total</strong></td>
                    <td style={s.td}><strong>{totalBookingsToday}</strong></td>
                    <td style={s.td}><strong>{fmt(totalRevenueToday)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        
        <div style={s.grid(2)}>
          <StatCard label="Verified Users" value={fmtNum(stats?.verifiedUsers || 0)} color={C.text} icon="✅" />
          <StatCard label="Total Owners" value={fmtNum(stats?.totalOwners || 0)} color={C.text} icon="👤" />
        </div>
        
        {staff.length > 0 && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Recent Staff Members</div>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead><tr>{["Name", "Email", "Role", "Status", "Joined"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {staff.slice(0, 5).map((member) => (
                    <tr key={member.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{member.name}</td>
                      <td style={s.td}>{member.email}</td>
                      <td style={s.td}>{member.role || "Staff"}</td>
                      <td style={s.td}><span style={s.badge(member.is_verified ? C.green : C.amber)}>{member.is_verified ? "Verified" : "Pending"}</span></td>
                      <td style={{ ...s.td, color: C.muted }}>{fmtDate(member.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const BookingsTab = () => {
    const bookingsArray = Array.isArray(bookings) ? bookings : [];
    const bookingCounts = getBookingCounts();
    
    // Get current branch name for display
    const currentBranch = branchesList.find(b => b.id === (selectedBranchForBookings || branchId));
    const branchName = currentBranch?.name || (selectedBranchForBookings ? `Branch ${selectedBranchForBookings}` : "All Branches");
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Branch Selector & Filters */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Branch Selector - Only show for Super Admin */}
          {!branchId && (
            <div style={s.pill}>
              <span>🏢 </span>
              <select 
                value={selectedBranchForBookings || ""} 
                onChange={(e) => {
                  const newBranchId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedBranchForBookings(newBranchId);
                  // Auto-refresh bookings when branch changes
                  setTimeout(() => loadData(), 100);
                }}
                style={{ background: "transparent", border: "none", color: C.text, outline: "none", cursor: "pointer" }}
              >
                <option value="">Select a Branch</option>
                {branchesList.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.city})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Date Picker */}
          <div style={s.pill}>
            <span>📅 </span>
            <input 
              type="date" 
              value={bookingFilter.date} 
              onChange={(e) => setBookingFilter(prev => ({ ...prev, date: e.target.value }))} 
              style={{ background: "transparent", border: "none", color: C.text, outline: "none" }} 
            />
          </div>
          
          <button style={s.btn(C.accent)} onClick={loadData}>Apply Filter</button>
          
          {/* Booking Stats */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={s.pill}>📋 Pending: {bookingCounts.pending}</span>
            <span style={s.pill}>✅ Confirmed: {bookingCounts.confirmed}</span>
            <span style={s.pill}>🔄 Ongoing: {bookingCounts.ongoing}</span>
            <span style={s.pill}>✔️ Completed: {bookingCounts.completed}</span>
          </div>
        </div>
        
        {/* Current Branch Display */}
        {(selectedBranchForBookings || branchId) && (
          <div style={{ ...s.pill, alignSelf: "flex-start" }}>
            📍 Showing bookings for: <strong>{branchName}</strong>
          </div>
        )}
        
        {/* Bookings Table */}
        <div style={s.card}>
          {loading ? (
            <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading bookings...</div>
          ) : bookingsArray.length === 0 ? (
            <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>
              📭 No bookings found for {bookingFilter.date}
              <div style={{ fontSize: 10, marginTop: 8, color: C.muted }}>
                {(selectedBranchForBookings || branchId) ? "Try selecting a different date" : "Please select a branch to view bookings"}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["ID", "Customer", "Car", "Number Plate", "Pickup Date", "Dropoff Date", "Amount", "Status", "Live Status"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookingsArray.map((b, idx) => (
                    <tr key={b.booking_id || idx}>
                      <td style={s.td}>#{b.booking_id || b.id || idx}</td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                        <small style={{ color: C.muted }}>{b.customer_phone}</small>
                      </td>
                      <td style={s.td}>{b.car_model}</td>
                      <td style={s.td}>{b.number_plate}</td>
                      <td style={{ ...s.td, color: C.muted }}>{fmtDate(b.pickupDate)}</td>
                      <td style={{ ...s.td, color: C.muted }}>{fmtDate(b.dropoffDate)}</td>
                      <td style={{ ...s.td, color: C.green, fontWeight: 600 }}>{fmt(b.totalPrice)}</td>
                      <td style={s.td}>
                        <span style={s.badge(
                          b.system_status === "confirmed" ? C.green : 
                          b.system_status === "pending" ? C.amber : C.red
                        )}>
                          {b.system_status || "pending"}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.tag(
                          b.live_status === "ongoing" ? C.purple : 
                          b.live_status === "Ride Started" ? C.purple :
                          b.live_status === "Ride Ended" ? C.green : 
                          b.live_status === "Upcoming" ? C.accent : C.muted
                        )}>
                          {b.live_status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StaffTab = () => {
    const staffArray = Array.isArray(staff) ? staff : [];
    const staffCounts = getStaffCounts();
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
          <span style={s.pill}>Total: {staffCounts.total}</span>
          <span style={s.pill}>Verified: {staffCounts.verified}</span>
          <span style={s.pill}>Pending: {staffCounts.pending}</span>
        </div>
        <div style={s.card}>
          {loading ? <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading staff...</div>
          : staffArray.length === 0 ? <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>No staff members found</div>
          : <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead><tr>{["Name", "Email", "Mobile", "Role", "Branch", "Status", "Joined"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {staffArray.map((member) => (
                    <tr key={member.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{member.name}</td>
                      <td style={s.td}>{member.email}</td>
                      <td style={s.td}>{member.mobileNo || member.mobile_no}</td>
                      <td style={s.td}>{member.role || "Staff"}</td>
                      <td style={s.td}>{member.branch || "—"}</td>
                      <td style={s.td}><span style={s.badge(member.is_verified ? C.green : C.amber)}>{member.is_verified ? "Verified" : "Pending"}</span></td>
                      <td style={{ ...s.td, color: C.muted }}>{fmtDate(member.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    );
  };

  const PaymentsTab = () => {
    const paymentsArray = Array.isArray(pendingPayments) ? pendingPayments : [];
    
    return (
      <div style={s.card}>
        <div style={s.sectionTitle}>Pending Owner Payments</div>
        {loading ? <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading payments...</div>
        : paymentsArray.length === 0 ? <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>No pending payments</div>
        : <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead><tr>{["Owner Name", "Phone", "Total Bookings", "Total Payable", "Total Trips", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {paymentsArray.map((payment, idx) => (
                  <tr key={payment.ownerid || idx}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{payment.owner_name}</td>
                    <td style={s.td}>{payment.owner_phone}</td>
                    <td style={s.td}>{payment.total_bookings || 0}</td>
                    <td style={{ ...s.td, color: C.amber, fontWeight: 600 }}>{fmt(payment.total_payable)}</td>
                    <td style={s.td}>{payment.total_trips || 0}</td>
                    <td style={s.td}><span style={s.badge(C.amber)}>Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    );
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0B0F1A; }
        ::-webkit-scrollbar-thumb { background: #1E2A3A; border-radius: 3px; }
        button:hover { opacity: .85; }
        input:focus, select:focus { border-color: #3B82F6 !important; }
      `}</style>

      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoText}>CAR24</div>
          <div style={s.logoSub}>{branchId ? "Branch Admin" : "Super Admin"}</div>
        </div>
        <div style={{ padding: "0 20px 16px" }}><div style={s.pill}><span style={{ fontSize: 11 }}>👤 {user?.name || "Admin"}</span></div></div>
        {navItems.map((item) => (
          <div key={item.id} style={s.navItem(activeTab === item.id)} onClick={() => setActiveTab(item.id)}>
            <span style={{ fontSize: 14, opacity: .7 }}>{item.icon}</span>{item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Session</div>
          <button style={{ ...s.btn(C.red, true), width: "100%" }} onClick={() => { logout(); navigate("/staff/login"); }}>🚪 Logout</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>{navItems.find(n => n.id === activeTab)?.label}</div>
            <div style={s.headerSub}>Welcome back, {user?.name || "Admin"} · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
          <button style={s.btn(C.accent)} onClick={loadData}>🔄 Refresh</button>
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "bookings" && <BookingsTab />}
        {activeTab === "cars" && <CarsTab />}
        {activeTab === "staff" && <StaffTab />}
        {activeTab === "payments" && <PaymentsTab />}
      </main>

      {showEditModal && editingCar && (
        <EditCarModal car={editingCar} onClose={() => { setShowEditModal(false); setEditingCar(null); }} onSave={handleCarUpdated} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}