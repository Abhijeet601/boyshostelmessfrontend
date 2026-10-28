import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useApp } from "../context/AppContext";
import { ShieldCheck } from "lucide-react";
export default function DashboardLayout() {
  const location = useLocation();
  const { role, currentUser } = useApp();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar />
      <div className="workspace">
        <Navbar />
        <main id="main" className="main-content">
          {role === "admin" && !currentUser?.hostel_scope && (
            <div
              className="notice notice-warning"
              role="status"
              style={{ marginBottom: 22 }}
            >
              <ShieldCheck size={18} />
              <span>
                Your account needs a hostel assignment. A Super Admin can assign
                your hostel in Admin Management to enable student and attendance
                access.
              </span>
            </div>
          )}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
