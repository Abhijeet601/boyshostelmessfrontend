import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import DashboardLayout from "./layouts/DashboardLayout";
import { Loading } from "./components/ui";
const Splash = lazy(() => import("./pages/Splash"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LiveScanner = lazy(() => import("./pages/LiveScanner"));
const Students = lazy(() => import("./pages/Students"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const QRManagement = lazy(() => import("./pages/QRManagement"));
const AttendanceHistory = lazy(() => import("./pages/AttendanceHistory"));
const MealManagement = lazy(() => import("./pages/MealManagement"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Profile = lazy(() => import("./pages/Profile"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const ProfileApprovals = lazy(() => import("./pages/ProfileApprovals"));
const Management = lazy(() => import("./pages/Management"));
const Sessions = lazy(() => import("./pages/Sessions"));
const Registration = lazy(() => import("./pages/Registration"));
const RegistrationStatus = lazy(() => import("./pages/RegistrationStatus"));
const RegistrationRequests = lazy(() => import("./pages/RegistrationRequests"));

function Guard({ portal, permission, children }) {
  const { ready, isAuthenticated, role } = useApp();
  if (!ready) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (
    (portal && portal !== role) ||
    (permission === "executive" && role !== "super-admin") ||
    (permission === "staff" && role === "student")
  )
    return <AccessDenied />;
  return children;
}
function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 30 }}>
          <Loading />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/registration/status" element={<RegistrationStatus />} />
        {["super-admin", "admin", "student"].map((portal) => (
          <Route
            key={portal}
            path={`/${portal}/login`}
            element={<Navigate to="/login" replace />}
          />
        ))}
        {["super-admin", "admin", "student"].map((portal) => (
          <Route
            key={portal}
            path={`/${portal}`}
            element={
              <Guard portal={portal}>
                <DashboardLayout />
              </Guard>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="registration-requests" element={<Guard permission="staff"><RegistrationRequests /></Guard>} />
            <Route
              path="scanner"
              element={
                <Guard permission="staff">
                  <LiveScanner />
                </Guard>
              }
            />
            <Route
              path="students"
              element={
                <Guard permission="staff">
                  <Students />
                </Guard>
              }
            />
            <Route
              path="students/:id"
              element={
                <Guard permission="staff">
                  <StudentProfile />
                </Guard>
              }
            />
            <Route
              path="admins"
              element={
                <Guard permission="executive">
                  <Management kind="admins" />
                </Guard>
              }
            />
            <Route
              path="hostels"
              element={
                <Guard permission="executive">
                  <Management kind="hostels" />
                </Guard>
              }
            />
            <Route
              path="scanner-management"
              element={
                <Guard permission="executive">
                  <Sessions />
                </Guard>
              }
            />
            <Route
              path="sessions"
              element={
                <Guard permission="executive">
                  <Sessions />
                </Guard>
              }
            />
            <Route path="qr-management" element={<QRManagement />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            <Route path="meals" element={<MealManagement />} />
            <Route
              path="profile-requests"
              element={
                <Guard permission="staff">
                  <ProfileApprovals />
                </Guard>
              }
            />
            <Route
              path="reports"
              element={
                <Guard permission="staff">
                  <Reports />
                </Guard>
              }
            />
            <Route
              path="analytics"
              element={
                <Guard permission="executive">
                  <Reports analytics />
                </Guard>
              }
            />
            <Route path="notifications" element={<Notifications />} />
            <Route
              path="audit-logs"
              element={
                <Guard permission="executive">
                  <AuditLogs />
                </Guard>
              }
            />
            <Route
              path="settings"
              element={
                <Guard permission="executive">
                  <Settings />
                </Guard>
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<AccessDenied />} />
          </Route>
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "Inter,sans-serif",
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 30px #0f172a0a",
              },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </MotionConfig>
  );
}
