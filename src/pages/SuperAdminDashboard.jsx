import { useState, useEffect, useCallback } from "react";
import {
  apiGet,
  apiPut,
  apiPost,
  getManagementUsers
} from "../api.js";

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  bg:      "#0B0F1A",
  surface: "#111827",
  card:    "#161D2E",
  border:  "#1E2A3A",
  accent:  "#3B82F6",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  purple:  "#8B5CF6",
  cyan:    "#06B6D4",
  text:    "#F1F5F9",
  muted:   "#64748B",
  subtle:  "#1E293B",
};

// ── Tiny helpers ───────────────────────────────────────────────────────────
const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtNum = n => Number(n || 0).toLocaleString("en-IN");

const fmtDate = d => {
  if (!d) return "—";
  if (typeof d === 'string' && d.includes('-')) {
    const parts = d.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return d;
};

const formatTo12Hour = (hours, minutes) => {
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const minuteStr = String(minutes).padStart(2, '0');
  return `${hour12}:${minuteStr} ${ampm}`;
};

const fmtDateTime = d => {
  if (!d) return "—";
  
  let dateStr = d;
  if (typeof d === 'object') {
    dateStr = d.toISOString();
  }
  
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart) return fmtDate(dateStr);
  
  const [year, month, day] = datePart.split('-');
  let hours = "00", minutes = "00";
  
  if (timePart) {
    [hours, minutes] = timePart.split(':');
  }
  
  const time12hr = formatTo12Hour(hours, minutes);
  return `${day}/${month}/${year} ${time12hr}`;
};

const getCarImageUrl = (item) => {
  if (!item) return null;
  
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }
  if (item.images && typeof item.images === 'string') {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {
      return item.images;
    }
  }
  if (item.car_details && item.car_details.images) {
    if (Array.isArray(item.car_details.images) && item.car_details.images.length > 0) {
      return item.car_details.images[0];
    }
  }
  return null;
};

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily:"'DM Mono', 'Fira Code', monospace", background:C.bg, minHeight:"100vh", color:C.text, display:"flex" },
  sidebar: { width:220, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"24px 0", gap:4, flexShrink:0, height:"100vh", overflowY:"auto" },
  logo: { padding:"0 20px 24px", borderBottom:`1px solid ${C.border}`, marginBottom:8 },
  logoText: { fontSize:20, fontWeight:700, color:C.text, letterSpacing:"-0.5px" },
  logoSub: { fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginTop:2 },
  navItem: (active) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", cursor:"pointer", borderRadius:0, fontSize:12, letterSpacing:1, textTransform:"uppercase", fontWeight:active?700:400, color:active?C.text:C.muted, background:active?C.card:"transparent", borderLeft:`3px solid ${active?C.accent:"transparent"}`, transition:"all .15s" }),
  main: { flex:1, overflow:"auto", padding:28, display:"flex", flexDirection:"column", gap:24 },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  headerTitle: { fontSize:22, fontWeight:700, letterSpacing:"-0.5px" },
  headerSub: { fontSize:11, color:C.muted, marginTop:2, letterSpacing:1, textTransform:"uppercase" },
  grid: (cols) => ({ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:16 }),
  carGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:20 },
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:20 },
  carCard: { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", transition:"transform 0.2s, box-shadow 0.2s", cursor:"pointer" },
  cardLabel: { fontSize:10, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:8 },
  cardValue: (color) => ({ fontSize:28, fontWeight:700, color:color||C.text, letterSpacing:"-1px" }),
  cardSub: { fontSize:11, color:C.muted, marginTop:4 },
  badge: (color) => ({ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:600, letterSpacing:1, textTransform:"uppercase", background:color+"22", color }),
  table: { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th: { padding:"10px 12px", textAlign:"left", color:C.muted, fontSize:10, letterSpacing:2, textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, fontWeight:400 },
  td: { padding:"12px 12px", borderBottom:`1px solid ${C.border}`, verticalAlign:"middle" },
  btn: (color="#3B82F6", ghost=false) => ({ cursor:"pointer", border: ghost ? `1px solid ${color}` : "none", background: ghost ? "transparent" : color, color: ghost ? color : "#fff", padding:"7px 14px", borderRadius:6, fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", transition:"opacity .15s" }),
  input: { background:C.subtle, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 12px", color:C.text, fontSize:12, width:"100%", outline:"none", boxSizing:"border-box" },
  select: { background:C.subtle, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 12px", color:C.text, fontSize:12, outline:"none", cursor:"pointer" },
  pill: { display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:C.subtle, borderRadius:20, fontSize:11, color:C.muted },
  tag: (c) => ({ background:c+"18", color:c, padding:"2px 8px", borderRadius:3, fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }),
  modal: { position:"fixed", inset:0, background:"#000a", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modalBox: { background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:28, width:700, maxWidth:"95vw", maxHeight:"85vh", overflowY:"auto" },
  sectionTitle: { fontSize:13, fontWeight:600, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${C.border}` },
  clickableRow: { cursor:"pointer", transition:"background 0.15s" },
  imageContainer: { height:200, background:C.subtle, position:"relative", overflow:"hidden" },
  carImage: { width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.3s" },
  specGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"12px 0", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` },
  priceBar: { display:"flex", justifyContent:"space-between", padding:10, background:C.subtle, borderRadius:6, marginBottom:16 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.border}` },
  modalTitle: { fontSize: 18, fontWeight: 700 },
  closeBtn: { cursor: "pointer", fontSize: 24, color: C.muted, background: "none", border: "none", padding: "0 8px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 },
  textarea: { background: C.subtle, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontSize: 12, width: "100%", outline: "none", fontFamily: "inherit", resize: "vertical" },
};

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={s.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={s.cardLabel}>{label}</div>
          <div style={s.cardValue(color)}>{value}</div>
          {sub && <div style={s.cardSub}>{sub}</div>}
        </div>
        <div style={{ fontSize:22, opacity:.6 }}>{icon}</div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? C.red : C.green;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:bg, color:"#fff", padding:"12px 20px", borderRadius:8, fontSize:12, fontWeight:600, zIndex:2000, letterSpacing:.5, maxWidth:340 }}>
      {msg}
    </div>
  );
}

// ── Edit Car Modal Component ──────────────────────────────────────────────
function EditCarModal({ car, onClose, onSave, toast }) {
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
  const [branches, setBranches] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await apiGet("/roleauth/get_branches_revenue", { withAuth: true });
        setBranches(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Error loading branches:", error);
      }
    };
    loadBranches();

    if (car) {
      let featuresArray = [];
      if (car.features) {
        if (Array.isArray(car.features)) {
          featuresArray = car.features;
        } else if (typeof car.features === 'string') {
          try {
            const parsed = JSON.parse(car.features);
            featuresArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            featuresArray = car.features.split(',').map(f => f.trim());
          }
        }
      }

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
        features: featuresArray.join(", ")
      });
      
      if (car.images && Array.isArray(car.images)) {
        setExistingImages(car.images);
      } else if (car.images && typeof car.images === 'string') {
        try {
          const parsed = JSON.parse(car.images);
          setExistingImages(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setExistingImages([car.images]);
        }
      }
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (carId) => {
    if (imageFiles.length === 0) return [];
    
    const formDataImg = new FormData();
    formDataImg.append("mainImage", imageFiles[0]);
    imageFiles.slice(1).forEach(file => {
      formDataImg.append("images", file);
    });
    
    try {
      const response = await apiPost(`/roleauth/updateCarImages/${carId}`, formDataImg, {
        withAuth: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response?.data?.images || [];
    } catch (error) {
      console.error("Error uploading images:", error);
      toast?.(error.message || "Failed to upload images", "error");
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        if (imageFiles.length > 0) {
          setUploadingImages(true);
          await uploadImages(car.id);
          setUploadingImages(false);
        }
        
        toast?.("Car updated successfully!", "success");
        onSave();
        onClose();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast?.(err.message || "Failed to update car", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modal} onClick={onClose}>
      <div style={{...s.modalBox, maxWidth: 800, maxHeight: "90vh"}} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>✏️ Edit Car: {car?.model}</div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto", paddingRight: 8 }}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Model *</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} style={s.input} required />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Year *</label>
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
                <option value="MUV">MUV</option>
                <option value="Coupe">Coupe</option>
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
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Seating Capacity</label>
              <input type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Colour</label>
              <input type="text" name="colour" value={formData.colour} onChange={handleChange} style={s.input} placeholder="e.g. Red, Black, White" />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>License Plate *</label>
              <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} style={s.input} required placeholder="e.g. KA01AB1234" />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Mileage (km/l or km/charge)</label>
              <input type="text" name="mileage" value={formData.mileage} onChange={handleChange} style={s.input} placeholder="e.g. 18" />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Branch *</label>
              <select name="branchId" value={formData.branchId} onChange={handleChange} style={s.select} required>
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name} ({branch.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={s.sectionTitle}>💰 Pricing</div>
            <div style={s.formGrid}>
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
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={s.sectionTitle}>📌 Status</div>
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Car Status</label>
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
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Features (comma separated)</label>
            <textarea 
              name="features" 
              value={formData.features} 
              onChange={handleChange} 
              style={s.textarea} 
              rows="3"
              placeholder="e.g. AC, Power Steering, ABS, Airbags, GPS"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={s.sectionTitle}>🖼️ Car Images</div>
            
            {existingImages.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Current Images</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {existingImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img 
                        src={img} 
                        alt={`Car ${idx + 1}`}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: `1px solid ${C.border}`
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: C.red,
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label style={s.label}>Add New Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ ...s.input, padding: "8px" }}
              />
              {imageFiles.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {imageFiles.map((file, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${idx + 1}`}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: `1px solid ${C.border}`
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: C.red,
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" style={s.btn(C.muted, true)} onClick={onClose} disabled={loading || uploadingImages}>
              Cancel
            </button>
            <button type="submit" style={s.btn(C.accent)} disabled={loading || uploadingImages}>
              {loading || uploadingImages ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Branch Modal Component ──────────────────────────────────────────
// ── Edit Branch Modal Component ──────────────────────────────────────────
// ── Edit Branch Modal Component ──────────────────────────────────────────
function EditBranchModal({ branch, onClose, onSave, toast }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    branchHeadId: "",
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [subAdmins, setSubAdmins] = useState([]);
  const [loadingSubAdmins, setLoadingSubAdmins] = useState(false);

  useEffect(() => {
    const loadSubAdmins = async () => {
      setLoadingSubAdmins(true);
      try {
        // Fetch all Sub Admins (users with role = 'branch_head')
        const res = await getManagementUsers("null", "null", "branch_head", "100", "0");
        console.log("Loaded sub admins:", res?.data);
        setSubAdmins(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("Error loading sub admins:", error);
        toast?.("Failed to load sub admins", "error");
      } finally {
        setLoadingSubAdmins(false);
      }
    };
    loadSubAdmins();

    if (branch) {
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        city: branch.city || "",
        state: branch.state || "",
        zipCode: branch.zipCode || branch.zipcode || "",
        phone: branch.phone || "",
        email: branch.email || "",
        branchHeadId: branch.branchHeadId || "",
        isActive: branch.isActive !== undefined ? branch.isActive : true
      });
    }
  }, [branch, toast]);

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

    try {
      const updateData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone,
        email: formData.email,
        branchHeadId: formData.branchHeadId || null,
        isActive: formData.isActive
      };

      const response = await apiPut(`/roleauth/update-branch/${branch.id}`, updateData, { withAuth: true });
      
      if (response) {
        toast?.("Branch updated successfully!", "success");
        onSave();
        onClose();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast?.(err.message || "Failed to update branch", "error");
    } finally {
      setLoading(false);
    }
  };

  // Get the selected sub admin's name for display
  const selectedSubAdmin = subAdmins.find(admin => admin.id == formData.branchHeadId);

  return (
    <div style={s.modal} onClick={onClose}>
      <div style={{...s.modalBox, maxWidth: 600}} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>✏️ Edit Branch: {branch?.name}</div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Branch Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} style={s.input} required />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} style={s.input} required />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Zip Code</label>
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={s.input} />
            </div>
            
            <div style={s.formGroup}>
              <label style={s.label}>Assign Sub Admin (Branch Head)</label>
              <select 
                name="branchHeadId" 
                value={formData.branchHeadId} 
                onChange={handleChange} 
                style={s.select}
                disabled={loadingSubAdmins}
              >
                <option value="">— Select Sub Admin —</option>
                {subAdmins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email}) 
                    {admin.branch ? ` - Currently at: ${admin.branch_name || 'Branch ' + admin.branch}` : ''}
                  </option>
                ))}
              </select>
              {loadingSubAdmins && (
                <div style={{ fontSize: 10, color: C.cyan, marginTop: 4 }}>
                  Loading sub admins...
                </div>
              )}
              {!loadingSubAdmins && subAdmins.length === 0 && (
                <div style={{ fontSize: 10, color: C.amber, marginTop: 4 }}>
                  No sub admins found. Please create a sub admin first in Management section.
                </div>
              )}
              {selectedSubAdmin && (
                <div style={{ fontSize: 10, color: C.green, marginTop: 4 }}>
                  ✓ {selectedSubAdmin.name} will manage this branch
                </div>
              )}
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                The assigned sub admin will have full access to manage this branch
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={s.formGroup}>
              <label style={s.label}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ marginRight: 8 }} />
                Branch Active
              </label>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
                Inactive branches won't appear in the system for new bookings
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" style={s.btn(C.muted, true)} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={s.btn(C.accent)} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Staff Form Component ─────────────────────────────────────────────────
function StaffForm({ form, setForm, branches, onSubmit, onCancel, submitLabel, isEdit = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Full Name *</div>
        <input
          style={s.input}
          type="text"
          value={form.name}
          placeholder="e.g. John Doe"
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>
      
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Email *</div>
        <input
          style={s.input}
          type="email"
          value={form.email}
          placeholder="staff@car24.in"
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
      </div>
      
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Mobile Number *</div>
        <input
          style={s.input}
          type="tel"
          value={form.mobile}
          placeholder="10-digit number"
          maxLength={10}
          onChange={e => {
            let val = e.target.value.replace(/\D/g, "");
            setForm(f => ({ ...f, mobile: val }));
          }}
        />
      </div>
      
      {!isEdit && (
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Password *</div>
          <input
            style={s.input}
            type="password"
            value={form.password}
            placeholder="Create a password"
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
        </div>
      )}
      
      {isEdit && (
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>New Password (Optional)</div>
          <input
            style={s.input}
            type="password"
            value={form.password}
            placeholder="Leave blank to keep current"
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
        </div>
      )}
      
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Role *</div>
        <select
          style={{ ...s.select, width: "100%" }}
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value, branchId: e.target.value !== "branch_head" ? "" : f.branchId }))}
        >
          <option value="branch_head">Branch Head</option>
          <option value="admin">Admin</option>
          <option value="support">Support Staff</option>
        </select>
      </div>
      
      {form.role === "branch_head" && (
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Assign Branch *</div>
          <select
            style={{ ...s.select, width: "100%" }}
            value={form.branchId}
            onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
          >
            <option value="">— Select Branch —</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name} ({branch.city})</option>
            ))}
          </select>
        </div>
      )}
      
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={s.btn(C.green)} onClick={onSubmit}>{submitLabel}</button>
        <button style={s.btn(C.muted, true)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Branch Form Component ─────────────────────────────────────────────────
function BranchFormComponent({ form, setForm, fields, onSubmit, onCancel, submitLabel }) {
  const [branchHeads, setBranchHeads] = useState([]);

  useEffect(() => {
    getManagementUsers("null", "null", "branch_head", "100", "0")
      .then(res => setBranchHeads(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setBranchHeads([]));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {fields.map(({ label, key, type, placeholder, maxLength }) => (
        <div key={key}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
          <input
            style={s.input}
            type={type}
            value={form[key] || ""}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={e => {
              let val = e.target.value;
              if (key === "phone" || key === "zipcode") val = val.replace(/\D/g, "");
              setForm(f => ({ ...f, [key]: val }));
            }}
          />
        </div>
      ))}
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Branch Head (Optional)</div>
        <select
          style={{ ...s.select, width: "100%" }}
          value={form.branchHeadId || ""}
          onChange={e => setForm(f => ({ ...f, branchHeadId: e.target.value || null }))}
        >
          <option value="">— Select Branch Head —</option>
          {branchHeads.map(bh => (
            <option key={bh.id} value={bh.id}>{bh.name} ({bh.email})</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={s.btn(C.green)} onClick={onSubmit}>{submitLabel}</button>
        <button style={s.btn(C.muted, true)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// SECTION: OVERVIEW (CORRECTED)
// ─────────────────────────────────────────────────────────────────────────
function OverviewSection({ toast }) {
  const [stats, setStats] = useState(null);
  const [finances, setFinances] = useState(null);
  const [branches, setBranches] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todayBookingsModal, setTodayBookingsModal] = useState(false);
  const [todayBookingsLoading, setTodayBookingsLoading] = useState(false);
  const [todaySummary, setTodaySummary] = useState({ total: 0, revenue: 0, branches: 0 });
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [s, f, b, pc] = await Promise.all([
          apiGet("/roleauth/getAllData", { withAuth: true }),
          apiGet("/roleauth/getSuperAdminFinances", { withAuth: true }),
          apiGet("/roleauth/get_branches_revenue", { withAuth: true }),
          apiGet("/cars/get_pending_cars", { withAuth: true }),
        ]);
        
        setStats(s);
        setFinances(f?.data);
        
        const branchesArray = Array.isArray(b) ? b : [];
        setBranches(branchesArray);
        
        const pendingOnly = (Array.isArray(pc?.data) ? pc.data : []).filter(c => c.approvalstatus !== "rejected");
        setPendingCount(pendingOnly.length);
        
        const currentDate = new Date().toISOString().slice(0, 10);
        
        const branchPromises = branchesArray.map(async (branch) => {
          try {
            const res = await apiGet(`/bookingApi/getBranchBookingsByDate?branchId=${branch.id}&date=${currentDate}`, { withAuth: true });
            const branchBookings = Array.isArray(res?.data) ? res.data : [];
            return {
              branchId: branch.id,
              branchName: branch.name,
              bookings: branchBookings,
              revenue: branchBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0)
            };
          } catch (err) {
            console.error(`Failed to fetch bookings for branch ${branch.id}:`, err);
            return { branchId: branch.id, branchName: branch.name, bookings: [], revenue: 0 };
          }
        });
        
        const allBranchData = await Promise.all(branchPromises);
        const allBookings = allBranchData.flatMap(b => b.bookings);
        const totalRevenue = allBranchData.reduce((sum, b) => sum + b.revenue, 0);
        const uniqueBranches = allBranchData.filter(b => b.bookings.length > 0).length;
        
        setTodaySummary({
          total: allBookings.length,
          revenue: totalRevenue,
          branches: uniqueBranches
        });
        
      } catch (error) {
        console.error("Overview API error:", error);
        toast?.(error.message || "Failed to load overview data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [toast]);

  const fetchBranchBookingsForToday = async (branchId, branchName) => {
    setTodayBookingsLoading(true);
    try {
      const currentDate = new Date().toISOString().slice(0, 10);
      const res = await apiGet(`/bookingApi/getBranchBookingsByDate?branchId=${branchId}&date=${currentDate}`, { withAuth: true });
      const branchBookings = Array.isArray(res?.data) ? res.data : [];
      
      setTodayBookingsModal({
        open: true,
        branchId: branchId,
        branchName: branchName,
        bookings: branchBookings
      });
    } catch (error) {
      console.error("Error fetching branch bookings:", error);
      toast?.(error.message || "Failed to fetch branch bookings", "error");
    } finally {
      setTodayBookingsLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading overview…</div>;
  }

  const totalBookingsToday = todaySummary.total || 0;
  const totalRevenueToday = todaySummary.revenue || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={s.grid(3)}>
        <StatCard label="Total Gross Revenue" value={fmt(finances?.total_gross_revenue)} sub="all time" color={C.green} icon="₹" />
        <StatCard label="Net Profit" value={fmt(finances?.total_profit)} sub="superadmin + branch" color={C.cyan} icon="📈" />
        <StatCard label="Pending Owner Dues" value={fmt(finances?.total_pending_dues)} sub="unpaid payouts" color={C.amber} icon="⏳" />
      </div>
      
      <div style={s.grid(4)}>
        <StatCard label="Today's Bookings" value={fmtNum(totalBookingsToday)} sub="across all branches" color={C.accent} icon="📅" />
        <StatCard label="Today's Revenue" value={fmt(totalRevenueToday)} sub="from today's bookings" color={C.green} icon="💵" />
        <StatCard label="Total Cars" value={fmtNum(stats?.totalCars)} sub={`${pendingCount} pending approval`} color={C.purple} icon="🚗" />
        <StatCard label="Total Branches" value={fmtNum(stats?.totalBranches)} color={C.cyan} icon="🏢" />
      </div>
      
      <div style={s.grid(2)}>
        <StatCard label="Verified Users" value={fmtNum(stats?.verifiedUsers)} color={C.text} icon="✅" />
        <StatCard label="Total Owners" value={fmtNum(stats?.totalOwners)} color={C.text} icon="👤" />
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Branch Revenue Leaderboard</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                {["#","Branch","City","Total Volume","Branch Keep","Owner Payout","Today's Bookings"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.slice(0, 8).map((b, i) => (
                <tr key={b.id}>
                  <td style={s.td}>
                    <span style={s.tag(i === 0 ? C.amber : i === 1 ? C.muted : C.border)}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{...s.td, fontWeight: 600}}>{b.name}</td>
                  <td style={{...s.td, color: C.muted}}>{b.city}</td>
                  <td style={s.td}>{fmt(b.total_volume)}</td>
                  <td style={{...s.td, color: C.green}}>{fmt(b.branch_retained)}</td>
                  <td style={{...s.td, color: C.amber}}>{fmt(b.owner_payout)}</td>
                  <td style={s.td}>
                    <button 
                      style={s.btn(C.accent, true)} 
                      onClick={() => fetchBranchBookingsForToday(b.id, b.name)}
                    >
                      View Today's Bookings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Bookings Modal */}
      {todayBookingsModal && todayBookingsModal.open && (
        <div style={s.modal} onClick={() => setTodayBookingsModal({ open: false })}>
          <div style={{...s.modalBox, maxWidth: 900, maxHeight: "80vh"}} onClick={e => e.stopPropagation()}>
            <div style={s.sectionTitle}>
              Today's Bookings - {todayBookingsModal.branchName}
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 12 }}>
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            
            {todayBookingsLoading ? (
              <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading bookings...</div>
            ) : todayBookingsModal.bookings?.length === 0 ? (
              <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>
                No bookings for this branch today
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
                  <div style={s.pill}>
                    Total: {todayBookingsModal.bookings?.length || 0} bookings
                  </div>
                  <div style={s.pill}>
                    Revenue: {fmt(todayBookingsModal.bookings?.reduce((sum, b) => sum + (Number(b.totalPrice) || Number(b.total_amount) || 0), 0))}
                  </div>
                </div>
                
                <div style={{ overflowX: "auto", maxHeight: "60vh" }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["Image", "Booking ID", "Car", "Customer", "Mobile", "Pickup Time", "Dropoff Time", "Amount", "Status", "Live Status", "Payment"].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todayBookingsModal.bookings.map((b, i) => {
                        const imageUrl = getCarImageUrl(b);
                        const hasError = imageErrors[b.booking_id || b.id];
                        
                        return (
                          <tr key={i}>
                            <td style={s.td}>
                              {imageUrl && !hasError ? (
                                <img 
                                  src={imageUrl} 
                                  alt={b.car_model}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                  }}
                                  onError={() => setImageErrors(prev => ({ ...prev, [b.booking_id || b.id]: true }))}
                                  onClick={() => window.open(imageUrl, "_blank")}
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
                                  fontSize: "24px"
                                }}>
                                  🚗
                                </div>
                              )}
                            </td>
                            <td style={s.td}>#{b.booking_id || b.id || i+1}</td>
                            <td style={{...s.td, fontWeight: 600}}>{b.car_model || "—"}</td>
                            <td style={s.td}>{b.customer_name || "—"}</td>
                            <td style={{...s.td, color: C.muted}}>{b.customer_phone || "—"}</td>
                            <td style={s.td}>{fmtDateTime(b.pickupDate)}</td>
                            <td style={s.td}>{fmtDateTime(b.dropoffDate)}</td>
                            <td style={{...s.td, color: C.green, fontWeight: 600}}>{fmt(b.totalPrice)}</td>
                            <td style={s.td}>
                              <span style={s.badge(
                                b.system_status === "completed" ? C.green :
                                b.system_status === "cancelled" ? C.red : C.amber
                              )}>
                                {b.system_status || "Active"}
                              </span>
                            </td>
                            <td style={s.td}>
                              <span style={s.tag(
                                b.live_status === "Ride Started" ? C.purple :
                                b.live_status === "Ride Ended" ? C.green :
                                b.live_status === "Upcoming" ? C.accent : C.muted
                              )}>
                                {b.live_status || "—"}
                              </span>
                            </td>
                            <td style={s.td}>
                              <span style={s.badge(b.payment_status === "paid" ? C.green : C.amber)}>
                                {b.payment_status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={s.btn(C.accent)} onClick={() => setTodayBookingsModal({ open: false })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: USERS
// ─────────────────────────────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("user");
  const [page, setPage] = useState(0);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/roleauth/getUsersData/null/${role}/${limit}/${page * limit}`, { withAuth: true });
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch(e) { 
      console.error("Users load error:", e);
      setUsers([]); 
    }
    setLoading(false);
  }, [role, page, limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        {["user","owner"].map(r => (
          <button key={r} style={s.btn(r===role?C.accent:C.muted, r!==role)} onClick={() => { setRole(r); setPage(0); }}>
            {r === "user" ? "Customers" : "Owners"}
          </button>
        ))}
        <span style={{...s.pill, marginLeft:"auto"}}>{users.length} records</span>
      </div>

      <div style={s.card}>
        {loading ? <div style={{color:C.muted, padding:20, textAlign:"center"}}>Loading…</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Name","Username","Email","Mobile","Verified","Profile","Role"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i}>
                    <td style={{...s.td, fontWeight:600}}>{u.name}</td>
                    <td style={{...s.td, color:C.muted}}>{u.username || "—"}</td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>{u.mobileNo || u.mobileno || "—"}</td>
                    <td style={s.td}><span style={s.badge(u.is_verified ? C.green : C.amber)}>{u.is_verified ? "Yes" : "No"}</span></td>
                    <td style={s.td}><span style={s.badge(u.is_profile_completed ? C.green : C.muted)}>{u.is_profile_completed ? "Done" : "Incomplete"}</span></td>
                    <td style={s.td}><span style={s.tag(u.role === "owner" ? C.purple : C.accent)}>{u.role}</span></td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{...s.td, color:C.muted, textAlign:"center"}}>No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <button style={s.btn(C.accent, true)} onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>← Prev</button>
        <span style={s.pill}>Page {page+1}</span>
        <button style={s.btn(C.accent, true)} onClick={() => setPage(p => p+1)} disabled={users.length < limit}>Next →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: MANAGEMENT (Staff / Admins)
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// SECTION: MANAGEMENT (Staff / Admins) - With OTP Verification
// ─────────────────────────────────────────────────────────────────────────
function ManagementSection({ toast }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({ email: "", otp: "" });
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    mobile: "", 
    role: "branch_head", 
    branchId: "",
    password: ""
  });
  const [branches, setBranches] = useState([]);
  const [filterRole, setFilterRole] = useState("null");
  const [filterBranch, setFilterBranch] = useState("null");

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await getManagementUsers("null", filterBranch, filterRole, "100", "0");
      setStaff(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading staff:", error);
      toast?.(error.message || "Failed to load staff", "error");
      setStaff([]);
    }
    setLoading(false);
  };

  const loadBranches = async () => {
    try {
      const res = await apiGet("/roleauth/get_branches_revenue", { withAuth: true });
      setBranches(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  useEffect(() => {
    loadStaff();
    loadBranches();
  }, [filterRole, filterBranch]);

  const handleCreate = async () => {
    if (!form.name?.trim()) { toast("Name is required", "error"); return; }
    if (!form.email?.trim()) { toast("Email is required", "error"); return; }
    if (!form.mobile?.trim()) { toast("Mobile number is required", "error"); return; }
    if (!form.password?.trim()) { toast("Password is required", "error"); return; }
    
    if (form.role === "branch_head" && !form.branchId) { 
      toast("Branch is required for Sub Admin", "error"); 
      return; 
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobileNo: form.mobile.trim(),
        role: form.role,
        branch: form.branchId ? parseInt(form.branchId) : null,
        password: form.password.trim()
      };
      
      const response = await apiPost("/roleauth/createMangement", payload, { withAuth: true });
      
      if (response) {
        // Store the email for OTP verification
        setOtpData({ email: form.email, otp: "" });
        setShowOtpModal(true);
        setShowCreate(false);
        toast("Staff member created! Please verify OTP sent to email.", "success");
      }
    } catch (error) {
      toast(error.message || "Failed to create staff", "error");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpData.otp || otpData.otp.length !== 6) {
      toast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setVerifying(true);
    try {
      const payload = {
        email: otpData.email,
        otp: otpData.otp
      };
      
      const response = await apiPut("/roleauth/verifyManagementRegister", payload, { withAuth: true });
      
      if (response) {
        toast("Staff member verified successfully!", "success");
        setShowOtpModal(false);
        setOtpData({ email: "", otp: "" });
        setForm({ name: "", email: "", mobile: "", role: "branch_head", branchId: "", password: "" });
        loadStaff(); // Refresh the staff list
      }
    } catch (error) {
      toast(error.message || "Failed to verify OTP", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      // Call your resend OTP endpoint here
      await apiPost("/roleauth/resendOtp", { email: otpData.email }, { withAuth: true });
      toast("OTP resent successfully!", "success");
    } catch (error) {
      toast(error.message || "Failed to resend OTP", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        mobileNo: form.mobile,
        role: form.role,
        branch: form.branchId ? parseInt(form.branchId) : null
      };
      if (form.password) payload.password = form.password;
      
      await apiPut(`/roleauth/updateManagement/${editStaff.id}`, payload, { withAuth: true });
      toast("Staff member updated!", "success");
      setEditStaff(null);
      loadStaff();
    } catch (error) {
      toast(error.message || "Failed to update staff", "error");
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await apiPut(`/roleauth/deleteManagement/${staffId}`, {}, { withAuth: true });
      toast("Staff member deleted", "success");
      loadStaff();
    } catch (error) {
      toast(error.message || "Failed to delete staff", "error");
    }
  };

  const openEdit = (staffItem) => {
    setEditStaff(staffItem);
    setForm({
      name: staffItem.name,
      email: staffItem.email,
      mobile: staffItem.mobileNo || staffItem.mobile,
      role: staffItem.role,
      branchId: staffItem.branch || "",
      password: ""
    });
  };

  // OTP Verification Modal
  const OtpVerificationModal = () => (
    <div style={s.modal} onClick={() => setShowOtpModal(false)}>
      <div style={{...s.modalBox, maxWidth: 450}} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>🔐 Verify Staff Member</div>
          <button style={s.closeBtn} onClick={() => setShowOtpModal(false)}>×</button>
        </div>
        
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>
            OTP has been sent to
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.cyan, marginBottom: 16 }}>
            {otpData.email}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Please enter the 6-digit verification code to activate this staff member
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Enter OTP *
          </div>
          <input
            style={{ ...s.input, textAlign: "center", fontSize: 20, letterSpacing: 4 }}
            type="text"
            maxLength={6}
            placeholder="000000"
            value={otpData.otp}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, "");
              setOtpData(prev => ({ ...prev, otp: val }));
            }}
            autoFocus
          />
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <button 
            style={s.btn(C.muted, true)} 
            onClick={handleResendOtp}
            disabled={verifying}
          >
            Resend OTP
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              style={s.btn(C.muted, true)} 
              onClick={() => setShowOtpModal(false)}
              disabled={verifying}
            >
              Cancel
            </button>
            <button 
              style={s.btn(C.green)} 
              onClick={handleVerifyOtp}
              disabled={verifying || otpData.otp.length !== 6}
            >
              {verifying ? "Verifying..." : "Verify & Activate"}
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: 10, color: C.muted, textAlign: "center", marginTop: 16 }}>
          OTP expires in 5 minutes
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={s.pill}>
          <span>👥 Role: </span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ background: "transparent", border: "none", color: C.text, outline: "none", cursor: "pointer" }}
          >
            <option value="null">All Roles</option>
            <option value="branch_head">Sub Admins</option>
            <option value="admin">Admins</option>
            <option value="support">Support Staff</option>
          </select>
        </div>
        
        <div style={s.pill}>
          <span>🏢 Branch: </span>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            style={{ background: "transparent", border: "none", color: C.text, outline: "none", cursor: "pointer" }}
          >
            <option value="null">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        
        <button style={s.btn(C.accent, true)} onClick={loadStaff}>🔄 Refresh</button>
        
        <div style={{ marginLeft: "auto" }}>
          <button style={s.btn(C.green)} onClick={() => setShowCreate(true)}>+ Add Staff Member</button>
        </div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading staff...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Name", "Email", "Mobile", "Role", "Assigned Branch", "Status", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((staffItem, i) => (
                  <tr key={i}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{staffItem.name}</td>
                    <td style={s.td}>{staffItem.email}</td>
                    <td style={{ ...s.td, color: C.muted }}>{staffItem.mobileNo || staffItem.mobile}</td>
                    <td style={s.td}>
                      <span style={s.tag(
                        staffItem.role === "branch_head" ? C.cyan : 
                        staffItem.role === "admin" ? C.purple : C.accent
                      )}>
                        {staffItem.role === "branch_head" ? "Sub Admin" : 
                         staffItem.role === "admin" ? "Admin" : "Support"}
                      </span>
                    </td>
                    <td style={s.td}>
                      {staffItem.branch_name || staffItem.branch || "—"}
                      {staffItem.role === "branch_head" && !staffItem.branch_name && (
                        <span style={{ fontSize: 10, color: C.red }}> (No branch assigned)</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(staffItem.is_verified ? C.green : C.amber)}>
                        {staffItem.is_verified ? "Verified" : "Pending Verification"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button style={s.btn(C.accent, true)} onClick={() => openEdit(staffItem)}>Edit</button>
                        <button style={s.btn(C.red, true)} onClick={() => handleDelete(staffItem.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...s.td, color: C.muted, textAlign: "center" }}>
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreate && (
        <div style={s.modal} onClick={() => setShowCreate(false)}>
          <div style={{...s.modalBox, maxWidth: 550}} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>➕ Add New Staff Member</div>
              <button style={s.closeBtn} onClick={() => setShowCreate(false)}>×</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Full Name *
                </div>
                <input
                  style={s.input}
                  type="text"
                  value={form.name}
                  placeholder="e.g. John Doe"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Email *
                </div>
                <input
                  style={s.input}
                  type="email"
                  value={form.email}
                  placeholder="staff@car24.in"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Mobile Number *
                </div>
                <input
                  style={s.input}
                  type="tel"
                  value={form.mobile}
                  placeholder="10-digit number"
                  maxLength={10}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, "");
                    setForm(f => ({ ...f, mobile: val }));
                  }}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Password *
                </div>
                <input
                  style={s.input}
                  type="password"
                  value={form.password}
                  placeholder="Create a password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Role *
                </div>
                <select
                  style={{ ...s.select, width: "100%" }}
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value, branchId: e.target.value !== "branch_head" ? "" : f.branchId }))}
                >
                  <option value="branch_head">Sub Admin (Branch Manager)</option>
                  <option value="admin">Admin</option>
                  <option value="support">Support Staff</option>
                </select>
                <div style={{ fontSize: 10, color: C.cyan, marginTop: 4 }}>
                  {form.role === "branch_head" 
                    ? "Sub Admins can only manage their assigned branch" 
                    : form.role === "admin" 
                    ? "Admins have broader management permissions" 
                    : "Support staff have limited access"}
                </div>
              </div>
              
              {form.role === "branch_head" && (
                <div>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                    Assign Branch *
                  </div>
                  <select
                    style={{ ...s.select, width: "100%" }}
                    value={form.branchId}
                    onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  >
                    <option value="">— Select Branch —</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </option>
                    ))}
                  </select>
                  {branches.length === 0 && (
                    <div style={{ fontSize: 10, color: C.amber, marginTop: 4 }}>
                      No branches found. Please create a branch first.
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                    This sub admin will only have access to manage this specific branch
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button style={s.btn(C.muted, true)} onClick={() => { setShowCreate(false); setForm({ name: "", email: "", mobile: "", role: "branch_head", branchId: "", password: "" }); }}>
                  Cancel
                </button>
                <button style={s.btn(C.green)} onClick={handleCreate}>
                  Create Staff Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editStaff && (
        <div style={s.modal} onClick={() => setEditStaff(null)}>
          <div style={{...s.modalBox, maxWidth: 550}} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>✏️ Edit Staff Member</div>
              <button style={s.closeBtn} onClick={() => setEditStaff(null)}>×</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Full Name *
                </div>
                <input
                  style={s.input}
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Email *
                </div>
                <input
                  style={s.input}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Mobile Number *
                </div>
                <input
                  style={s.input}
                  type="tel"
                  value={form.mobile}
                  maxLength={10}
                  onChange={e => {
                    let val = e.target.value.replace(/\D/g, "");
                    setForm(f => ({ ...f, mobile: val }));
                  }}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  New Password (Optional)
                </div>
                <input
                  style={s.input}
                  type="password"
                  value={form.password}
                  placeholder="Leave blank to keep current"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Role *
                </div>
                <select
                  style={{ ...s.select, width: "100%" }}
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value, branchId: e.target.value !== "branch_head" ? "" : f.branchId }))}
                >
                  <option value="branch_head">Sub Admin (Branch Manager)</option>
                  <option value="admin">Admin</option>
                  <option value="support">Support Staff</option>
                </select>
              </div>
              
              {form.role === "branch_head" && (
                <div>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                    Assign Branch *
                  </div>
                  <select
                    style={{ ...s.select, width: "100%" }}
                    value={form.branchId}
                    onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  >
                    <option value="">— Select Branch —</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                    This sub admin will only have access to manage this specific branch
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button style={s.btn(C.muted, true)} onClick={() => setEditStaff(null)}>Cancel</button>
                <button style={s.btn(C.accent)} onClick={handleUpdate}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && <OtpVerificationModal />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: BRANCHES  
// ─────────────────────────────────────────────────────────────────────────
function BranchesSection({ toast }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState({ name:"", address:"", city:"", state:"", zipcode:"", phone:"", email:"", branchHeadId:"" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet("/roleauth/get_branches_revenue", { withAuth: true });
      setBranches(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error loading branches:", error);
      setBranches([]);
    }
    setLoading(false);
  };
  
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name?.trim())    { toast("Branch name is required", "error"); return; }
    if (!form.address?.trim()) { toast("Address is required", "error"); return; }
    if (!form.city?.trim())    { toast("City is required", "error"); return; }
    if (!form.state?.trim())   { toast("State is required", "error"); return; }
    if (!form.zipcode?.trim()) { toast("Zip code is required", "error"); return; }
    if (!form.phone?.trim())   { toast("Phone is required", "error"); return; }
    if (!form.email?.trim())   { toast("Email is required", "error"); return; }
    
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipcode.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        branchHeadId: form.branchHeadId?.trim() || null,
      };
      await apiPost("/branch/create-branch", payload, { withAuth: true });
      toast("Branch created!", "success");
      setShowCreate(false);
      setForm({ name:"", address:"", city:"", state:"", zipcode:"", phone:"", email:"", branchHeadId:"" });
      load();
    } catch(e) { 
      toast(e.message || "Failed to create branch", "error"); 
    }
  };

  const handleUpdate = async () => {
    try {
      const updateData = {
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipcode,
        phone: form.phone,
        email: form.email,
        branchHeadId: form.branchHeadId || null,
        isActive: true
      };
      await apiPut(`/roleauth/update-branch/${editBranch.id}`, updateData, { withAuth: true });
      toast("Branch updated!", "success");
      setEditBranch(null);
      load();
    } catch(e) { 
      toast(e.message || "Failed to update branch", "error"); 
    }
  };

  const openEdit = (b) => {
    setEditBranch(b);
    setForm({ 
      name: b.name, 
      address: b.address || "", 
      city: b.city, 
      state: b.state || "", 
      zipcode: b.zipcode || "", 
      phone: b.phone || "", 
      email: b.email || "", 
      branchHeadId: b.branchHeadId || "" 
    });
  };

  const handleBranchUpdated = () => {
    load();
    toast("Branch updated successfully!", "success");
  };

  const BRANCH_FIELDS = [
    { label: "Branch Name",  key: "name",    type: "text",  placeholder: "e.g. Hyderabad Central" },
    { label: "Address",      key: "address", type: "text",  placeholder: "Street / Area" },
    { label: "City",         key: "city",    type: "text",  placeholder: "e.g. Hyderabad" },
    { label: "State",        key: "state",   type: "text",  placeholder: "e.g. Telangana" },
    { label: "Zip Code",     key: "zipcode", type: "text",  placeholder: "e.g. 500001", maxLength: 6 },
    { label: "Phone",        key: "phone",   type: "tel",   placeholder: "10-digit number", maxLength: 10 },
    { label: "Email",        key: "email",   type: "email", placeholder: "branch@car24.in" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button style={s.btn(C.green)} onClick={() => setShowCreate(true)}>+ New Branch</button>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Branch", "City", "Total Volume", "Retained", "Owner Payout", "Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <tr key={i}>
                    <td style={{...s.td, fontWeight: 600}}>{b.name}</td>
                    <td style={{...s.td, color: C.muted}}>{b.city}</td>
                    <td style={s.td}>{fmt(b.total_volume)}</td>
                    <td style={{...s.td, color: C.green}}>{fmt(b.branch_retained)}</td>
                    <td style={{...s.td, color: C.amber}}>{fmt(b.owner_payout)}</td>
                    <td style={s.td}>
                      <button style={s.btn(C.accent, true)} onClick={() => openEdit(b)}>Edit</button>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{...s.td, color: C.muted, textAlign: "center"}}>No branches</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      {showCreate && (
        <div style={s.modal} onClick={() => setShowCreate(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.sectionTitle}>Create New Branch</div>
            <BranchFormComponent 
              form={form} 
              setForm={setForm} 
              fields={BRANCH_FIELDS}
              onSubmit={handleCreate} 
              onCancel={() => { setShowCreate(false); }} 
              submitLabel="Create Branch"
            />
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editBranch && (
        <EditBranchModal 
          branch={editBranch} 
          onClose={() => setEditBranch(null)} 
          onSave={handleBranchUpdated}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: CARS
// ─────────────────────────────────────────────────────────────────────────
function CarsSection({ toast }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [pricingModal, setPricingModal] = useState(null);
  const [pricing, setPricing] = useState({ six_hr_price: "", twelve_hr_price: "", twentyfour_hr_price: "", percentage: 70 });
  const [page, setPage] = useState(0);
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (filter === "pending") {
        const res = await apiGet("/cars/get_pending_cars", { withAuth: true });
        const all = Array.isArray(res?.data) ? res.data : [];
        setCars(all.filter(c => c.approvalstatus !== "rejected"));
      } else {
        const res = await apiGet("/cars/get_cars", { withAuth: true, query: { limit, pageno: page } });
        setCars(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error loading cars:", error);
      setCars([]);
      toast(error.message || "Failed to load cars", "error");
    }
    setLoading(false);
  }, [filter, page, limit, toast]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!pricing.six_hr_price || !pricing.twelve_hr_price || !pricing.twentyfour_hr_price) {
      toast("Please enter all pricing fields", "error");
      return;
    }
    try {
      await apiPut(`/cars/approve_pending_cars/${pricingModal.id}`, {
        status: "approved",
        six: parseFloat(pricing.six_hr_price),
        twelve: parseFloat(pricing.twelve_hr_price),
        twentyFour: parseFloat(pricing.twentyfour_hr_price),
        percentage: parseFloat(pricing.percentage)
      }, { withAuth: true });
      toast("Car approved successfully!", "success");
      setPricingModal(null);
      setPricing({ six_hr_price: "", twelve_hr_price: "", twentyfour_hr_price: "", percentage: 70 });
      load();
    } catch (error) {
      toast(error.message || "Failed to approve car", "error");
    }
  };

  const handleReject = async (carId) => {
    if (!window.confirm("Are you sure you want to reject this car?")) return;
    try {
      await apiPut(`/cars/approve_pending_cars/${carId}`, { status: "rejected" }, { withAuth: true });
      toast("Car rejected", "success");
      load();
    } catch (error) {
      toast(error.message || "Failed to reject car", "error");
    }
  };

  const handleUpdateCar = async (carId, data) => {
    try {
      await apiPut(`/roleauth/updateCar/${carId}`, data, { withAuth: true });
      toast("Car updated successfully!", "success");
      load();
    } catch (error) {
      toast(error.message || "Failed to update car", "error");
    }
  };

  const handleCarUpdated = () => {
    load();
    toast("Car updated successfully!", "success");
  };

  // Car Card Component
  const CarCard = ({ car }) => {
    const [hovered, setHovered] = useState(false);
    const imageUrl = getCarImageUrl(car);
    const hasError = imageErrors[car.id];

    return (
      <div 
        style={{
          ...s.carCard,
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.3)" : "none"
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={s.imageContainer}>
          {imageUrl && !hasError ? (
            <img 
              src={imageUrl} 
              alt={car.model}
              style={s.carImage}
              onError={() => setImageErrors(prev => ({ ...prev, [car.id]: true }))}
              onClick={() => window.open(imageUrl, "_blank")}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              background: `linear-gradient(135deg, ${C.subtle} 0%, ${C.card} 100%)`
            }}>
              🚗
            </div>
          )}
          
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            gap: 8
          }}>
            <span style={s.tag(car.isAvailable ? C.green : C.red)}>
              {car.isAvailable ? "Available" : "Unavailable"}
            </span>
            {car.approvalstatus === "pending" && (
              <span style={s.tag(C.amber)}>Pending</span>
            )}
          </div>
        </div>
        
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{car.model}</h3>
              <div style={{ fontSize: 11, color: C.muted }}>{car.year} • {car.category}</div>
            </div>
            <div style={{ fontSize: 20 }}>🚙</div>
          </div>
          
          <div style={s.specGrid}>
            <div style={{ fontSize: 11, color: C.muted }}>
              <div style={{ fontWeight: 600, color: C.text }}>License</div>
              <div>{car.licensePlate || car.license_plate}</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              <div style={{ fontWeight: 600, color: C.text }}>Fuel</div>
              <div>{car.fuelType}</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              <div style={{ fontWeight: 600, color: C.text }}>Seats</div>
              <div>{car.seatingCapacity}</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              <div style={{ fontWeight: 600, color: C.text }}>Transmission</div>
              <div>{car.transmission}</div>
            </div>
          </div>
          
          <div style={s.priceBar}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: C.muted }}>6 HOUR</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmt(car.six_hr_price)}</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: C.muted }}>12 HOUR</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmt(car.twelve_hr_price)}</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 9, color: C.muted }}>24 HOUR</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmt(car.twentyfour_hr_price)}</div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              style={{ ...s.btn(C.cyan, true), flex: 1 }}
              onClick={() => setViewModal(car)}
            >
              View Details
            </button>
            <button 
              style={{ ...s.btn(C.amber, true), flex: 1 }}
              onClick={() => setEditModal(car)}
            >
              ✏️ Edit
            </button>
            {car.approvalstatus === "pending" && (
              <button 
                style={{ ...s.btn(C.green), flex: 1 }}
                onClick={() => { 
                  setPricingModal(car); 
                  setPricing({ six_hr_price: "", twelve_hr_price: "", twentyfour_hr_price: "", percentage: 70 }); 
                }}
              >
                Approve
              </button>
            )}
            {car.approvalstatus === "approved" && (
              <button 
                style={{ ...s.btn(C.amber, true), flex: 1 }}
                onClick={() => handleUpdateCar(car.id, { isAvailable: !car.isAvailable })}
              >
                {car.isAvailable ? "Disable" : "Enable"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Car Table View
  const CarTable = () => {
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Image", "Model", "Year", "Category", "Fuel", "Seats", "Branch", "Status", "Approval", "Actions"].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((c, i) => {
              const imageUrl = getCarImageUrl(c);
              const hasError = imageErrors[c.id];
              
              return (
                <tr key={i}>
                  <td style={s.td}>
                    {imageUrl && !hasError ? (
                      <img 
                        src={imageUrl} 
                        alt={c.model}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                        onError={() => setImageErrors(prev => ({ ...prev, [c.id]: true }))}
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                    ) : (
                      <div style={{
                        width: "60px",
                        height: "60px",
                        background: C.subtle,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "30px"
                      }}>
                        🚗
                      </div>
                    )}
                  </td>
                  <td style={{...s.td, fontWeight: 600}}>{c.model}</td>
                  <td style={s.td}>{c.year}</td>
                  <td style={s.td}>{c.category}</td>
                  <td style={s.td}>{c.fuelType}</td>
                  <td style={s.td}>{c.seatingCapacity}</td>
                  <td style={{...s.td, color: C.muted}}>{c.branch_name || "—"}</td>
                  <td style={s.td}>
                    <span style={s.tag(c.isAvailable ? C.green : C.red)}>
                      {c.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(c.approvalstatus === "approved" ? C.green : c.approvalstatus === "rejected" ? C.red : C.amber)}>
                      {c.approvalstatus}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={s.btn(C.cyan, true)} onClick={() => setViewModal(c)}>View</button>
                      <button style={s.btn(C.amber, true)} onClick={() => setEditModal(c)}>✏️ Edit</button>
                      {c.approvalstatus === "pending" && (
                        <>
                          <button style={s.btn(C.green)} onClick={() => { setPricingModal(c); setPricing({ six_hr_price: "", twelve_hr_price: "", twentyfour_hr_price: "", percentage: 70 }); }}>Approve</button>
                          <button style={s.btn(C.red, true)} onClick={() => handleReject(c.id)}>Reject</button>
                        </>
                      )}
                      {c.approvalstatus === "approved" && (
                        <button style={s.btn(C.amber, true)} onClick={() => handleUpdateCar(c.id, { isAvailable: !c.isAvailable })}>
                          {c.isAvailable ? "Disable" : "Enable"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {cars.length === 0 && (
              <tr>
                <td colSpan={10} style={{...s.td, color: C.muted, textAlign: "center"}}>
                  {filter === "pending" ? "No pending cars for approval" : "No cars found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {["pending", "all"].map(f => (
            <button key={f} style={s.btn(f === filter ? C.accent : C.muted, f !== filter)} onClick={() => { setFilter(f); setPage(0); }}>
              {f === "pending" ? "🚗 Pending Approval" : "📋 All Cars"}
            </button>
          ))}
        </div>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button 
            style={s.btn(viewMode === "grid" ? C.accent : C.muted, viewMode !== "grid")} 
            onClick={() => setViewMode("grid")}
          >
            ⊞ Grid
          </button>
          <button 
            style={s.btn(viewMode === "table" ? C.accent : C.muted, viewMode !== "table")} 
            onClick={() => setViewMode("table")}
          >
            ☰ Table
          </button>
          <span style={s.pill}>{cars.length} {filter === "pending" ? "pending" : "total"} cars</span>
        </div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading cars...</div>
        ) : cars.length === 0 ? (
          <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>
            {filter === "pending" ? "No pending cars for approval" : "No cars found"}
          </div>
        ) : (
          viewMode === "grid" ? (
            <div style={s.carGrid}>
              {cars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          ) : (
            <CarTable />
          )
        )}
      </div>

      {filter !== "pending" && cars.length >= limit && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button style={s.btn(C.accent, true)} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span style={s.pill}>Page {page + 1}</span>
          <button style={s.btn(C.accent, true)} onClick={() => setPage(p => p + 1)} disabled={cars.length < limit}>Next →</button>
        </div>
      )}

      {/* Pricing Modal */}
      {pricingModal && (
        <div style={s.modal} onClick={() => setPricingModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.sectionTitle}>Approve Car - {pricingModal.model}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>6 Hour Price *</div>
                <input
                  style={s.input}
                  type="number"
                  value={pricing.six_hr_price}
                  placeholder="e.g. 1500"
                  onChange={e => setPricing(p => ({ ...p, six_hr_price: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>12 Hour Price *</div>
                <input
                  style={s.input}
                  type="number"
                  value={pricing.twelve_hr_price}
                  placeholder="e.g. 2500"
                  onChange={e => setPricing(p => ({ ...p, twelve_hr_price: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>24 Hour Price *</div>
                <input
                  style={s.input}
                  type="number"
                  value={pricing.twentyfour_hr_price}
                  placeholder="e.g. 4500"
                  onChange={e => setPricing(p => ({ ...p, twentyfour_hr_price: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Owner Percentage *</div>
                <input
                  style={s.input}
                  type="number"
                  value={pricing.percentage}
                  placeholder="e.g. 70"
                  onChange={e => setPricing(p => ({ ...p, percentage: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button style={s.btn(C.green)} onClick={handleApprove}>Approve Car</button>
                <button style={s.btn(C.muted, true)} onClick={() => setPricingModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div style={s.modal} onClick={() => setViewModal(null)}>
          <div style={{...s.modalBox, maxWidth: 600}} onClick={e => e.stopPropagation()}>
            <div style={s.sectionTitle}>Car Details - {viewModal.model}</div>
            
            <div style={{ marginBottom: 20, borderRadius: 8, overflow: "hidden", background: C.subtle }}>
              {(() => {
                const imageUrl = getCarImageUrl(viewModal);
                const hasError = imageErrors[viewModal.id];
                return imageUrl && !hasError ? (
                  <img 
                    src={imageUrl} 
                    alt={viewModal.model}
                    style={{ width: "100%", maxHeight: "300px", objectFit: "cover" }}
                    onError={() => setImageErrors(prev => ({ ...prev, [viewModal.id]: true }))}
                  />
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
                    🚗
                  </div>
                );
              })()}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><strong>Model:</strong> {viewModal.model}</div>
              <div><strong>Year:</strong> {viewModal.year}</div>
              <div><strong>Category:</strong> {viewModal.category}</div>
              <div><strong>License Plate:</strong> {viewModal.licensePlate}</div>
              <div><strong>Fuel Type:</strong> {viewModal.fuelType}</div>
              <div><strong>Seating Capacity:</strong> {viewModal.seatingCapacity}</div>
              <div><strong>Transmission:</strong> {viewModal.transmission}</div>
              <div><strong>Colour:</strong> {viewModal.colour || "—"}</div>
              <div><strong>Mileage:</strong> {viewModal.mileage || "—"} km/l</div>
              <div><strong>Status:</strong> {viewModal.isAvailable ? "Available" : "Unavailable"}</div>
              <div><strong>Approval Status:</strong> {viewModal.approvalstatus}</div>
              <div><strong>Branch:</strong> {viewModal.branch_name || viewModal.branch || "—"}</div>
            </div>
            
            <div style={{ marginTop: 20, padding: 12, background: C.subtle, borderRadius: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>💰 Pricing</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>6 Hour: {fmt(viewModal.six_hr_price)}</div>
                <div>12 Hour: {fmt(viewModal.twelve_hr_price)}</div>
                <div>24 Hour: {fmt(viewModal.twentyfour_hr_price)}</div>
              </div>
            </div>
            
            <button style={{...s.btn(C.accent), marginTop: 20, width: "100%"}} onClick={() => setViewModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Car Modal */}
      {editModal && (
        <EditCarModal 
          car={editModal} 
          onClose={() => setEditModal(null)} 
          onSave={handleCarUpdated}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: BRANCH BOOKINGS
// ─────────────────────────────────────────────────────────────────────────
function BranchBookingsSection({ toast }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalBookings: 0, totalRevenue: 0, completedBookings: 0 });
  const [filterStatus, setFilterStatus] = useState("all");
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    apiGet("/roleauth/get_branches_revenue", { withAuth: true })
      .then(res => setBranches(Array.isArray(res) ? res : []))
      .catch(err => console.error("Failed to load branches:", err));
  }, []);

  const fetchBookings = async () => {
    if (!selectedBranch) {
      toast("Please select a branch", "error");
      return;
    }
    setLoading(true);
    try {
      const url = `/bookingApi/getBranchBookingsByDate?branchId=${selectedBranch}&date=${selectedDate}`;
      const res = await apiGet(url, { withAuth: true });
      const bookingsData = Array.isArray(res?.data) ? res.data : [];
      setBookings(bookingsData);

      const totalRevenue = bookingsData.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
      const completedBookings = bookingsData.filter(b => b.system_status === "completed").length;
      setSummary({
        totalBookings: bookingsData.length,
        totalRevenue: totalRevenue,
        completedBookings: completedBookings,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast(error.message || "Failed to fetch bookings", "error");
      setBookings([]);
      setSummary({ totalBookings: 0, totalRevenue: 0, completedBookings: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      fetchBookings();
    }
  }, [selectedBranch, selectedDate]);

  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus === "all") return true;
    const status = (booking.system_status || "").toLowerCase();
    if (filterStatus === "completed") return status === "completed";
    if (filterStatus === "active") return status !== "completed" && status !== "cancelled";
    if (filterStatus === "cancelled") return status === "cancelled";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={s.card}>
        <div style={s.sectionTitle}>Branch Bookings Viewer</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Select Branch *
            </div>
            <select
              style={{ ...s.select, width: "100%" }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">-- Choose a branch --</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.city || "Unknown"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Select Date
            </div>
            <input
              type="date"
              style={{ ...s.input, width: "100%" }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button style={s.btn(C.accent)} onClick={fetchBookings} disabled={!selectedBranch}>
            Apply Filter
          </button>
        </div>
      </div>

      {selectedBranch && (
        <>
          <div style={s.grid(3)}>
            <StatCard label="Total Bookings" value={fmtNum(summary.totalBookings)} color={C.accent} icon="📅" />
            <StatCard label="Total Revenue" value={fmt(summary.totalRevenue)} color={C.green} icon="💰" />
            <StatCard label="Completed Bookings" value={fmtNum(summary.completedBookings)} color={C.cyan} icon="✅" />
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={s.sectionTitle}>Booking Details</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["all", "active", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    style={s.btn(filterStatus === status ? C.accent : C.muted, filterStatus !== status)}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>
                No bookings found for this branch on {selectedDate}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Image", "Booking ID", "Car", "Customer", "Mobile", "Pickup", "Dropoff", "Amount", "Status", "Live Status", "Payment"].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b, i) => {
                      const imageUrl = getCarImageUrl(b);
                      const hasError = imageErrors[b.booking_id || b.id];
                      
                      return (
                        <tr key={b.booking_id || i}>
                          <td style={s.td}>
                            {imageUrl && !hasError ? (
                              <img 
                                src={imageUrl} 
                                alt={b.car_model}
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                  cursor: "pointer"
                                }}
                                onError={() => setImageErrors(prev => ({ ...prev, [b.booking_id || b.id]: true }))}
                                onClick={() => window.open(imageUrl, "_blank")}
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
                                fontSize: "24px"
                              }}>
                                🚗
                              </div>
                            )}
                          </td>
                          <td style={s.td}>#{b.booking_id || b.id || i + 1}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{b.car_model || "—"}</td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 600 }}>{b.customer_name || "—"}</div>
                            <small style={{ color: C.muted }}>{b.customer_phone || ""}</small>
                          </td>
                          <td style={{ ...s.td, color: C.muted }}>{b.customer_phone || "—"}</td>
                          <td style={s.td}>{fmtDateTime(b.pickupDate)}</td>
                          <td style={s.td}>{fmtDateTime(b.dropoffDate)}</td>
                          <td style={{ ...s.td, color: C.green, fontWeight: 600 }}>{fmt(b.totalPrice)}</td>
                          <td style={s.td}>
                            <span style={s.badge(
                              b.system_status === "completed" ? C.green :
                              b.system_status === "cancelled" ? C.red : C.amber
                            )}>
                              {b.system_status || "pending"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={s.tag(
                              b.live_status === "Ride Started" ? C.purple :
                              b.live_status === "Ride Ended" ? C.green :
                              b.live_status === "Upcoming" ? C.accent : C.muted
                            )}>
                              {b.live_status || "—"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(b.payment_status === "paid" ? C.green : C.amber)}>
                              {b.payment_status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION: FINANCIALS
// ─────────────────────────────────────────────────────────────────────────
function FinancialsSection({ toast }) {
  const [finances, setFinances] = useState(null);
  const [ownerLedger, setOwnerLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, o] = await Promise.all([
        apiGet("/roleauth/getSuperAdminFinances", { withAuth: true }),
        apiGet("/roleauth/getFinancial", { withAuth: true, query: filterBranch ? { branchid: filterBranch } : {} }),
      ]);
      setFinances(f?.data);
      setOwnerLedger(Array.isArray(o?.data) ? o.data : []);
    } catch (error) {
      console.error("Error loading financials:", error);
      toast?.(error.message || "Failed to load financial data", "error");
    }
    setLoading(false);
  }, [filterBranch, toast]);

  useEffect(() => { load(); }, [load]);

  const openBreakdown = async (row) => {
    setPayModal(row);
    try {
      const res = await apiGet(`/roleauth/getOwnerPendingBreakdown/${row.ownerid}`, { 
        withAuth: true, 
        query: { branchId: row.branchId } 
      });
      setBreakdown(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading breakdown:", error);
      toast?.(error.message || "Failed to load breakdown", "error");
      setBreakdown([]);
    }
  };

  const handleMarkPaid = async () => {
    if (!payModal || !breakdown.length) {
      toast("No pending payments to process", "error");
      return;
    }

    setProcessingPayment(true);
    try {
      const bookingIds = breakdown.map(item => item.booking_id);
      
      const payload = {
        ownerId: payModal.ownerid,
        branchId: payModal.branchId,
        bookingIds: bookingIds,
        deductionAmount: 0,
        reason: null
      };
      
      const response = await apiPost("/roleauth/processOwnerPayout", payload, { withAuth: true });
      
      if (response) {
        toast("Payment processed successfully!", "success");
        setPayModal(null);
        setBreakdown([]);
        load();
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast(error.message || "Failed to process payment", "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {finances && (
        <div style={s.grid(3)}>
          <StatCard label="Gross Revenue" value={fmt(finances.total_gross_revenue)} color={C.green} icon="💰" />
          <StatCard label="Net Profit" value={fmt(finances.total_profit)} color={C.cyan} icon="📊" />
          <StatCard label="Pending Owner Dues" value={fmt(finances.total_pending_dues)} color={C.amber} icon="⏳" />
          <StatCard label="Total Owner Payouts (Paid)" value={fmt(finances.total_owner_payouts)} color={C.text} icon="✅" />
          <StatCard label="Branch Payouts" value={fmt(finances.total_branch_payouts)} color={C.purple} icon="🏢" />
        </div>
      )}

      <div style={s.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <div style={s.sectionTitle}>Owner Pending Payouts</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input 
              style={{...s.input, width:160}} 
              placeholder="Branch ID filter" 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)} 
            />
            <button style={s.btn(C.accent, true)} onClick={load}>Apply</button>
          </div>
        </div>
        {loading ? (
          <div style={{color:C.muted, padding:20, textAlign:"center"}}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Owner","Phone","Bookings","Total Payable","Trips","Actions"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ownerLedger.map((r, i) => (
                  <tr key={i}>
                    <td style={{...s.td, fontWeight:600}}>{r.owner_name}</td>
                    <td style={{...s.td, color:C.muted}}>{r.owner_phone}</td>
                    <td style={s.td}>{r.total_bookings}</td>
                    <td style={{...s.td, color:C.amber, fontWeight:600}}>{fmt(r.total_payable)}</td>
                    <td style={s.td}>{r.total_trips}</td>
                    <td style={s.td}>
                      <button style={s.btn(C.green, true)} onClick={() => openBreakdown(r)}>View & Pay</button>
                    </td>
                  </tr>
                ))}
                {ownerLedger.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{...s.td, color:C.muted, textAlign:"center"}}>No pending payouts</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payModal && (
        <div style={s.modal} onClick={() => setPayModal(null)}>
          <div style={{...s.modalBox, maxWidth: 800}} onClick={e => e.stopPropagation()}>
            <div style={s.sectionTitle}>Owner Payout Details - {payModal.owner_name}</div>
            
            <div style={{ marginBottom: 16, padding: 12, background: C.subtle, borderRadius: 6 }}>
              <div>Total Payable: <strong style={{ color: C.amber }}>{fmt(payModal.total_payable)}</strong></div>
              <div>Bookings: {payModal.total_bookings} | Trips: {payModal.total_trips}</div>
            </div>
            
            {breakdown.length > 0 && (
              <div style={{ overflowX: "auto", maxHeight: "50vh" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Booking ID", "Car", "Trip Amount", "Owner Share", "Date"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((b, i) => (
                      <tr key={i}>
                        <td style={s.td}>#{b.booking_id}</td>
                        <td style={s.td}>{b.car_model}</td>
                        <td style={s.td}>{fmt(b.trip_amount)}</td>
                        <td style={{...s.td, color: C.amber}}>{fmt(b.owner_share)}</td>
                        <td style={s.td}>{fmtDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={s.btn(C.green)} onClick={handleMarkPaid}>Mark as Paid</button>
              <button style={s.btn(C.muted, true)} onClick={() => setPayModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"overview",  label:"Overview",   icon:"◈" },
  { id:"users",     label:"Users",      icon:"◉" },
  { id:"management",label:"Management", icon:"◍" },
  { id:"branches",  label:"Branches",   icon:"◆" },
  { id:"cars",      label:"Cars",       icon:"◗" },
  { id:"bookings",  label:"Bookings",   icon:"📅" },
  { id:"financials",label:"Financials", icon:"◈" },
];

export default function SuperAdminDashboard() {
  const [active, setActive] = useState("overview");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => setToast({ msg, type });

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background: #0B0F1A; }
        ::-webkit-scrollbar-thumb { background: #1E2A3A; border-radius:3px; }
        button:hover { opacity:.85; }
        input:focus, select:focus { border-color:#3B82F6 !important; }
      `}</style>

      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoText}>CAR24</div>
          <div style={s.logoSub}>Super Admin</div>
        </div>
        {NAV.map(n => (
          <div key={n.id} style={s.navItem(active === n.id)} onClick={() => setActive(n.id)}>
            <span style={{ fontSize:14, opacity:.7 }}>{n.icon}</span>
            {n.label}
          </div>
        ))}
        <div style={{ marginTop:"auto", padding:"12px 20px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, letterSpacing:2, textTransform:"uppercase" }}>Session</div>
          <div style={{ fontSize:11, color:C.text, marginTop:4 }}>
            {new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>{NAV.find(n => n.id === active)?.label}</div>
          </div>
          <div style={s.pill}>
            <span style={{ color:C.green, fontSize:8 }}>●</span>
            Live
          </div>
        </div>

        {active === "overview" && <OverviewSection toast={showToast} />}
        {active === "users" && <UsersSection />}
        {active === "management" && <ManagementSection toast={showToast} />}
        {active === "branches" && <BranchesSection toast={showToast} />}
        {active === "cars" && <CarsSection toast={showToast} />}
        {active === "bookings" && <BranchBookingsSection toast={showToast} />}
        {active === "financials" && <FinancialsSection toast={showToast} />}
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}