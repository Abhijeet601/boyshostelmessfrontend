import { NavLink, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  UserCheck,
  UserCircle,
  Users,
  Utensils,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { Avatar, Logo } from "./ui";

const NAVIGATION = [
  ["Overview", "dashboard", "Dashboard", LayoutDashboard, "all"],
  ["Workspace", "admins", "Admin Management", ShieldCheck, "super-admin"],
  ["Workspace", "hostels", "Hostel Management", Building2, "super-admin"],
  ["Workspace", "students", "Students", Users, "staff"],
  ["Workspace", "registration-requests", "Registration Requests", UserCheck, "staff"],
  ["Workspace", "qr-management", "QR Management", QrCode, "all"],
  [
    "Workspace",
    "scanner-management",
    "Scanner Management",
    Activity,
    "super-admin",
  ],
  ["Workspace", "scanner", "Live Scanner", ScanLine, "staff"],
  ["Workspace", "attendance", "Attendance", ClipboardList, "all"],
  ["Workspace", "meals", "Meal Menu", Utensils, "all"],
  ["Workspace", "profile-requests", "Profile Requests", UserCheck, "staff"],
  ["Insights", "analytics", "Analytics", Activity, "super-admin"],
  ["Insights", "reports", "Reports", BarChart3, "staff"],
  ["Insights", "notifications", "Notifications", Bell, "all"],
  ["Administration", "audit-logs", "Audit Logs", ShieldCheck, "super-admin"],
  ["Administration", "settings", "Settings", Settings, "super-admin"],
  ["Account", "profile", "Profile", UserCircle, "all"],
];
export default function Sidebar() {
  const asideRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const {
    role,
    basePath,
    currentUser,
    config,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    logout,
    unreadCount,
  } = useApp();
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobileSidebarOpen || !isMobile) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    asideRef.current?.querySelector("a,button")?.focus();
    const handle = (event) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
      if (event.key === "Tab") {
        const nodes = [...asideRef.current.querySelectorAll("a,button")];
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [mobileSidebarOpen, isMobile, setMobileSidebarOpen]);
  const visible = NAVIGATION.filter(
    ([, , , , permission]) =>
      permission === "all" ||
      permission === role ||
      (permission === "staff" && role !== "student"),
  );
  const collapsed = sidebarCollapsed && !mobileSidebarOpen;
  const groups = [...new Set(visible.map((item) => item[0]))];
  return (
    <>
      {mobileSidebarOpen && (
        <button
          className="side-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        ref={asideRef}
        inert={isMobile && !mobileSidebarOpen ? true : undefined}
        role={isMobile && mobileSidebarOpen ? "dialog" : undefined}
        aria-modal={isMobile && mobileSidebarOpen ? "true" : undefined}
        aria-label="Workspace navigation"
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-top">
          <Link
            className="brand"
            to={`${basePath}/dashboard`}
            aria-label={`${config.app_name} dashboard`}
          >
            <Logo src={config.logo_url} />
            {!collapsed && (
              <div>
                <strong>{config.app_name || "SmartMess"}</strong>
                <small>QR ATTENDANCE SYSTEM</small>
              </div>
            )}
          </Link>
          {!collapsed && (
            <div className="role-label">
              {role?.replaceAll("-", " ")} portal
            </div>
          )}
          {mobileSidebarOpen && (
            <button
              className="icon-button"
              style={{ position: "absolute", right: 10, top: 12 }}
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div key={group}>
              {!collapsed && <p className="nav-label">{group}</p>}
              {visible
                .filter((item) => item[0] === group)
                .map(([, path, label, Icon]) => {
                  const text =
                    role === "student" && path === "qr-management"
                      ? "My QR Code"
                      : role === "student" && path === "attendance"
                        ? "My Attendance"
                        : label;
                  return (
                    <NavLink
                      title={collapsed ? text : undefined}
                      key={path}
                      to={`${basePath}/${path}`}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                      }
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <Icon size={17} />
                      {!collapsed && (
                        <>
                          <span>{text}</span>
                          {path === "notifications" && unreadCount > 0 && (
                            <span className="nav-count">{unreadCount}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link className="sidebar-profile" to={`${basePath}/profile`}>
            <Avatar
              name={currentUser?.name}
              src={currentUser?.photo_url}
              size={33}
            />
            {!collapsed && (
              <div>
                <strong>{currentUser?.name}</strong>
                <small>{currentUser?.login_id}</small>
              </div>
            )}
          </Link>
          <button
            className="nav-item"
            style={{ width: "100%" }}
            onClick={() => logout().catch((e) => toast.error(e.message))}
            title="Sign out"
          >
            <LogOut size={17} />
            {!collapsed && "Sign out"}
          </button>
          <button
            className="nav-item"
            style={{ width: "100%" }}
            onClick={() => setSidebarCollapsed((v) => !v)}
            title="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}{" "}
            {!collapsed && "Collapse sidebar"}
          </button>
        </div>
      </aside>
    </>
  );
}
