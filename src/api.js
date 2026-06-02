// frontend/src/api.js
const raw = import.meta.env.VITE_API_URL;
// console.log(import.meta.env.VITE_API_URL);

export const API_BASE = raw.replace(/\/$/, "");

export function decodeToken(token) {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64));
    console.log("Decoded token:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

export function authHeaders() {
  const t = localStorage.getItem("car24_token");
  if (!t) return {};
  const decoded = decodeToken(t);
  const headers = {
    Authorization: `Bearer ${t}`,
  };
  
  if (decoded?.branch_id) {
    headers["X-Branch-Id"] = decoded.branch_id.toString();
  }
  if (decoded?.branchHeadId) {
    headers["X-Branch-Head-Id"] = decoded.branchHeadId.toString();
  }
  
  return headers;
}

function parseResponse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

class ApiError extends Error {
  constructor(message, status, statusCode, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiGet(path, { query, withAuth, headers } = {}) {
  const base = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const url = new URL(base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(withAuth ? authHeaders() : {}),
      ...(headers || {}),
    },
  });
  const text = await res.text();
  const data = parseResponse(text);
  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    console.error(`GET ${path} failed [${res.status} ${res.statusText}]:`, {
      message,
      data,
      url: url.toString()
    });
    const err = new ApiError(message, res.status, res.status, data);
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiPost(path, body, { withAuth, headers } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(withAuth ? authHeaders() : {}),
      ...(headers || {}),
    },
    body: isFormData ? body : JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  const data = parseResponse(text);
  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    console.error(`POST ${path} failed [${res.status} ${res.statusText}]:`, { 
      message, 
      data,
      body: isFormData ? '[FormData]' : body 
    });
    throw new ApiError(message, res.status, res.status, data);
  }
  return data;
}

export async function apiPut(path, body, { withAuth, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(withAuth ? authHeaders() : {}),
      ...(headers || {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  const data = parseResponse(text);
  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    console.error(`PUT ${path} failed [${res.status} ${res.statusText}]:`, { 
      message, 
      data 
    });
    throw new ApiError(message, res.status, res.status, data);
  }
  return data;
}

export async function apiDelete(path, { withAuth, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(withAuth ? authHeaders() : {}),
      ...(headers || {}),
    },
  });
  const text = await res.text();
  const data = parseResponse(text);
  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    console.error(`DELETE ${path} failed [${res.status} ${res.statusText}]:`, { 
      message, 
      data 
    });
    throw new ApiError(message, res.status, res.status, data);
  }
  return data;
}

export function setToken(token) {
  if (token) localStorage.setItem("car24_token", token);
  else localStorage.removeItem("car24_token");
}

export function getToken() {
  return localStorage.getItem("car24_token");
}

// ── User Auth ──────────────────────────────────────────────
export async function userLogin(email, password) {
  return apiPost("/user/userLogin", { email, password });
}

export async function userRegister(data) {
  return apiPost("/user/createUser", data);
}

export async function verifyUserOtp(email, otp) {
  return apiPut("/user/verifyuserRegister", { email, otp });
}

export async function resendUserOtp(email) {
  return apiPost("/user/resendOTP", { email });
}

export async function getUserData() {
  return apiGet("/user/getData", { withAuth: true });
}

export async function updateProfile(id, data) {
  return apiPut(`/user/UpdateProfile/${id}`, data, { withAuth: true });
}

export async function forgotPassOtp(email) {
  return apiPost("/user/forgotPassOTP", { email });
}

export async function forgotPassOtpVerify(email, otp) {
  return apiPost("/user/forgotPassOTPVerify", { email, otp });
}

export async function changePassword(changeToken, pass) {
  return apiPut("/user/changePass", { pass }, { headers: { Authorization: `Bearer ${changeToken}` } });
}

export async function getDocuments() {
  return apiGet("/user/getDocuments", { withAuth: true });
}

// ── Owner Auth ─────────────────────────────────────────────
export async function ownerRegister(data) {
  return apiPost("/owners/CreateOwnerAccount", data);
}

export async function ownerLogin(email, password) {
  return apiPost("/user/userLogin", { email, password });
}

export async function verifyOwnerOtp(email, otp) {
  return apiPut("/user/verifyuserRegister", { email, otp });
}

export async function resendOwnerOtp(email) {
  return apiPost("/user/resendOTP", { email });
}

export async function getOwnerData() {
  return apiGet("/owners/getOwnerData", { withAuth: true });
}

// Add to api.js
export async function getCarGpsLocation(carId) {
  try {
    // First try the real GPS endpoint
    return await apiGet(`/cars/carGps/${carId}`, { withAuth: true });
  } catch (err) {
    // If backend crashes (500), fetch license plate ourselves and call WheelsEye directly
    if (err?.status === 500 || err?.status === 404) {
      try {
        // Get car details to extract license plate
        const carData = await apiGet(`/bookingApi/getBooking/${carId}`, { withAuth: true })
          .catch(() => null);

        // Try getting from cars endpoint directly  
        const carRes = await apiGet(`/cars/get_car/${carId}`, { withAuth: true })
          .catch(() => null);

        const licensePlate = 
          carRes?.licensePlate || 
          carRes?.licenseplate ||
          carData?.licensePlate ||
          carData?.car_plate ||
          null;

        if (!licensePlate) {
          throw new Error("Could not find license plate for this vehicle");
        }

        // Call WheelsEye directly from frontend
        const wheelsEyeRes = await fetch(
          "https://api.wheelseye.com/currentLoc?accessToken=5592c132-c784-401e-8b37-dcf7ff478f38"
        );
        const wheelsEyeData = await wheelsEyeRes.json();
        const vehicles = wheelsEyeData?.data?.list || [];

        const vehicle = vehicles.find(
          (v) =>
            v.vehicleNumber.replace(/\s/g, "").toLowerCase() ===
            licensePlate.replace(/\s/g, "").toLowerCase()
        );

        if (!vehicle) {
          throw new Error(`Vehicle ${licensePlate} not found in GPS tracker`);
        }

        return {
          success: true,
          carId,
          location: {
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            speed: vehicle.speed,
            ignition: vehicle.ignition,
            time: vehicle.dttime,
          },
        };
      } catch (fallbackErr) {
        throw new Error(fallbackErr.message || "GPS unavailable");
      }
    }
    throw err;
  }
}
export async function getOwnerDashboardData() {
  const emptyStats = {
    total_bookings: 0, total_earnings: 0, total_deductions: 0,
    net_earnings: 0, today_earnings: 0, week_earnings: 0,
    month_earnings: 0, active_rides: 0, upcoming_rides: 0, total_trips: 0,
  };
  try {
    const response = await apiGet("/owners/getOwnerData", { withAuth: true });
    console.log("Owner dashboard response:", response);
    
    const stats = response?.stats || emptyStats;
    
    return {
      owner: response?.owner || null,
      cars: response?.cars || [],
      stats: {
        total_bookings:  stats.total_bookings || 0,
        total_earnings:  stats.all_time_gross || stats.total_earnings || 0,
        total_deductions: stats.all_time_deductions || stats.total_deductions || 0,
        net_earnings:    stats.all_time_net || stats.net_earnings || 0,
        today_earnings:  stats.today_earnings || 0,
        week_earnings:   stats.week_earnings || 0,
        month_earnings:  stats.month_earnings || 0,
        active_rides:    stats.active_rides || 0,
        upcoming_rides:  stats.upcoming_rides || 0,
        total_trips:     stats.total_trips || 0,
      },
      chart: response?.chart || [],
      breakdown: response?.breakdown || [],
    };
  } catch (error) {
    console.error("Failed to get owner dashboard data:", error);
    return { owner: null, cars: [], stats: emptyStats, chart: [], breakdown: [] };
  }
}

export async function getCarStats(carId) {
  return apiGet(`/owners/getCarStats/${carId}`, { withAuth: true });
}

export async function deleteCar(carId) {
  try {
    const response = await apiDelete(`/cars/delete_car/${carId}`, { withAuth: true });
    return response;
  } catch (error) {
    console.error("Failed to delete car:", error);
    throw error;
  }
}

export async function updateCarStatus(carId, status) {
  try {
    const response = await apiPut(`/roleauth/updateCar/${carId}`, { status }, { withAuth: true });
    return response;
  } catch (error) {
    console.error("Failed to update car status:", error);
    throw error;
  }
}

export async function getOwnerCars() {
  const token = getToken();
  const decoded = decodeToken(token);
  const ownerId = decoded?.id;
  if (!ownerId) return [];
  return apiGet("/cars/owner_cars", { withAuth: true, query: { ownerId } });
}

export async function getCarDetails(carId) {
  return apiGet(`/owners/get_car_details/${carId}`, { withAuth: true });
}

export async function getEarningsBreakdown(period = "all") {
  return apiGet("/owners/get_earnings_breakdown", { withAuth: true, query: { period } });
}

export async function getOwnerBookings(filters = {}) {
  return apiGet("/bookingApi/ownerBookings", { withAuth: true, query: filters });
}

export async function getOwnerProfile() {
  return apiGet("/owners/owner_profile", { withAuth: true });
}

export async function updateOwnerProfile(profileData) {
  return apiPut("/owners/update_owner_profile", profileData, { withAuth: true });
}

export async function addCar(branchId, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/cars/addCar/${branchId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  const parsed = parseResponse(text);
  if (!res.ok) {
    const err = new Error(parsed?.message || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
  return parsed;
}

export async function updateCar(carId, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/roleauth/updateCar/${carId}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  const parsed = parseResponse(text);
  if (!res.ok) {
    const err = new Error(parsed?.message || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
  return parsed;
}

// ── Owner Approvals ────────────────────────────────────────
export async function getPendingOwners() {
  return apiGet("/owners/get_pending_owners", { withAuth: true });
}

export async function approveOwner(ownerId) {
  return apiPut(`/owners/approve_owner/${ownerId}`, {}, { withAuth: true });
}

// ── Cars ───────────────────────────────────────────────────
export async function getCars(query = {}) {
  return apiGet("/cars/get_cars", { query });
}

export async function getCar(id) {
  return apiGet(`/cars/get_car/${id}`);
}

export async function getBranches() {
  return apiGet("/cars/get_branches");
}

export async function getPendingCars() {
  return apiGet("/cars/get_pending_cars", { withAuth: true });
}

export async function approveCar(carId, data) {
  return apiPut(`/cars/approve_pending_cars/${carId}`, data, { withAuth: true });
}

export async function rejectCar(carId) {
  return apiPut(`/cars/approve_pending_cars/${carId}`, { status: 'rejected' }, { withAuth: true });
}

export async function updateCarPricing(carId, pricingData) {
  return apiPut(`/cars/approve_pending_cars/${carId}`, { 
    status: 'approved', 
    ...pricingData 
  }, { withAuth: true });
}

// ── Admin Management Routes ─────────────────────────────────
export async function getUsers(id = null, role = "user", number = 10, offset = 0) {
  const idParam = id && id !== "null" && id !== "" ? id : "null";
  const roleParam = role && role !== "null" && role !== "" ? role : "user";
  const url = `/roleauth/getUsersData/${idParam}/${roleParam}/${number}/${offset}`;
  return apiGet(url, { withAuth: true });
}

export async function getManagementUsers(id = "null", branch = "null", role = "null", number = "10", offset = "0") {
  const url = `/roleauth/getManagementData/${id}/${branch}/${role}/${number}/${offset}`;
  try {
    const response = await apiGet(url, { withAuth: true });
    return response;
  } catch (error) {
    console.error("getManagementUsers error:", error);
    return { count: 0, data: [] };
  }
}

// ── Admin Analytics ────────────────────────────────────────
export async function getAdminDashboardStats() {
  try {
    return await apiGet("/roleauth/getAllData", { withAuth: true });
  } catch (error) {
    return {
      totalCars: 0,
      pendingCars: 0,
      totalBranches: 0,
      carsUsedToday: 0,
      verifiedUsers: 0,
      totalOwners: 0
    };
  }
}

export async function getBranchRevenue() {
  try {
    const response = await apiGet("/roleauth/get_branches_revenue", { withAuth: true });
    return response || [];
  } catch (error) {
    return [];
  }
}

export async function getBranchIncome(branchId, fromDate, toDate) {
  try {
    const response = await apiGet(`/roleauth/get_income/${branchId}`, {
      withAuth: true,
      query: fromDate && toDate ? { fromDate, toDate } : {}
    });
    return response?.data || [];
  } catch {
    return [];
  }
}

export async function adminChangePassword(email, newPassword) {
  return apiPut(`/roleauth/superAdmin/changePass/${email}`, { pass: newPassword }, { withAuth: true });
}

// ── Bookings ───────────────────────────────────────────────
export async function getMyBookings() {
  return apiGet("/bookingApi/myBookings", { withAuth: true });
}

export async function getMyCredits() {
  return apiGet("/bookingApi/myCredits", { withAuth: true });
}

export async function bookCar(data) {
  return apiPost("/bookingApi/bookCar", data, { withAuth: true });
}

export async function offlineBookCar(data) {
  return apiPost("/bookingApi/bookCar", data, { withAuth: true });
}

export async function verifyPayment(data) {
  return apiPost("/bookingApi/verify-payment", data);
}

export async function cancelBooking(id) {
  return apiPost(`/bookingApi/request-cancel/${id}`, {}, { withAuth: true });
}

export async function checkAvailability(carId, pickupDate, dropoffDate) {
  return apiGet("/bookingApi/checkAvailability", { query: { carId, pickupDate, dropoffDate } });
}

export async function getBookingDetails(bookingId) {
  return apiGet(`/bookingApi/getBooking/${bookingId}`, { withAuth: true });
}

// ── Staff ─────────────────────────────────────────────────
// export async function getStaffTasks(date, branchId) {
//   const d = date || new Date().toISOString().slice(0, 10);

//   return apiGet("/bookingApi/getStaffTasks", {
//     withAuth: true,
//     query: {
//       date: d,
//       branch_id: branchId,
//     },
//   });
// }

export async function verifyCarKey(bookingId, key, id) {
  return apiGet("/bookingApi/carKeyVerify", { withAuth: true, query: { bookingId, key, id } });
}

export async function startRide(data) {
  return apiPut("/bookingApi/startRide", data, { withAuth: true });
}

export async function endRide(bookingId, data) {
  return apiPut(`/bookingApi/endRide/${bookingId}`, data, { withAuth: true });
}

export async function uploadOwnerDocument(formData) {
  return apiPost("/photoUpload/DocumentUpload", formData, { withAuth: true });
}

export async function createManagement(data) {
  return createStaff(data);
}

// ── Staff OTP Verification ─────────────────────────────────
export async function sendStaffOtp(email) {
  return apiPost("/user/sendStaffOtp", { email });
}

export async function verifyStaffOtp(email, otp) {
  return apiPost("/user/verifyStaffOtp", { email, otp });
}

export async function staffLogin(email, password) {
  return apiPost("/user/userloginnn", { email, password });
}

export async function getStaffDashboard() {
  return apiGet("/staff/dashboard", { withAuth: true });
}

export async function verifyBooking(bookingId, action) {
  return apiPut(`/staff/verify_booking/${bookingId}`, { action }, { withAuth: true });
}

export async function collectRemainingPayment(data) {
  return apiPost("/bookingApi/collectPayment", data, { withAuth: true });
}

// ── Branch Head Dashboard ──────────────────────────────────
export async function getBranchDashboardStats(branchId, fromDate, toDate) {
  if (!branchId) return {};
  try {
    return await apiGet(`/roleauth/branch_dashboard/${branchId}`, {
      withAuth: true,
      query: fromDate && toDate ? { fromDate, toDate } : {}
    });
  } catch {
    return { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, onRoadToday: 0, totalCars: 0, idleCars: 0 };
  }
}

export async function getBranchDashboardStatsWithDate(branchId, month) {
  if (!branchId) return {};
  try {
    return await apiGet(`/roleauth/branch_dashboard/${branchId}`, {
      withAuth: true,
      query: { month }
    });
  } catch (error) {
    return { 
      totalBookings: 0, 
      completedBookings: 0, 
      cancelledBookings: 0, 
      onRoadToday: 0, 
      totalCars: 0, 
      idleCars: 0 
    };
  }
}

export async function getBranchBookingsByDate(branchId, date) {
  if (!branchId) {
    console.warn("No branchId provided");
    return [];
  }
  
  if (!date) {
    console.warn("No date provided");
    return [];
  }
  
  try {
    const response = await apiGet("/bookingApi/getBranchBookingsByDate", {
      withAuth: true,
      query: { branchId, date }
    });
    
    console.log("Raw API response:", response);
    
    // ✅ CRITICAL FIX: Extract the data array from the response
    if (response && response.data && Array.isArray(response.data)) {
      console.log(`✅ Found ${response.data.length} bookings`);
      return response.data;  // Return JUST the array
    }
    
    // Fallback if response is already an array
    if (Array.isArray(response)) {
      console.log(`✅ Found ${response.length} bookings (direct array)`);
      return response;
    }
    
    console.warn("Unexpected response format:", response);
    return [];
    
  } catch (error) {
    console.error("Failed to get branch bookings:", error);
    return [];
  }
}
export async function getBranchHeadProfile() {
  return apiGet("/roleauth/getManagementProfile", { withAuth: true });
}

export async function getBranchCars(branchId, query = {}) {
  if (!branchId) return [];
  return apiGet(`/roleauth/branch_cars/${branchId}`, { withAuth: true, query });
}

export async function getBranchStaff(branchId) {
  const id = branchId || "null";
  const response = await getManagementUsers("null", id, "staff", "1000", "0");
  return response?.data || [];
}

export async function getBranchActivities() {
  return apiGet("/branch/activities", { withAuth: true });
}

export async function verifyBookingStart(bookingId, otp) {
  return apiPost(`/branch/verify-start/${bookingId}`, { otp }, { withAuth: true });
}

export async function verifyBookingEnd(bookingId, otp) {
  return apiPost(`/branch/verify-end/${bookingId}`, { otp }, { withAuth: true });
}

export async function updateBranchBookingStatus(bookingId, status) {
  return apiPut(`/branch/booking/${bookingId}/status`, { status }, { withAuth: true });
}

// ── Super Admin APIs ──────────────────────────────────────
export async function getSuperAdminFinances() {
  return apiGet("/roleauth/getSuperAdminFinances", { withAuth: true });
}

export async function getFinancialData(filters = {}) {
  return apiGet("/roleauth/getFinancial", { withAuth: true, query: filters });
}

export async function getPaymentHistory(filters = {}) {
  return apiGet("/roleauth/getPaymentHistory", { withAuth: true, query: filters });
}

export async function getOwnerPendingBreakdown(ownerId, branchId) {
  return apiGet(`/roleauth/getOwnerPendingBreakdown/${ownerId}`, { withAuth: true, query: { branchId } });
}

export async function markOwnerPaid(ownerId, branchId, bookingIds = [], deductionAmount = 0, reason = "") {
  return apiPost(`/roleauth/processOwnerPayout`, { ownerId, branchId, bookingIds, deductionAmount, reason }, { withAuth: true });
}

export async function updateBranch(branchId, data) {
  return apiPut(`/roleauth/update-branch/${branchId}`, data, { withAuth: true });
}

export async function getAllData() {
  return apiGet("/roleauth/getAllData", { withAuth: true });
}

// ── Reviews ────────────────────────────────────────────────
export async function addReview(reviewData) {
  return apiPost("/reviews/add_review", reviewData, { withAuth: true });
}

export async function getCarReviews(carId) {
  return apiGet(`/reviews/car_reviews/${carId}`);
}

// ── Utilities ──────────────────────────────────────────────
export function calculatePrice(hours, pricing) {
  if (!pricing || !pricing.six_hr_price || !pricing.twelve_hr_price || !pricing.twentyfour_hr_price) {
    return 0;
  }
  let remaining = hours;
  let totalPrice = 0;
  const days = Math.floor(remaining / 24);
  totalPrice += days * pricing.twentyfour_hr_price;
  remaining -= days * 24;
  const halfDays = Math.floor(remaining / 12);
  totalPrice += halfDays * pricing.twelve_hr_price;
  remaining -= halfDays * 12;
  const sixHrs = Math.floor(remaining / 6);
  totalPrice += sixHrs * pricing.six_hr_price;
  return totalPrice;
}

export async function updateBookingStatus(bookingId, status) {
  try {
    const response = await apiPut(`/branch/booking/${bookingId}/status`, { status }, { withAuth: true });
    return response;
  } catch (error) {
    console.error("Failed to update booking status:", error);
    throw error;
  }
}

export function calculateAdvanceAmount(totalHours) {
  let remaining = totalHours;
  let advance = 0;
  const days = Math.floor(remaining / 24);
  advance += days * 500;
  remaining -= days * 24;
  const halfDays = Math.floor(remaining / 12);
  advance += halfDays * 500;
  remaining -= halfDays * 12;
  const sixHrs = Math.floor(remaining / 6);
  advance += sixHrs * 400;
  return advance;
}

export function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status) {
  const colors = {
    pending: "#f59e0b",
    confirmed: "#10b981",
    ongoing: "#3b82f6",
    completed: "#6b7280",
    cancelled: "#ef4444",
    approved: "#10b981",
    rejected: "#ef4444",
  };
  return colors[status] || "#6b7280";
}


// src/services/api.js
// const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Add this to your api.js file (around line 450+ after your other exports)

// ── Firebase Push Notifications ──────────────────────────────────
export async function addFirebaseToken(fcmToken, email) {
  try {
    // Use the same API_BASE as your other endpoints
    const response = await apiPut("/addFirebaseToken", { 
      token: fcmToken, 
      email: email 
    }, { withAuth: true });
    
    return response;
  } catch (error) {
    console.error('Error adding Firebase token:', error);
    throw error;
  }
}

// Optional: Send push notification to user
export async function sendPushNotification(email, title, body, data = {}) {
  try {
    const response = await apiPost("/sendPushNotification", {
      email,
      title,
      body,
      data
    }, { withAuth: true });
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Optional: Get user's notification preferences
export async function getNotificationPreferences() {
  try {
    const response = await apiGet("/user/notificationPreferences", { withAuth: true });
    return response;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return { enabled: true, types: [] };
  }
}

// Optional: Update notification preferences
export async function updateNotificationPreferences(preferences) {
  try {
    const response = await apiPut("/user/notificationPreferences", preferences, { withAuth: true });
    return response;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}


export const createOfflineBooking = async (bookingData) => {
  try {
    // FIXED: Get token using the correct key 'car24_token' from localStorage
    // Your authHeaders() function already does this correctly, so let's reuse it
    const token = localStorage.getItem('car24_token');
    
    console.log('Creating offline booking with token:', !!token);
    
    if (!token) {
      console.error('No car24_token found in localStorage. Available keys:', Object.keys(localStorage));
      throw new Error('No authentication token found. Please login again.');
    }

    // FIXED: Use the correct API endpoint with API_BASE
    const response = await fetch(`${API_BASE}/bookingApi/staff-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: bookingData.userId,
        carId: bookingData.carId,
        branchId: bookingData.branchId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        advancePaid: bookingData.advancePaid || 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Booking created successfully",
      booking: data.booking
    };
  } catch (error) {
    console.error('Error creating offline booking:', error);
    throw error;
  }
};

let authToken = null;

// export const setToken = (token) => {
//   authToken = token;
//   if (token) {
//     localStorage.setItem('token', token);
//   } else {
//     localStorage.removeItem('token');
//   }
// };

// export const getToken = () => {
//   return authToken || localStorage.getItem('token');
// };

export async function getStaffTasks(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  
  // Get branchId from the management profile API
  const profile = await apiGet("/roleauth/getManagementProfile", { withAuth: true });
  const branchId = profile?.branch || profile?.branch_id || profile?.branchId;
  
  if (!branchId) throw new Error("Branch not assigned to this account");
  
  return apiGet("/bookingApi/getStaffTasks", {
    withAuth: true,
    query: { date: d, branchId },
  });
}
 
// ── FIX 2: getCancellationRequests — NEW function (was completely missing) ───
// ADD this function anywhere in api.js after the Staff section:
export async function getCancellationRequests(branchId) {
  if (!branchId) throw new Error("branchId is required");
  return apiGet("/bookingApi/cancellation-requests", {
    withAuth: true,
    query: { branchId },
  });
}
 
// ── FIX 3: approveCancelBooking — NEW function (was completely missing) ──────
// ADD this function after getCancellationRequests:
export async function approveCancelBooking(bookingId) {
  return apiPost(
    `/bookingApi/approve-cancel/${bookingId}`,
    {},             // empty body — the backend reads bookingId from the URL param
    { withAuth: true }
  );
}

// ── Car Management ────────────────────────────────────────────────
export async function updateCarDetails(carId, carData) {
  try {
    // Using the correct endpoint from your backend (without /cars prefix)
    const response = await apiPut(`/updateCar/${carId}`, carData, { withAuth: true });
    return response;
  } catch (error) {
    console.error("Failed to update car details:", error);
    throw error;
  }
}

// Add to api.js
export async function getStaffProfile() {
  return apiGet("/roleauth/getManagementProfile", { withAuth: true });
}
export function getStatusText(status) {
  const texts = {
    pending: "Pending",
    confirmed: "Confirmed",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
    approved: "Approved",
    rejected: "Rejected",
  };
  return texts[status] || status;
}

const api = {
  userLogin, userRegister, verifyUserOtp, resendUserOtp, getUserData, updateProfile,
  forgotPassOtp, forgotPassOtpVerify, changePassword, getDocuments,
  ownerRegister, ownerLogin, verifyOwnerOtp, resendOwnerOtp, getOwnerData, getOwnerDashboardData,
  getCarStats, getOwnerCars, getCarDetails, getEarningsBreakdown, getOwnerBookings, getOwnerProfile,
  updateOwnerProfile, addCar, updateCar, getPendingOwners, approveOwner,
  getCars, getCar, getBranches, getPendingCars, approveCar, rejectCar, updateCarPricing, deleteCar,
  getAdminDashboardStats, getBranchRevenue, getBranchIncome, adminChangePassword,
  getUsers, getManagementUsers,
  getMyBookings, getMyCredits, bookCar, offlineBookCar, verifyPayment, cancelBooking, checkAvailability,
  getBookingDetails, getStaffTasks, verifyCarKey, startRide, endRide, uploadOwnerDocument, createManagement,
  sendStaffOtp, verifyStaffOtp, staffLogin, getStaffDashboard, verifyBooking, collectRemainingPayment,
  getBranchDashboardStats, getBranchDashboardStatsWithDate, getBranchBookingsByDate, getBranchHeadProfile,
  getBranchCars, getBranchStaff, getBranchActivities, verifyBookingStart, verifyBookingEnd,
  updateBranchBookingStatus, updateBookingStatus, getSuperAdminFinances, getFinancialData, getPaymentHistory,
  getOwnerPendingBreakdown, markOwnerPaid, updateBranch, getAllData,
  addReview, getCarReviews, calculatePrice, calculateAdvanceAmount, formatINR, formatDate, formatDateTime,
  getStatusColor, getStatusText, apiGet, apiPost, apiPut, apiDelete, setToken, getToken, authHeaders, decodeToken, addFirebaseToken,
  sendPushNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
};

export default api;