import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, GraduationCap, Lock, Mail, QrCode, ShieldCheck, Sparkles,
  ScanLine, University, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest, clearSession, saveSession } from "../lib/api";

const PORTALS = {
  "super-admin": {
    role: "super-admin",
    path: "/super-admin",
    title: "Super Admin Login",
    eyebrow: "Magadh Mahila College Executive Portal",
    description: "Full mess governance for Vaidehi Hostel and Mahila Hostel, QR security, analytics, and audit controls.",
    email: "",
    name: "Super Admin",
    theme: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-dark",
    panel: "bg-white/85 backdrop-blur-xl border-blue-100",
    accent: "from-blue-500 via-cyan-400 to-blue-700",
    icon: ShieldCheck,
    bullets: ["System Health", "Audit Logs", "College Settings"],
  },
  admin: {
    role: "admin",
    path: "/admin",
    title: "Admin Login",
    eyebrow: "Hostel Mess Operations",
    description: "Fast operational access for student records, live scanner, QR cards, meals, and reports.",
    email: "",
    name: "Hostel Admin",
    theme: "min-h-screen bg-surface text-dark",
    panel: "glass border-white/60",
    accent: "from-blue-600 to-cyan-500",
    icon: Users,
    bullets: ["Live Scanner", "Student Search", "Meal Schedule"],
  },
  student: {
    role: "student",
    path: "/student",
    title: "Student Login",
    eyebrow: "Student Mess Portal",
    description: "View your QR card, meal attendance, notifications, and personal mess profile.",
    email: "",
    name: "Student",
    theme: "min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-dark",
    panel: "bg-white/80 backdrop-blur-xl border-sky-100",
    accent: "from-sky-500 to-blue-500",
    icon: GraduationCap,
    bullets: ["Live Mess QR", "Weekly Meal Menu", "Profile Requests"],
  },
};

const DEFAULT_LOGIN_CONFIG = {
  title: "Mess ERP Login",
  eyebrow: "Magadh Mahila College Hostel Mess ERP",
  description: "Use your issued Login ID. Your dashboard opens automatically based on your account role.",
  theme: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-dark",
  panel: "bg-white/85 backdrop-blur-xl border-blue-100",
  accent: "from-blue-600 via-cyan-500 to-blue-700",
  icon: ShieldCheck,
  bullets: ["Student Portal", "Admin Operations", "Super Admin Controls"],
};

async function loginWithId(loginId, password) {
  const basePayload = { login_id: loginId.trim(), password };
  const upperLoginId = basePayload.login_id.toUpperCase();
  const inferredPortal = upperLoginId.startsWith("SUPER") || upperLoginId.includes("SUPERADMIN")
    ? "super-admin"
    : upperLoginId.startsWith("ADMIN")
      ? "admin"
      : "student";
  const fallbackPortals = [inferredPortal, ...["student", "admin", "super-admin"].filter((role) => role !== inferredPortal)];

  try {
    return await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...basePayload, portal: inferredPortal }),
    });
  } catch (firstError) {
    let lastError = firstError;
    try {
      return await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(basePayload),
      });
    } catch (error) {
      lastError = error;
    }

    for (const portal of fallbackPortals) {
      try {
        return await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ ...basePayload, portal }),
        });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setRole, setCurrentStudentId, setCurrentUser } = useApp();
  const config = DEFAULT_LOGIN_CONFIG;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const Icon = config.icon;

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      clearSession();
      setIsAuthenticated(false);
      const session = await loginWithId(loginId, password);
      saveSession(session);
      setRole(session.role);
      setCurrentUser(session.user);
      setCurrentStudentId(session.user.student_id || null);
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${session.user.name}!`);
      navigate(`${PORTALS[session.role]?.path || "/student"}/dashboard`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${config.theme} relative overflow-hidden flex items-center justify-center p-6`}>
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "34px 34px",
      }} />
      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className={`w-16 h-16 rounded-xl3 bg-gradient-to-br ${config.accent} text-white flex items-center justify-center shadow-floating`}>
            <Icon size={30} />
          </div>
          <p className="mt-8 text-sm font-semibold text-primary-200">{config.eyebrow}</p>
          <h1 className="font-display text-5xl font-semibold mt-3 leading-tight">{config.title}</h1>
          <p className="mt-4 max-w-xl text-slate-500">{config.description}</p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
            {config.bullets.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="rounded-xl3 p-4 bg-white shadow-soft border border-slate-100"
              >
                <Sparkles size={17} className="text-primary" />
                <p className="text-sm font-semibold mt-3">{item}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4">
            {[QrCode, ScanLine, University].map((ItemIcon, index) => (
              <motion.div
                key={index}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 + index, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl3 flex items-center justify-center bg-white shadow-soft"
              >
                <ItemIcon size={22} className="text-primary" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl3 border p-7 md:p-8 shadow-glass ${config.panel}`}
        >
          <div className={`w-12 h-12 rounded-xl2 bg-gradient-to-br ${config.accent} text-white flex items-center justify-center mb-5`}>
            <Icon size={22} />
          </div>
          <p className="text-xs font-semibold text-primary">{config.eyebrow}</p>
          <h2 className="font-display text-2xl font-semibold mt-1">{config.title}</h2>
          <p className="text-sm mt-2 mb-6 text-slate-500">
            Use the real login ID issued by the hostel ERP administrator.
          </p>

          <label className="text-xs font-semibold mb-1.5 block">Login ID</label>
          <div className="relative mb-4">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="username" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="Enter your real ID" className="w-full bg-white text-dark border border-slate-200 focus:border-primary rounded-xl2 pl-10 pr-4 py-3 text-sm outline-none" />
          </div>

          <label className="text-xs font-semibold mb-1.5 block">Password</label>
          <div className="relative mb-5">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-white text-dark border border-slate-200 focus:border-primary rounded-xl2 pl-10 pr-4 py-3 text-sm outline-none" />
          </div>

          <button disabled={loading} className={`w-full bg-gradient-to-r ${config.accent} text-white font-semibold rounded-xl2 py-3 text-sm shadow-floating flex items-center justify-center gap-2 disabled:opacity-70`}>
            {loading ? "Verifying..." : "Login"}
            {!loading && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-xs mt-5 text-slate-500">
            One login page for Admin, Super Admin, and Students
          </p>
        </motion.form>
      </div>
    </div>
  );
}
