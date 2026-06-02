import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost, getToken,API_BASE } from "../api.js";
import { carImageUrl, PLACEHOLDER } from "../utils/carImage.js";
import { slotsFromBookingWindow } from "../lib/slots.js";
import "./CarDetail.css";
import "./BookingPanel.css";

const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

function DocumentUploadModal({ isOpen, onClose, onDocumentsUploaded, customerDetails, setCustomerDetails }) {
  const [selectedFiles, setSelectedFiles] = useState({
    license: null,
    aadhar: null,
    profile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (type, file) => {
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.license || !selectedFiles.aadhar) {
      setUploadError("Please upload both Driving License and Aadhar Card");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("license", selectedFiles.license);
      formData.append("aadhar", selectedFiles.aadhar);
      if (selectedFiles.profile) {
        formData.append("profile", selectedFiles.profile);
      }
      
      // Add customer details
      formData.append("name", customerDetails.name);
      formData.append("email", customerDetails.email);
      formData.append("phone", customerDetails.phone);
      formData.append("address", customerDetails.address);

      const token = getToken();
      const response = await fetch(`${API_BASE}/user/uploadDocuments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccess(true);
        setTimeout(() => {
          onDocumentsUploaded(data);
          onClose();
        }, 1500);
      } else {
        const error = await response.json();
        setUploadError(error.message || "Upload failed");
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h2>📄 Upload Required Documents</h2>
          <button className="doc-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="doc-modal-body">
          <div className="doc-info-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Please upload your documents to complete the booking. Your documents are secure and encrypted.</p>
          </div>

          {/* Customer Details Section */}
          <div className="doc-customer-details">
            <h3>Customer Details</h3>
            <div className="doc-form-row">
              <div className="doc-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="doc-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <div className="doc-form-row">
              <div className="doc-form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="doc-form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="doc-upload-section">
            <h3>Required Documents</h3>
            
            <div className="doc-upload-item">
              <div className="doc-upload-label">
                <span className="required-star">*</span> Driving License
              </div>
              <div className="doc-upload-area">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange("license", e.target.files[0])}
                  style={{ display: "none" }}
                  id="license-upload"
                />
                <label htmlFor="license-upload" className="doc-upload-btn">
                  {selectedFiles.license ? "✓ License Selected" : "📄 Choose License"}
                </label>
                {selectedFiles.license && (
                  <span className="doc-filename">{selectedFiles.license.name}</span>
                )}
              </div>
            </div>

            <div className="doc-upload-item">
              <div className="doc-upload-label">
                <span className="required-star">*</span> Aadhar Card
              </div>
              <div className="doc-upload-area">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange("aadhar", e.target.files[0])}
                  style={{ display: "none" }}
                  id="aadhar-upload"
                />
                <label htmlFor="aadhar-upload" className="doc-upload-btn">
                  {selectedFiles.aadhar ? "✓ Aadhar Selected" : "🆔 Choose Aadhar"}
                </label>
                {selectedFiles.aadhar && (
                  <span className="doc-filename">{selectedFiles.aadhar.name}</span>
                )}
              </div>
            </div>

            <div className="doc-upload-item">
              <div className="doc-upload-label">
                Profile Photo (Optional)
              </div>
              <div className="doc-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("profile", e.target.files[0])}
                  style={{ display: "none" }}
                  id="profile-upload"
                />
                <label htmlFor="profile-upload" className="doc-upload-btn doc-upload-btn-secondary">
                  {selectedFiles.profile ? "✓ Photo Selected" : "📸 Upload Photo"}
                </label>
                {selectedFiles.profile && (
                  <span className="doc-filename">{selectedFiles.profile.name}</span>
                )}
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="doc-error">
              <span>⚠️</span> {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="doc-success">
              <span>✅</span> Documents uploaded successfully! Redirecting...
            </div>
          )}
        </div>

        <div className="doc-modal-footer">
          <button className="doc-cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="doc-upload-submit" 
            onClick={handleUpload}
            disabled={uploading || !selectedFiles.license || !selectedFiles.aadhar || !customerDetails.name || !customerDetails.email || !customerDetails.phone}
          >
            {uploading ? "Uploading..." : "Upload & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Update the BookingPanel component to trigger document upload
// function BookingPanel({ car, isLoggedIn, onBook, bookingBusy, bookingErr, booking, copyOtpToClipboard, agreedToPolicy, setAgreedToPolicy }) {
//   const [showDocModal, setShowDocModal] = useState(false);
//   const [pendingBookingData, setPendingBookingData] = useState(null);
//   const [customerDetails, setCustomerDetails] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: ""
//   });
//   const [documentsUploaded, setDocumentsUploaded] = useState(false);

//   // Rest of your existing state and functions...
//   const [pickup, setPickup] = useState("");
//   const [selectedSlotKey, setSelectedSlotKey] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [useCredits, setUseCredits] = useState(false);
//   const [validationErr, setValidationErr] = useState("");
//   const [showCalendarModal, setShowCalendarModal] = useState(false);
//   const [tempSelectedDate, setTempSelectedDate] = useState(null);
//   const [tempSelectedSlot, setTempSelectedSlot] = useState(null);
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   // Check if documents are already uploaded
//   useEffect(() => {
//     const checkDocuments = async () => {
//       try {
//         const token = getToken();
//         if (token) {
//           const response = await fetch(`${API_BASE}/user/checkDocuments`, {
//             headers: { "Authorization": `Bearer ${token}` }
//           });
//           if (response.ok) {
//             const data = await response.json();
//             setDocumentsUploaded(data.hasDocuments);
//           }
//         }
//       } catch (err) {
//         console.error("Failed to check documents:", err);
//       }
//     };
//     if (isLoggedIn) {
//       checkDocuments();
//     }
//   }, [isLoggedIn]);

//   // Helper functions (keep your existing ones)
//   const formatTime = (date) => {
//     return date.toLocaleString("en-IN", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   const getSlotsForDate = (date) => {
//     if (!pickupDate) return [];
//     const slots = [];
//     const targetDate = new Date(date);
//     targetDate.setHours(0, 0, 0, 0);
//     const pickup = new Date(pickupDate);
//     const pickupDay = new Date(pickup);
//     pickupDay.setHours(0, 0, 0, 0);
//     const diffDays = Math.round((targetDate - pickupDay) / (1000 * 60 * 60 * 24));
//     if (diffDays < 0 || diffDays > 30) return [];
//     if (diffDays === 0) {
//       const sixHour = new Date(pickup.getTime() + 6 * 60 * 60 * 1000);
//       const twelveHour = new Date(pickup.getTime() + 12 * 60 * 60 * 1000);
//       slots.push({
//         key: `0-6h`,
//         hours: 6,
//         time: sixHour,
//         displayTime: formatTime(sixHour),
//         label: "+6 hrs",
//         shortLabel: "+6h",
//         price: calculatePrice(car, 6)?.basePrice,
//       });
//       slots.push({
//         key: `0-12h`,
//         hours: 12,
//         time: twelveHour,
//         displayTime: formatTime(twelveHour),
//         label: "+12 hrs",
//         shortLabel: "+12h",
//         price: calculatePrice(car, 12)?.basePrice,
//       });
//       return slots;
//     }
//     const pickupHours = pickup.getHours();
//     const pickupMinutes = pickup.getMinutes();
//     const createSlot = (extraHours, label, shortLabel) => {
//       const slotTime = new Date(targetDate);
//       slotTime.setHours(pickupHours + extraHours, pickupMinutes, 0, 0);
//       const totalHours = diffDays * 24 + extraHours;
//       return {
//         key: `${diffDays}-${extraHours}h`,
//         hours: totalHours,
//         time: slotTime,
//         displayTime: formatTime(slotTime),
//         label,
//         shortLabel,
//         price: calculatePrice(car, totalHours)?.basePrice,
//       };
//     };
//     slots.push(createSlot(0, diffDays === 1 ? "+1 day" : `+${diffDays} days`, diffDays === 1 ? "+1d" : `+${diffDays}d`));
//     slots.push(createSlot(6, diffDays === 1 ? "+1 day +6 hrs" : `+${diffDays} days +6 hrs`, diffDays === 1 ? "+1d 6h" : `+${diffDays}d 6h`));
//     slots.push(createSlot(12, diffDays === 1 ? "+1 day +12 hrs" : `+${diffDays} days +12 hrs`, diffDays === 1 ? "+1d 12h" : `+${diffDays}d 12h`));
//     return slots;
//   };

//   const pickupDate = pickup ? new Date(pickup) : null;
//   const selectedSlotData = selectedDate && selectedSlotKey ? getSlotsForDate(selectedDate).find(s => s.key === selectedSlotKey) : null;
//   const dropoffDate = selectedSlotData ? selectedSlotData.time : null;
//   const diffHours = dropoffDate && pickupDate ? (dropoffDate - pickupDate) / 3_600_000 : null;
//   const priceResult = diffHours && diffHours >= 6 ? calculatePrice(car, diffHours) : null;
//   const advanceAmt = priceResult ? estimateAdvance(priceResult.basePrice, diffHours) : null;

//   function calculatePrice(car, hours) {
//     if (!car || hours == null || hours <= 0) return null;
//     if (hours <= 6) {
//       return { basePrice: Number(car.six_hr_price), durationLabel: "Up to 6 hours", hours };
//     }
//     if (hours <= 12) {
//       return { basePrice: Number(car.twelve_hr_price), durationLabel: "Up to 12 hours", hours };
//     }
//     const fullDays = Math.floor(hours / 24);
//     const remainingHrs = hours % 24;
//     let total = fullDays * Number(car.twentyfour_hr_price);
//     if (remainingHrs > 0) {
//       total += (Number(car.twentyfour_hr_price) / 24) * remainingHrs;
//     }
//     total = Math.max(total, Number(car.six_hr_price));
//     const label = fullDays > 0
//       ? `${fullDays} day${fullDays > 1 ? "s" : ""}${remainingHrs > 0 ? ` + ${Math.round(remainingHrs)} hr${remainingHrs !== 1 ? "s" : ""}` : ""}`
//       : `${Math.round(hours)} hours`;
//     return { basePrice: Math.round(total), durationLabel: label, hours, fullDays, remainingHours: remainingHrs };
//   }

//   function estimateAdvance(basePrice, hours) {
//     let rem = hours;
//     let advance = 0;
//     const days = Math.floor(rem / 24); advance += days * 500; rem -= days * 24;
//     const halfs = Math.floor(rem / 12); advance += halfs * 500; rem -= halfs * 12;
//     const sixs = Math.floor(rem / 6); advance += sixs * 400;
//     return advance > 0 ? advance : Math.ceil(basePrice * 0.3);
//   }

//   const handleSubmitWrapper = (e) => {
//     e.preventDefault();
//     if (!pickup) { setValidationErr("Please select a pickup date & time."); return; }
//     if (!selectedSlotKey) { setValidationErr("Please select a drop-off date & time."); return; }
//     if (!dropoffDate) { setValidationErr("Please select a valid drop-off time."); return; }
//     if (dropoffDate <= pickupDate) { setValidationErr("Drop-off must be after pickup."); return; }
//     if (!diffHours || diffHours < 6) { setValidationErr("Minimum rental duration is 6 hours."); return; }
//     if (diffHours > 720) { setValidationErr("Maximum rental duration is 30 days."); return; }
//     if (!agreedToPolicy) {
//       setValidationErr("Please read and agree to the cancellation policy before booking.");
//       return;
//     }
//     setValidationErr("");

//     // Check if documents are uploaded
//     if (!documentsUploaded) {
//       // Store booking data and show document modal
//       setPendingBookingData({ pickup, dropoff: dropoffDate.toISOString(), priceResult, advanceAmt, useCredits });
//       setShowDocModal(true);
//     } else {
//       // Proceed with booking
//       onBook({ pickup, dropoff: dropoffDate.toISOString(), priceResult, advanceAmt, useCredits });
//     }
//   };

//   const handleDocumentsUploaded = () => {
//     setDocumentsUploaded(true);
//     if (pendingBookingData) {
//       onBook(pendingBookingData);
//       setPendingBookingData(null);
//     }
//   };

//   // Rest of your JSX remains the same, but add the modal at the end
//   return (
//     <>
//       {/* Your existing JSX here */}
//       <section className="bp-root">
//         {/* ... keep all your existing JSX ... */}
//       </section>

//       {/* Document Upload Modal */}
//       <DocumentUploadModal
//         isOpen={showDocModal}
//         onClose={() => {
//           setShowDocModal(false);
//           setPendingBookingData(null);
//         }}
//         onDocumentsUploaded={handleDocumentsUploaded}
//         customerDetails={customerDetails}
//         setCustomerDetails={setCustomerDetails}
//       />
//     </>
//   );
// }

// Add CSS for the document upload modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
  .doc-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .doc-modal-content {
    background: white;
    border-radius: 24px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
  }

  .doc-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 24px 24px 0 0;
  }

  .doc-modal-header h2 {
    margin: 0;
    font-size: 20px;
  }

  .doc-modal-close {
    background: rgba(255,255,255,0.2);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
  }

  .doc-modal-close:hover {
    background: rgba(255,255,255,0.3);
    transform: rotate(90deg);
  }

  .doc-modal-body {
    padding: 24px;
  }

  .doc-info-banner {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    background: #f0fdf4;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #166534;
  }

  .doc-customer-details h3,
  .doc-upload-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #1e293b;
  }

  .doc-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .doc-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .doc-form-group label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  .doc-form-group input {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .doc-form-group input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .doc-upload-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .doc-upload-item {
    margin-bottom: 20px;
  }

  .doc-upload-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .required-star {
    color: #ef4444;
    margin-right: 4px;
  }

  .doc-upload-area {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .doc-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .doc-upload-btn:hover {
    background: #e2e8f0;
  }

  .doc-upload-btn-secondary {
    background: #f8fafc;
  }

  .doc-filename {
    font-size: 12px;
    color: #64748b;
  }

  .doc-error {
    background: #fee2e2;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .doc-success {
    background: #d1fae5;
    color: #065f46;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .doc-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 24px 24px;
  }

  .doc-cancel-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }

  .doc-upload-submit {
    padding: 10px 24px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .doc-upload-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .doc-form-row {
      grid-template-columns: 1fr;
    }
    
    .doc-modal-content {
      max-width: 95%;
    }
  }
`;
document.head.appendChild(modalStyles);

/* ═══════════════════════════════════════════════════════════════
   PRICE HELPERS
═══════════════════════════════════════════════════════════════ */

function calculatePrice(car, hours) {
  if (!car || hours == null || hours <= 0) return null;

  if (hours <= 6) {
    return {
      basePrice: Number(car.six_hr_price),
      durationLabel: "Up to 6 hours",
      hours,
    };
  }

  if (hours <= 12) {
    return {
      basePrice: Number(car.twelve_hr_price),
      durationLabel: "Up to 12 hours",
      hours,
    };
  }

  const fullDays = Math.floor(hours / 24);
  const remainingHrs = hours % 24;
  let total = fullDays * Number(car.twentyfour_hr_price);

  if (remainingHrs > 0) {
    total += (Number(car.twentyfour_hr_price) / 24) * remainingHrs;
  }

  total = Math.max(total, Number(car.six_hr_price));

  const label =
    fullDays > 0
      ? `${fullDays} day${fullDays > 1 ? "s" : ""}${
          remainingHrs > 0
            ? ` + ${Math.round(remainingHrs)} hr${remainingHrs !== 1 ? "s" : ""}`
            : ""
        }`
      : `${Math.round(hours)} hours`;

  return {
    basePrice: Math.round(total),
    durationLabel: label,
    hours,
    fullDays,
    remainingHours: remainingHrs,
  };
}

function estimateAdvance(basePrice, hours) {
  let rem = hours;
  let advance = 0;
  const days = Math.floor(rem / 24); advance += days * 500; rem -= days * 24;
  const halfs = Math.floor(rem / 12); advance += halfs * 500; rem -= halfs * 12;
  const sixs = Math.floor(rem / 6); advance += sixs * 400;
  return advance > 0 ? advance : Math.ceil(basePrice * 0.3);
}

/* ═══════════════════════════════════════════════════════════════
   DATE / TIME FORMATTERS
═══════════════════════════════════════════════════════════════ */

function fmtDateTime(date) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(hours) {
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  if (d === 0) return `${hours.toFixed(1)} hours`;
  if (h === 0) return `${d} day${d > 1 ? "s" : ""}`;
  return `${d} day${d > 1 ? "s" : ""} ${h.toFixed(1)} hrs`;
}

function toDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ═══════════════════════════════════════════════════════════════
   BOOKING PANEL
═══════════════════════════════════════════════════════════════ */

function BookingPanel({ car, isLoggedIn, onBook, bookingBusy, bookingErr, booking, copyOtpToClipboard, agreedToPolicy, setAgreedToPolicy }) {
  const [pickup, setPickup] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [useCredits, setUseCredits] = useState(false);
  const [validationErr, setValidationErr] = useState("");
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(null);
  const [tempSelectedSlot, setTempSelectedSlot] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const pickupDate = pickup ? new Date(pickup) : null;

  const formatTime = (date) => {
    return date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

 const getSlotsForDate = (date) => {
  if (!pickupDate) return [];

  const slots = [];

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const pickup = new Date(pickupDate);

  const pickupDay = new Date(pickup);
  pickupDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (targetDate - pickupDay) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0 || diffDays > 30) return [];

  if (diffDays === 0) {
    const sixHour = new Date(pickup.getTime() + 6 * 60 * 60 * 1000);
    const twelveHour = new Date(pickup.getTime() + 12 * 60 * 60 * 1000);

    // Check if 12hr dropoff crosses into next day
    const sixHourDay = new Date(sixHour);
    sixHourDay.setHours(0, 0, 0, 0);
    const twelveHourDay = new Date(twelveHour);
    twelveHourDay.setHours(0, 0, 0, 0);

    const sixCrossesDay = sixHourDay.getTime() !== pickupDay.getTime();
    const twelveCrossesDay = twelveHourDay.getTime() !== pickupDay.getTime();

    slots.push({
      key: `0-6h`,
      hours: 6,
      time: sixHour,
      displayTime: formatTime(sixHour),
      // Add "Next day" prefix if it crosses midnight
      label: sixCrossesDay ? "+6 hrs (next day)" : "+6 hrs",
      shortLabel: sixCrossesDay ? "+6h →" : "+6h",
      price: calculatePrice(car, 6)?.basePrice,
    });

    slots.push({
      key: `0-12h`,
      hours: 12,
      time: twelveHour,
      displayTime: formatTime(twelveHour),
      label: twelveCrossesDay ? "+12 hrs (next day)" : "+12 hrs",
      shortLabel: twelveCrossesDay ? "+12h →" : "+12h",
      price: calculatePrice(car, 12)?.basePrice,
    });

    return slots;
  }

  // FUTURE DAYS — unchanged
  const pickupHours = pickup.getHours();
  const pickupMinutes = pickup.getMinutes();

  const createSlot = (extraHours, label, shortLabel) => {
    const slotTime = new Date(targetDate);
    slotTime.setHours(pickupHours + extraHours, pickupMinutes, 0, 0);
    const totalHours = diffDays * 24 + extraHours;
    return {
      key: `${diffDays}-${extraHours}h`,
      hours: totalHours,
      time: slotTime,
      displayTime: formatTime(slotTime),
      label,
      shortLabel,
      price: calculatePrice(car, totalHours)?.basePrice,
    };
  };

  slots.push(createSlot(0, diffDays === 1 ? "+1 day" : `+${diffDays} days`, diffDays === 1 ? "+1d" : `+${diffDays}d`));
  slots.push(createSlot(6, diffDays === 1 ? "+1 day +6 hrs" : `+${diffDays} days +6 hrs`, diffDays === 1 ? "+1d 6h" : `+${diffDays}d 6h`));
  slots.push(createSlot(12, diffDays === 1 ? "+1 day +12 hrs" : `+${diffDays} days +12 hrs`, diffDays === 1 ? "+1d 12h" : `+${diffDays}d 12h`));

  return slots;
};

  const hasAvailableSlots = (date) => {
    return getSlotsForDate(date).length > 0;
  };

  const getDateLabel = (date) => {
    if (!pickupDate) return "";
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const pickupDay = new Date(pickupDate);
    pickupDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((compareDate - pickupDay) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return "";
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateSelectable = (date) => {
    if (!date || !pickupDate) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const pickupDay = new Date(pickupDate);
    pickupDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((compareDate - pickupDay) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30 && hasAvailableSlots(date);
  };

  const handleDateSelect = (date) => {
    if (isDateSelectable(date)) setTempSelectedDate(date);
  };

  const handlePickupChange = (e) => {
    setPickup(e.target.value);
    setSelectedSlotKey(null);
    setSelectedDate(null);
    setValidationErr("");
  };

  const openCalendarModal = () => {
    setShowCalendarModal(true);
    setTempSelectedDate(selectedDate);
    setTempSelectedSlot(selectedSlotKey);
    setCurrentMonth(pickupDate || new Date());
  };

  const closeCalendarModal = () => {
    setShowCalendarModal(false);
    setTempSelectedDate(null);
    setTempSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setTempSelectedSlot(slot.key);
  };

  const confirmSelection = () => {
    if (tempSelectedDate && tempSelectedSlot) {
      setSelectedDate(tempSelectedDate);
      setSelectedSlotKey(tempSelectedSlot);
      setValidationErr("");
      const slots = getSlotsForDate(tempSelectedDate);
      const selectedSlotData = slots.find((s) => s.key === tempSelectedSlot);
      if (selectedSlotData) {
        const diffHours = selectedSlotData.hours;
        if (diffHours < 6) setValidationErr("Minimum rental duration is 6 hours.");
        else if (diffHours > 720) setValidationErr("Maximum rental duration is 30 days.");
      }
    }
    closeCalendarModal();
  };

  const getSelectedSlotData = () => {
    if (!selectedDate || !selectedSlotKey) return null;
    return getSlotsForDate(selectedDate).find((s) => s.key === selectedSlotKey);
  };

  const selectedSlotData = getSelectedSlotData();
  const dropoffDate = selectedSlotData ? selectedSlotData.time : null;
  const diffHours = dropoffDate && pickupDate ? (dropoffDate - pickupDate) / 3_600_000 : null;
  const priceResult = diffHours && diffHours >= 6 ? calculatePrice(car, diffHours) : null;
  const advanceAmt = priceResult ? estimateAdvance(priceResult.basePrice, diffHours) : null;
  const hasSummary = !!(priceResult && advanceAmt);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pickup) { setValidationErr("Please select a pickup date & time."); return; }
    if (!selectedSlotKey) { setValidationErr("Please select a drop-off date & time."); return; }
    if (!dropoffDate) { setValidationErr("Please select a valid drop-off time."); return; }
    if (dropoffDate <= pickupDate) { setValidationErr("Drop-off must be after pickup."); return; }
    if (!diffHours || diffHours < 6) { setValidationErr("Minimum rental duration is 6 hours."); return; }
    if (diffHours > 720) { setValidationErr("Maximum rental duration is 30 days."); return; }
    if (!agreedToPolicy) {
      setValidationErr("Please read and agree to the cancellation policy before booking.");
      return;
    }
    setValidationErr("");
    onBook({ pickup, dropoff: dropoffDate.toISOString(), priceResult, advanceAmt, useCredits });
  };

  const getSlotPrice = (price) => (price ? `\u20B9${price.toLocaleString("en-IN")}` : "");

  const getSelectedDisplay = () => {
  if (!selectedSlotData || !selectedDate) return "Not selected";

  const actualDropoff = selectedSlotData.time;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dropDate = new Date(actualDropoff);
  dropDate.setHours(0, 0, 0, 0);

  let dayLabel = "";
  if (dropDate.getTime() === today.getTime()) {
    dayLabel = "Today";
  } else if (dropDate.getTime() === tomorrow.getTime()) {
    // ✅ Now correctly labels 2am the next day as "Tomorrow"
    dayLabel = "Tomorrow";
  }

  const formattedDate = actualDropoff.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: actualDropoff.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  const formattedTime = actualDropoff.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dayLabel ? dayLabel + " • " : ""}${formattedDate} at ${formattedTime} (${selectedSlotData.label})`;
};

  const CalendarModal = () => {
    const calendarDays = generateCalendarDays();
    const selectedSlots = tempSelectedDate ? getSlotsForDate(tempSelectedDate) : [];

    return (
     <div
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  }}
  onClick={closeCalendarModal}
>
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      width: "100%",
      maxWidth: "920px",
      maxHeight: "92vh",
      overflowY: "auto",
      background: "#ffffff",
      borderRadius: "28px",
      boxShadow: "0 25px 80px rgba(15,23,42,0.25)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}
  >
    {/* HEADER */}
    <div
      style={{
        padding: "24px 28px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg,#06b6d4 0%, #0ea5e9 50%, #2563eb 100%)",
        color: "#fff",
        borderTopLeftRadius: "28px",
        borderTopRightRadius: "28px",
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "800",
            letterSpacing: "-0.4px",
          }}
        >
          Select Drop-off Date & Time
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            opacity: 0.9,
            fontSize: "14px",
          }}
        >
          Choose your preferred return schedule
        </p>
      </div>

      <button
        onClick={closeCalendarModal}
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "14px",
          border: "none",
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        &times;
      </button>
    </div>

    {/* BODY */}
    <div
      style={{
        padding: "26px",
        background:
          "linear-gradient(180deg,#f8fafc 0%, #ffffff 100%)",
      }}
    >
      {/* PICKUP INFO */}
      <div
        style={{
          padding: "16px 18px",
          borderRadius: "18px",
          background: "#ecfeff",
          border: "1px solid #bae6fd",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "linear-gradient(135deg,#06b6d4,#0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#0369a1",
            }}
          >
            Pickup Schedule
          </div>

          <div
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#0f172a",
              marginTop: "2px",
            }}
          >
            {pickupDate ? fmtDateTime(pickupDate) : "—"}
          </div>
        </div>
      </div>

      {/* CALENDAR */}
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "22px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        }}
      >
        {/* MONTH HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={goToPreviousMonth}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#0284c7",
              cursor: "pointer",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            {currentMonth.toLocaleString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button
            onClick={goToNextMonth}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#0284c7",
              cursor: "pointer",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* WEEKDAYS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                fontWeight: "700",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* DAYS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: "10px",
          }}
        >
          {calendarDays.map((date, index) => {
            const isSelectable = date && isDateSelectable(date);
            const isSelected =
              date &&
              tempSelectedDate &&
              date.toDateString() === tempSelectedDate.toDateString();

            const isToday =
              date &&
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                onClick={() => isSelectable && handleDateSelect(date)}
                style={{
                  minHeight: "78px",
                  borderRadius: "18px",
                  padding: "10px",
                  cursor: isSelectable ? "pointer" : "default",
                  background: isSelected
                    ? "linear-gradient(135deg,#06b6d4,#0ea5e9)"
                    : "#fff",
                  border: isToday
                    ? "2px solid #38bdf8"
                    : "1px solid #e2e8f0",
                  opacity: !date ? 0 : isSelectable ? 1 : 0.4,
                  color: isSelected ? "#fff" : "#0f172a",
                  transition: "0.25s ease",
                  boxShadow: isSelected
                    ? "0 12px 24px rgba(6,182,212,0.25)"
                    : "none",
                  position: "relative",
                }}
              >
                {date && (
                  <>
                    <div
                      style={{
                        fontWeight: "800",
                        fontSize: "16px",
                      }}
                    >
                      {date.getDate()}
                    </div>

                    {getDateLabel(date) && (
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: isSelected ? "#fff" : "#0891b2",
                        }}
                      >
                        {getDateLabel(date)}
                      </div>
                    )}

                    {hasAvailableSlots(date) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          background: isSelected ? "#fff" : "#06b6d4",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SLOTS */}
      {tempSelectedDate && (
        <div
          style={{
            marginTop: "24px",
            background: "#fff",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "18px",
            }}
          >
            {tempSelectedDate.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year:
                tempSelectedDate.getFullYear() !==
                new Date().getFullYear()
                  ? "numeric"
                  : undefined,
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",
              gap: "16px",
            }}
          >
            {selectedSlots.map((slot) => {
              const isSelected = tempSelectedSlot === slot.key;

              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  style={{
                    border: isSelected
                      ? "2px solid #06b6d4"
                      : "1px solid #e2e8f0",
                    background: isSelected
                      ? "linear-gradient(135deg,#ecfeff,#f0fdfa)"
                      : "#fff",
                    borderRadius: "20px",
                    padding: "18px",
                    cursor: "pointer",
                    transition: "0.25s ease",
                    boxShadow: isSelected
                      ? "0 10px 25px rgba(6,182,212,0.12)"
                      : "none",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      color: "#0f172a",
                    }}
                  >
                    {slot.displayTime}
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#0891b2",
                    }}
                  >
                    {slot.shortLabel}
                  </div>

                  <div
                    style={{
                      marginTop: "14px",
                      fontSize: "17px",
                      fontWeight: "800",
                      color: "#059669",
                    }}
                  >
                    {getSlotPrice(slot.price)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* FOOTER */}
    <div
      style={{
        padding: "22px 28px",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "flex-end",
        gap: "14px",
        background: "#fff",
        borderBottomLeftRadius: "28px",
        borderBottomRightRadius: "28px",
      }}
    >
      <button
        onClick={closeCalendarModal}
        style={{
          padding: "14px 22px",
          borderRadius: "14px",
          border: "1px solid #cbd5e1",
          background: "#fff",
          color: "#475569",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>

      <button
        onClick={confirmSelection}
        disabled={!tempSelectedDate || !tempSelectedSlot}
        style={{
          padding: "14px 24px",
          borderRadius: "14px",
          border: "none",
          background:
            !tempSelectedDate || !tempSelectedSlot
              ? "#cbd5e1"
              : "linear-gradient(135deg,#06b6d4,#0ea5e9)",
          color: "#fff",
          fontWeight: "800",
          cursor:
            !tempSelectedDate || !tempSelectedSlot
              ? "not-allowed"
              : "pointer",
          boxShadow:
            !tempSelectedDate || !tempSelectedSlot
              ? "none"
              : "0 12px 24px rgba(6,182,212,0.25)",
        }}
      >
        Confirm Selection
      </button>
    </div>
  </div>
</div>
    );
  };

  return (
    <section className="bp-root">
      <div className="bp-header">
        <div className="bp-header-left">
          <div className="bp-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="bp-title">Book this car</h2>
            <p className="bp-subtitle">
              {isLoggedIn ? (
                "Pick a time \u2014 choose your drop-off"
              ) : (
                <span>
                  Please <Link to="/login" className="bp-login-link">sign in</Link> to book
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="bp-price-badges">
          {car?.six_hr_price && (
            <div className="bp-price-badge bp-price-badge--small">
              <span className="bp-price-badge-amount">{"\u20B9"}{Number(car.six_hr_price).toLocaleString("en-IN")}</span>
              <span className="bp-price-badge-unit">/6hrs</span>
            </div>
          )}
          {car?.twelve_hr_price && (
            <div className="bp-price-badge bp-price-badge--small">
              <span className="bp-price-badge-amount">{"\u20B9"}{Number(car.twelve_hr_price).toLocaleString("en-IN")}</span>
              <span className="bp-price-badge-unit">/12hrs</span>
            </div>
          )}
          {car?.twentyfour_hr_price && (
            <div className="bp-price-badge">
              <span className="bp-price-badge-amount">{"\u20B9"}{Number(car.twentyfour_hr_price).toLocaleString("en-IN")}</span>
              <span className="bp-price-badge-unit">/day</span>
            </div>
          )}
        </div>
      </div>

      <div className="bp-trust-bar">
        <span className="bp-trust-item">
          <span className="bp-trust-dot bp-trust-dot--green" />
          Free cancellation
        </span>
        <span className="bp-trust-sep" />
        <span className="bp-trust-item">
          <span className="bp-trust-dot bp-trust-dot--blue" />
          Instant confirmation
        </span>
        <span className="bp-trust-sep" />
        <span className="bp-trust-item">
          <span className="bp-trust-dot bp-trust-dot--teal" />
          Advance payment only
        </span>
      </div>

      {isLoggedIn && (
        <form onSubmit={handleSubmit}>
          <div className="bp-body">
            <div className="bp-left">
              <div className="bp-date-field">
                <label className="bp-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Pickup date &amp; time
                </label>
                <input
                  className="bp-input"
                  type="datetime-local"
                  value={pickup}
                  onChange={handlePickupChange}
                  min={toDatetimeLocal(new Date())}
                  required
                />
              </div>

              {pickupDate && (
                <div className="bp-slot-section">
  <label
    className="bp-label"
    style={{ marginTop: 16, marginBottom: 10 }}
  >
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    Drop-off date & time
  </label>

  <button
    type="button"
    onClick={openCalendarModal}
    style={{
      width: "100%",
      border: selectedSlotData
        ? "2px solid #06b6d4"
        : "1px solid #e2e8f0",
      borderRadius: "22px",
      background: "#ffffff",
      padding: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: selectedSlotData
        ? "0 10px 30px rgba(6,182,212,0.15)"
        : "0 4px 14px rgba(0,0,0,0.05)",
      marginTop: "6px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* LEFT CONTENT */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flex: 1,
        textAlign: "left",
      }}
    >
      {/* ICON */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          background: selectedSlotData
            ? "linear-gradient(135deg,#06b6d4,#0ea5e9)"
            : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: selectedSlotData ? "#fff" : "#64748b",
          flexShrink: 0,
          transition: "0.3s ease",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      {/* TEXT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.4px",
            textTransform: "uppercase",
          }}
        >
          Drop-off Selection
        </span>

        {selectedSlotData ? (
          <>
            <span
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#0f172a",
                lineHeight: 1.5,
              }}
            >
              {getSelectedDisplay()}
            </span>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#06b6d4",
                }}
              >
                {getSlotPrice(selectedSlotData.price)}
              </span>

              <span
                style={{
                  fontSize: "12px",
                  background: "#ecfeff",
                  color: "#0891b2",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontWeight: 600,
                }}
              >
                {selectedSlotData.shortLabel}
              </span>
            </div>
          </>
        ) : (
          <span
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            Select your preferred return date & time
          </span>
        )}
      </div>
    </div>

    {/* RIGHT ICON */}
    <div
      style={{
        marginLeft: "16px",
        width: "42px",
        height: "42px",
        borderRadius: "14px",
        background: selectedSlotData ? "#ecfeff" : "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#06b6d4",
        flexShrink: 0,
        transition: "0.3s ease",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </button>
</div>
              )}

              {pickupDate && dropoffDate && priceResult && (
                <div className="bp-duration-row">
                  <div className="bp-duration-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {fmtDuration(priceResult.hours)}
                  </div>
                  <div className="bp-date-range-text">
                    <span>{fmtDateTime(pickupDate)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                    <span>{fmtDateTime(dropoffDate)}</span>
                  </div>
                </div>
              )}

              {hasSummary ? (
                <div className="bp-breakdown">
                  <div className="bp-breakdown-title">Price breakdown</div>
                  <div className="bp-breakdown-rows">
                    <div className="bp-breakdown-row">
                      <span>Base rental ({priceResult.durationLabel})</span>
                      <span>{"\u20B9"}{priceResult.basePrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="bp-breakdown-row bp-breakdown-row--total">
                      <span>Total</span>
                      <span className="bp-total-val">
                        {"\u20B9"}{priceResult.basePrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bp-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p>Select pickup &amp; drop-off<br />to see live pricing</p>
                </div>
              )}
            </div>

            <div className="bp-right">
              <div className="bp-summary">
                <div className="bp-summary-title">Booking summary</div>

                <div className="bp-advance-block">
                  <div className="bp-advance-label">Pay now (advance)</div>
                  <div className="bp-advance-amount">
                    {advanceAmt ? `\u20B9${advanceAmt.toLocaleString("en-IN")}` : "\u2014"}
                  </div>
                  <div className="bp-advance-note">
                    Remaining {"\u20B9"}{hasSummary
                      ? (priceResult.basePrice - advanceAmt).toLocaleString("en-IN")
                      : "\u2014"} paid at pickup
                  </div>
                </div>

                <div className="bp-summary-rows">
                  <div className="bp-summary-row">
                    <span>Duration</span>
                    <strong>{priceResult ? fmtDuration(priceResult.hours) : "\u2014"}</strong>
                  </div>
                  <div className="bp-summary-row">
                    <span>Pickup</span>
                    <strong>{pickupDate ? fmtDateTime(pickupDate) : "\u2014"}</strong>
                  </div>
                  <div className="bp-summary-row">
                    <span>Drop-off</span>
                    <strong>{dropoffDate ? fmtDateTime(dropoffDate) : "\u2014"}</strong>
                  </div>
                  <div className="bp-summary-row">
                    <span>Total amount</span>
                    <strong>
                      {hasSummary ? `\u20B9${priceResult.basePrice.toLocaleString("en-IN")}` : "\u2014"}
                    </strong>
                  </div>
                  <div className="bp-summary-row">
                    <span>Branch</span>
                    <strong>{car?.branch_name || "\u2014"}</strong>
                  </div>
                </div>

                {(validationErr || bookingErr) && (
                  <div className="bp-banner bp-banner--error" style={{ marginBottom: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <strong>Error</strong>
                      <p>{validationErr || bookingErr}</p>
                    </div>
                  </div>
                )}

                <label className="bp-credits-toggle">
  <input
    type="checkbox"
    checked={useCredits}
    onChange={(e) => setUseCredits(e.target.checked)}
  />
  <span className="bp-credits-text">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
    Use wallet credits
  </span>
</label>

                <div className="bp-terms-section">
                  <label className="bp-agreement-checkbox">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(e) => setAgreedToPolicy(e.target.checked)}
                    />
                    <span>
                      I confirm that I have read and agree to our{" "}
                      <Link to="/cancellation-policy" className="bp-policy-link" target="_blank">
                        cancellation policy
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="bp-cta"
                  disabled={bookingBusy || !pickup || !selectedSlotKey || !!validationErr || !agreedToPolicy}
                >
                  {bookingBusy ? (
                    <><span className="bp-spinner" /> Processing&#8230;</>
                  ) : (
                    <>
                      Confirm &amp; Pay
                      {advanceAmt ? ` \u20B9${advanceAmt.toLocaleString("en-IN")}` : ""}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {booking?.ok && (
            <div className="bp-banner bp-banner--success">
              <div className="bp-success-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="bp-success-body">
                <strong>{booking.message || "Booking confirmed!"}</strong>
                <div className="bp-success-chips">
                  {booking.bookingId && (
                    <span className="bp-chip">
                      Booking <code>#{booking.bookingId}</code>
                    </span>
                  )}
                  {booking.otp && (
                    <span className="bp-chip bp-chip--otp">
                      OTP: <code>{booking.otp}</code>
                      <button
                        type="button"
                        className="bp-copy-btn"
                        onClick={() => copyOtpToClipboard(booking.otp)}
                      >
                        Copy
                      </button>
                    </span>
                  )}
                </div>
                {booking.credits && (
                  <span className="bp-credits-badge">&#10003; Advance covered by credits</span>
                )}
                <Link to="/bookings" className="bp-view-link">
                  View booking details &rarr;
                </Link>
              </div>
            </div>
          )}
        </form>
      )}

      {showCalendarModal && <CalendarModal />}

      <div className="bp-policy-section">
  <Link
    to="/cancellation-policy"
    className="bp-policy-toggle-link"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      textDecoration: "none",
      padding: "12px 20px",
      color: "#aaa",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease"
    }}
  >
    <div className="bp-policy-toggle-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <span>Cancellation Policy</span>
    </div>
    <svg
      className="bp-policy-chevron"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{
        transition: "transform 0.2s ease",
        flexShrink: 0
      }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  </Link>
</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RAZORPAY PAYMENT HELPER
═══════════════════════════════════════════════════════════════ */

function openRazorpay(order, bookingId, { onSuccess, onFail, onDismiss }) {
  if (!window.Razorpay) {
    onFail("Razorpay script not loaded. Please refresh the page.");
    return;
  }
  if (!RZP_KEY) {
    onFail("Payment configuration missing. Please contact support.");
    return;
  }
  const rzp = new window.Razorpay({
    key: RZP_KEY,
    amount: order.amount,
    currency: order.currency || "INR",
    name: "Car24",
    description: `Booking #${bookingId} \u2014 Advance Payment`,
    order_id: order.id,
    handler: onSuccess,
    prefill: {
      email: localStorage.getItem("user_email") || "",
      contact: localStorage.getItem("user_phone") || "",
    },
    theme: { color: "#1FB6D9" },
    modal: { ondismiss: onDismiss },
  });
  rzp.on("payment.failed", (res) =>
    onFail(res?.error?.description || "Payment failed. Please try again.")
  );
  rzp.open();
}

/* ═══════════════════════════════════════════════════════════════
   MAIN CARDETAIL PAGE
═══════════════════════════════════════════════════════════════ */

export default function CarDetail() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [status, setStatus] = useState("available");

  const [booking, setBooking] = useState(null);
  const [bookingErr, setBookingErr] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(false);

  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isLoggedIn = !!getToken();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [c, br] = await Promise.all([
          apiGet(`/cars/get_car/${id}`),
          apiGet("/cars/get_branches"),
        ]);
        setCar(c);
        setStatus(c.isAvailable ? "available" : "booked");
        setBranches(Array.isArray(br) ? br : []);
      } catch (e) {
        if (!controller.signal.aborted) setErr(e.message || "Failed to load car");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  const copyOtpToClipboard = useCallback((otp) => {
    navigator.clipboard.writeText(String(otp));
    const el = document.createElement("div");
    el.className = "toast-message";
    el.textContent = "OTP copied to clipboard!";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }, []);

  const handleBook = useCallback(
    async ({ pickup, dropoff, priceResult, advanceAmt, useCredits }) => {
      setBookingErr(null);
      setBooking(null);
      if (!car) return;

      const start = new Date(pickup);
      const end = new Date(dropoff);

      setBookingBusy(true);
      try {
        const availability = await apiGet("/bookingApi/checkAvailability", {
          query: { carId: car.id, pickupDate: start.toISOString(), dropoffDate: end.toISOString() },
          withAuth: true,
        });
        if (availability?.available === false) {
          setBookingErr("This car is already booked for the selected time. Please choose different dates.");
          setBookingBusy(false);
          return;
        }

        const slots = slotsFromBookingWindow(start.toISOString(), end.toISOString());
        const branchId = car.branchId;
        if (!branchId) {
          setBookingErr("Branch information is missing. Please refresh.");
          setBookingBusy(false);
          return;
        }

        const res = await apiPost(
          "/bookingApi/bookCar",
          {
            carId: car.id,
            branchId,
            slots,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            useCredits,
            calculatedPrice: priceResult?.basePrice,
          },
          { withAuth: true }
        );

        if (res.order == null || res.advancePayable === 0) {
          setBooking({
            ok: true,
            bookingId: res.bookingId,
            message: res.message || "Booking confirmed!",
            credits: true,
          });
          setBookingBusy(false);
          return;
        }

        openRazorpay(res.order, res.bookingId, {
          onSuccess: async (response) => {
            try {
              const v = await apiPost("/bookingApi/verify-payment", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setBooking({ ok: true, bookingId: v.bookingId, otp: v.otp, message: v.message });
            } catch (ve) {
              setBookingErr(ve.message || "Payment verification failed.");
            } finally {
              setBookingBusy(false);
            }
          },
          onFail: (msg) => { setBookingErr(msg); setBookingBusy(false); },
          onDismiss: () => setBookingBusy(false),
        });
      } catch (be) {
        console.error("Booking error:", be);
        setBookingErr(be.message || "Unable to create booking. Please try again.");
        setBookingBusy(false);
      }
    },
    [car]
  );

  const getImageUrls = () => {
    const urls = [];
    const addIfValid = (img) => {
      if (typeof img === "string" && img.trim() && !urls.includes(img)) urls.push(img);
    };
    if (Array.isArray(car?.main_image)) car.main_image.forEach(addIfValid);
    else addIfValid(car?.main_image);
    if (Array.isArray(car?.images)) car.images.forEach(addIfValid);
    return urls.length > 0 ? urls : [PLACEHOLDER];
  };

  if (loading) {
    return (
      <div className="car-detail-loading">
        <div className="loading-spinner" />
        <p>Loading car details&#8230;</p>
      </div>
    );
  }

  if (err || !car) {
    return (
      <div className="car-detail-error">
        <div className="error-container">
          <span className="error-icon">&#9888;&#65039;</span>
          <p className="banner error">{err || "Car not found"}</p>
          <Link to="/" className="btn-primary">Back to listings</Link>
        </div>
      </div>
    );
  }

  const imageUrls = getImageUrls();
  const processedImages = imageUrls.map((img) => carImageUrl({ images: [img] }));
  const currentImage = processedImages[currentImageIndex] || PLACEHOLDER;

  const prices = car.six_hr_price != null
    ? [
        ["6 hours", car.six_hr_price],
        ["12 hours", car.twelve_hr_price],
        ["24 hours", car.twentyfour_hr_price],
      ]
    : [];

  return (
    <div className="car-detail">
      <Link to="/" className="back-link">&larr; Back to all cars</Link>

      <div className="car-detail-grid">
        <div className="car-detail-media card">
          <div className="image-gallery">
            <div className="main-image-container">
              <motion.img
                src={currentImage}
                alt={`${car.model} \u2014 Photo ${currentImageIndex + 1}`}
                loading="lazy"
                onClick={() => setIsImageModalOpen(true)}
                style={{ cursor: "pointer" }}
                onError={(e) => { e.target.src = PLACEHOLDER; }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />

              {car.category && (
                <span className="car-category-badge">{car.category}</span>
              )}

              {imageUrls.length > 1 && (
                <div className="gallery-nav">
                  <button
                    className={`nav-arrow${currentImageIndex === 0 ? " disabled" : ""}`}
                    onClick={() => setCurrentImageIndex((p) => Math.max(0, p - 1))}
                    disabled={currentImageIndex === 0}
                    aria-label="Previous image"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    className={`nav-arrow${currentImageIndex === imageUrls.length - 1 ? " disabled" : ""}`}
                    onClick={() => setCurrentImageIndex((p) => Math.min(imageUrls.length - 1, p + 1))}
                    disabled={currentImageIndex === imageUrls.length - 1}
                    aria-label="Next image"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}

              {imageUrls.length > 1 && (
                <div className="image-counter">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              )}
            </div>

            {processedImages.length > 1 && (
              <div className="thumbnail-dots">
                {processedImages.map((_, i) => (
                  <button
                    key={i}
                    className={`dot${i === currentImageIndex ? " active" : ""}`}
                    onClick={() => setCurrentImageIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="car-detail-info">
          <div className="car-header">
            <h1>{car.model}</h1>
            <div className="car-rating">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>4.8</span>
              <span className="reviews-count">(2.3k reviews)</span>
            </div>
          </div>

          <div className="branch-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {car.branch_name || "Branch"}
            {car.branch_city ? `, ${car.branch_city}` : ""}
            {car.branch_address ? ` \u2014 ${car.branch_address}` : ""}
          </div>

          <div className="detail-chips">
            <span>{car.year}</span>
            <span>{car.fuelType}</span>
            <span>{car.transmission}</span>
            <span>{car.seatingCapacity} seats</span>
            {car.colour && <span>{car.colour}</span>}
          </div>

          {Array.isArray(car.features) && car.features.length > 0 && (
            <div className="features">
              <h3>Features &amp; Amenities</h3>
              <ul>
                {car.features.map((f, idx) => (
                  <li key={idx}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prices.length > 0 && (
            <div className="pricing card subtle">
              <h3>Pricing (inclusive of taxes)</h3>
              <div className="pricing-grid">
                {prices.map(([label, amt]) => (
                  <div key={label} className="pricing-item">
                    <span className="pricing-label">{label}</span>
                    <strong className="pricing-amount">
                      {"\u20B9"}{Number(amt).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="small muted">
                * For rentals exceeding 12 hours, you&apos;ll be charged the daily rate + hourly rate for extra hours.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="car-status-badge-section">
        <div className={`cc-status-badge${status === "available" ? " available" : " booked"}`}>
          <span className="cc-status-icon">{status === "available" ? "\u2705" : "\uD83D\uDD12"}</span>
          <span className="cc-status-text">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      <BookingPanel
        car={car}
        isLoggedIn={isLoggedIn}
        onBook={handleBook}
        bookingBusy={bookingBusy}
        bookingErr={bookingErr}
        booking={booking}
        copyOtpToClipboard={copyOtpToClipboard}
        agreedToPolicy={agreedToPolicy}
        setAgreedToPolicy={setAgreedToPolicy}
      />

      <section className="branch-info-section">
        <div className="branch-info-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <div className="branch-info-content">
            <p>
              This car is available at{" "}
              <strong>{car.branch_name || "our branch"}</strong>.
              {branches.length > 0 &&
                ` We have ${branches.length} branch${branches.length > 1 ? "es" : ""} across India.`}
            </p>
            {car.branch_address && (
              <p className="branch-address">{car.branch_address}</p>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            className="image-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsImageModalOpen(false)}
          >
            <motion.div
              className="image-modal-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setIsImageModalOpen(false)}>
                &times;
              </button>
              <img src={currentImage} alt={car.model} />

              {imageUrls.length > 1 && (
                <div className="modal-nav">
                  <button
                    className="modal-nav-btn"
                    onClick={() => setCurrentImageIndex((p) => Math.max(0, p - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    &larr;
                  </button>
                  <span className="modal-counter">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </span>
                  <button
                    className="modal-nav-btn"
                    onClick={() => setCurrentImageIndex((p) => Math.min(imageUrls.length - 1, p + 1))}
                    disabled={currentImageIndex === imageUrls.length - 1}
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
