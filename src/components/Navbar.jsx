import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { useClock, useData } from "../lib/hooks";
import { Avatar, Badge } from "./ui";

const titles = {
  dashboard: "Dashboard",
  students: "Students",
  "registration-requests": "Registration requests",
  admins: "Admin management",
  hostels: "Hostel management",
  "qr-management": "QR management",
  scanner: "Live scanner",
  "scanner-management": "Scanner management",
  attendance: "Attendance",
  meals: "Meal menu",
  "profile-requests": "Profile requests",
  reports: "Reports",
  analytics: "Analytics",
  notifications: "Notifications",
  "audit-logs": "Audit logs",
  settings: "Settings",
  profile: "My profile",
  sessions: "Attendance sessions",
};
export default function Navbar() {
  const {
    role,
    currentUser,
    config,
    basePath,
    unreadCount,
    logout,
    setMobileSidebarOpen,
  } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const now = useClock();
  const sessionResource = useData("/current-session", 30000);
  const part = location.pathname.split("/")[2];
  const time = now.toLocaleTimeString("en-GB", {
    timeZone: config.timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const meal = sessionResource.data?.session;
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const key = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <header className="topbar">
      <div className="actions">
        <button
          className="icon-button mobile-menu"
          aria-label="Open navigation"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu size={21} />
        </button>
        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={10} />
            <span>{titles[part] || "Student details"}</span>
          </div>
          <p className="topbar-title">
            {config.institution_name || "Attendance workspace"}
          </p>
        </div>
      </div>
      <div className="topbar-right">
        <form
          className="topbar-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim())
              navigate(
                `${basePath}/${role === "student" ? "attendance" : "students"}?q=${encodeURIComponent(query)}`,
              );
          }}
        >
          <Search size={15} />
          <input
            aria-label="Global search"
            placeholder={
              role === "student" ? "Search attendance…" : "Search students…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="keycap">↵</span>
        </form>
        <div className="topbar-clock">
          <p>
            {now.toLocaleDateString("en-IN", {
              timeZone: config.timezone,
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="mono">
            {time} · {config.timezone}
          </p>
        </div>
        <Badge tone={meal ? "success" : "neutral"}>
          {sessionResource.error
            ? "Session unavailable"
            : sessionResource.loading && !sessionResource.data
              ? "Checking session"
              : meal?.meal || "No active meal"}
        </Badge>
        <Link
          className="icon-button"
          aria-label={`Notifications, ${unreadCount} unread`}
          to={`${basePath}/notifications`}
        >
          <Bell size={19} />
          {unreadCount > 0 && <span className="notification-dot" />}
        </Link>
        <div className="profile-menu" ref={ref}>
          <button
            className="actions"
            style={{ background: "none", border: 0 }}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Account menu"
          >
            <Avatar
              name={currentUser?.name}
              src={currentUser?.photo_url}
              size={34}
            />
            <ChevronDown size={12} color="#94a3b8" />
          </button>
          {open && (
            <div className="dropdown">
              <p className="small" style={{ padding: "10px", fontWeight: 600 }}>
                {currentUser?.name}
              </p>
              <Link onClick={() => setOpen(false)} to={`${basePath}/profile`}>
                <UserRound size={15} />
                My profile
              </Link>
              <button
                onClick={() => logout().catch((e) => toast.error(e.message))}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
