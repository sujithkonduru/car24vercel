import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * allowedRoles: array of role strings, or "any" to require only a valid token.
 * redirectTo: where to send unauthenticated users (default /login).
 */
export default function ProtectedRoute({ children, allowedRoles = "any", redirectTo = "/login" }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth || !auth.token) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const { role } = auth;

  if (allowedRoles !== "any" && !allowedRoles.includes(role)) {
    if (role === "owner") return <Navigate to="/owner/dashboard" replace />;
    if (role === "branch_head") return <Navigate to="/branch_dashboard" replace />;
    if (role === "staff") return <Navigate to="/staff/dashboard" replace />;
    if (role === "sub_admin") return <Navigate to="/branch_dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
