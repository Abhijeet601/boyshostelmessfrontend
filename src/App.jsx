import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import DashboardLayout from "./layouts/DashboardLayout";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveScanner from "./pages/LiveScanner";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import QRManagement from "./pages/QRManagement";
import AttendanceHistory from "./pages/AttendanceHistory";
import MealManagement from "./pages/MealManagement";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import AccessDenied from "./pages/AccessDenied";
import MessFeeManagement from "./pages/MessFeeManagement";
import ProfileApprovals from "./pages/ProfileApprovals";

const PORTAL_ROLES = {
  "super-admin": "super-admin",
  admin: "admin",
  student: "student",
};

function ProtectedRoute({ children, portal, allowedRoles }) {
  const { isAuthenticated, role } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (portal && PORTAL_ROLES[portal] !== role) return <AccessDenied />;
  if (allowedRoles && !allowedRoles.includes(role)) return <AccessDenied />;
  return children;
}

function PortalRoutes({ portal }) {
  const adminRoles = ["super-admin", "admin"];
  return (
    <Route
      path={`/${portal}`}
      element={
        <ProtectedRoute portal={portal}>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="scanner" element={<ProtectedRoute allowedRoles={adminRoles}><LiveScanner /></ProtectedRoute>} />
      <Route path="students" element={<ProtectedRoute allowedRoles={adminRoles}><Students /></ProtectedRoute>} />
      <Route path="students/:id" element={<ProtectedRoute allowedRoles={adminRoles}><StudentProfile /></ProtectedRoute>} />
      <Route path="qr-management" element={<QRManagement />} />
      <Route path="attendance" element={<AttendanceHistory />} />
      <Route path="meals" element={<MealManagement />} />
      <Route path="profile-requests" element={<ProtectedRoute allowedRoles={adminRoles}><ProfileApprovals /></ProtectedRoute>} />
      <Route path="mess-fees" element={<ProtectedRoute allowedRoles={adminRoles}><MessFeeManagement /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute allowedRoles={adminRoles}><Reports /></ProtectedRoute>} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="audit-logs" element={<ProtectedRoute allowedRoles={["super-admin"]}><AuditLogs /></ProtectedRoute>} />
      {portal !== "student" && <Route path="settings" element={<ProtectedRoute allowedRoles={["super-admin"]}><Settings /></ProtectedRoute>} />}
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<AccessDenied />} />
    </Route>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/super-admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/student/login" element={<Navigate to="/login" replace />} />
      <Route path="/403" element={<AccessDenied />} />
      <>{PortalRoutes({ portal: "super-admin" })}</>
      <>{PortalRoutes({ portal: "admin" })}</>
      <>{PortalRoutes({ portal: "student" })}</>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: "12px", fontSize: "13px", fontFamily: "Inter, sans-serif" },
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
