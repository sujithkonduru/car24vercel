import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import CarDetail from "./pages/CarDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Profile from "./pages/Profile.jsx";
import CarRegister from "./pages/CarRegister.jsx";
import Locations from "./pages/Locations.jsx";
import FAQ from "./pages/FAQ.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import CancellationPolicy from "./pages/CancellationPolicy.jsx";
import Help from "./pages/Help.jsx";
import NotFound from "./pages/NotFound.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import LiveTracking from "./pages/LiveTracking.jsx";

import OwnerLogin from "./pages/OwnerLogin.jsx";
import OwnerRegister from "./pages/OwnerRegister.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import OwnerBookings from "./pages/OwnerBookings.jsx";

import StaffLogin from "./pages/StaffLogin.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import StaffVerify from "./pages/StaffVerify.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";

// Branch Head Imports
import BranchLogin from "./pages/BranchLogin.jsx";
import BranchDashboard from "./pages/BranchHeadDashboard.jsx";
import BranchBookings from "./pages/BranchBookings.jsx";
import BranchFleet from "./pages/BranchFleet.jsx";
import BranchStaff from "./pages/BranchStaff.jsx";
import BranchVerify from "./pages/BranchVerify.jsx";
import BranchActivities from "./pages/BranchActivities.jsx";
import LaunchPage from './pages/LaunchPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* ── Public ── */}
          {/* <Route path="/" element={<Home />} />   */}
          {/* /cars is an alias for the home page cars section */}
          {/* <Route path="/cars" element={<Navigate to="/#cars" replace />} /> 
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsOfService />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />
          <Route path="/help" element={<Help />} /> */}
          {/* /register-owner is an alias for owner registration */}
          {/* <Route path="/register-owner" element={<Navigate to="/owner/register" replace />} />  */}
            <Route path="/" element={<LaunchPage />} /> 

          
          {/* <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user", "owner"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          /> */}
           <Route
            path="/tracking/:bookingId"
            element={
              <ProtectedRoute allowedRoles={["user", "owner", "staff", "branch_head", "admin", "superadmin"]}>
                <LiveTracking />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={["user", "owner"]}>
                <MyBookings />
              </ProtectedRoute>
            }
          /> */}
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user", "owner", "staff", "branch_head", "admin", "superadmin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/car-register"
            element={
              <ProtectedRoute allowedRoles={["user", "owner", "branch_head"]}>
                <CarRegister />
              </ProtectedRoute>
            }
          />

          
          <Route path="/owner/login" element={<OwnerLogin />} /> 
          <Route path="/owner/register" element={<OwnerRegister />} /> 
          <Route 
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          /> 
          
           <Route
            path="/owner/cars"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/owner/add-car"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <CarRegister />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/owner/earnings"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/owner/documents"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <Profile />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute allowedRoles={["owner"]} redirectTo="/owner/login">
                <OwnerBookings />
              </ProtectedRoute>
            }
          /> 

      
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff-verify" element={<StaffVerify />} />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]} redirectTo="/staff/login">
                <StaffDashboard />
              </ProtectedRoute>
            }
          /> 
          
          <Route
            path="/staff/tasks"
            element={
              <ProtectedRoute allowedRoles={["staff"]} redirectTo="/staff/login">
                <StaffDashboard />
              </ProtectedRoute>
            }
          /> 
         <Route
            path="/staff/verify"
            element={
              <ProtectedRoute allowedRoles={["staff"]} redirectTo="/staff/login">
                <StaffDashboard />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/staff/rides"
            element={
              <ProtectedRoute allowedRoles={["staff"]} redirectTo="/staff/login">
                <StaffDashboard />
              </ProtectedRoute>
            }
          /> 

          
          <Route path="/branch/login" element={<BranchLogin />} />
          <Route path="/branch-verify" element={<BranchVerify />} />
          <Route
            path="/branch/dashboard"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchDashboard />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/branch/bookings"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchBookings />
              </ProtectedRoute>
            }
          /> 
          
          <Route
            path="/branch/cars"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchFleet />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/branch/fleet"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchFleet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branch/staff"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branch/activities"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchActivities />
              </ProtectedRoute>
            }
          />

          
          <Route path="/admin/login" element={<StaffLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]} redirectTo="/staff/login">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]} redirectTo="/staff/login">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          /> */}
          {/* <Route
            path="/branch/dashboard"
            element={
              <ProtectedRoute allowedRoles={["branch_head", "sub_admin"]} redirectTo="/branch/login">
                <BranchDashboard />
              </ProtectedRoute>
            }
          />  */}

          
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes> 
     </Layout>
    </AuthProvider>
  );
}

export default App;