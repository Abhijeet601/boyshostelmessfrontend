/* oxlint-disable react/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  apiRequest,
  clearSession,
  getToken,
  loadSession,
  saveSession,
} from "../lib/api";

const Context = createContext(null);
const defaults = {
  app_name: "SmartMess",
  institution_name: "",
  timezone: "Asia/Kolkata",
  schedules: [],
};
export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [config, setConfig] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const authRun = useRef(0);
  const role = currentUser?.role;
  useEffect(() => {
    const colors = {
      indigo: ["#6366f1", "#4f46e5"],
      violet: ["#7c3aed", "#6d28d9"],
      blue: ["#2563eb", "#1d4ed8"],
    };
    const chosen = colors[config.accent] || colors.indigo;
    document.documentElement.style.setProperty("--accent", chosen[0]);
    document.documentElement.style.setProperty("--accent-hover", chosen[1]);
    document.title = `${config.app_name || "SmartMess"} — QR Attendance System`;
  }, [config.accent, config.app_name]);
  const initialize = useCallback(async () => {
    const run = ++authRun.current;
    setBootError("");
    try {
      const publicConfig = await apiRequest("/public/settings", {
        public: true,
      });
      if (run !== authRun.current) return;
      setConfig({ ...defaults, ...publicConfig });
      if (loadSession()) {
        const user = await apiRequest("/auth/me");
        const settings = await apiRequest("/settings");
        if (run !== authRun.current) return;
        setCurrentUser(user);
        setConfig(settings);
      }
    } catch (error) {
      if (run !== authRun.current || error.name === "AbortError") return;
      if (error.status === 401) {
        clearSession();
        setCurrentUser(null);
      } else setBootError(error.message);
    } finally {
      if (run === authRun.current) setReady(true);
    }
  }, []);
  useEffect(() => {
    initialize();
  }, [initialize]);
  useEffect(() => {
    const handler = (event) => {
      if (event.detail?.token !== getToken()) return;
      authRun.current++;
      clearSession();
      setCurrentUser(null);
      setNotifs([]);
      setMobileSidebarOpen(false);
      setReady(true);
    };
    window.addEventListener("smartmess:unauthorized", handler);
    return () => window.removeEventListener("smartmess:unauthorized", handler);
  }, []);
  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await apiRequest("/notifications");
      setNotifs(result.items);
    } catch {
      /* Page surfaces retryable errors. */
    }
  }, [currentUser]);
  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 30000);
    return () => clearInterval(timer);
  }, [refreshNotifications]);
  const login = async (login_id, password) => {
    const run = ++authRun.current;
    try {
      const session = await apiRequest("/auth/login", {
        method: "POST",
        public: true,
        body: JSON.stringify({ login_id, password }),
      });
      if (run !== authRun.current)
        throw Object.assign(new Error("Sign-in was superseded."), {
          name: "AbortError",
        });
      saveSession(session);
      const settings = await apiRequest("/settings");
      if (run !== authRun.current)
        throw Object.assign(new Error("Sign-in was superseded."), {
          name: "AbortError",
        });
      setCurrentUser(session.user);
      setConfig(settings);
      return session.role;
    } finally {
      if (run === authRun.current) setReady(true);
    }
  };
  const logout = async () => {
    const token = getToken();
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      if (error.status === 401 || error.name === "AbortError") return;
      throw error;
    }
    if (getToken() !== token) return;
    authRun.current++;
    clearSession();
    setCurrentUser(null);
    setNotifs([]);
    setMobileSidebarOpen(false);
  };
  const markRead = async (id, unread = false) => {
    await apiRequest("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ id, unread }),
    });
    await refreshNotifications();
  };
  const markAllRead = async () => {
    await apiRequest("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ all: true }),
    });
    await refreshNotifications();
  };
  return (
    <Context.Provider
      value={{
        currentUser,
        setCurrentUser,
        role,
        config,
        setConfig,
        ready,
        bootError,
        initialize,
        login,
        logout,
        isAuthenticated: Boolean(currentUser),
        basePath: `/${role || "student"}`,
        notifs,
        unreadCount: notifs.filter((n) => n.unread).length,
        refreshNotifications,
        markRead,
        markAllRead,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
