import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { saveApplication } from "../lib/registration";
import AttendanceOrbit from "../components/AttendanceOrbit";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { Button, Field, Logo } from "../components/ui";

export function QRIllustration() {
  return <AttendanceOrbit />;
}
export default function Login() {
  const { config, login, isAuthenticated, basePath, ready } = useApp();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (ready && isAuthenticated)
    return <Navigate to={`${basePath}/dashboard`} replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!id.trim() || !password) {
      setError("Enter your login ID and password.");
      return;
    }
    setLoading(true);
    try {
      const role = await login(id.trim(), password);
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (e) {
      if (e.data?.credential) {
        saveApplication(e.data.credential);
        navigate("/registration/status");
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-screen">
      <section className="auth-brand">
        <div className="brand">
          <Logo size={40} src={config.logo_url} />
          <div>
            <strong>{config.app_name || "SmartMess"}</strong>
            <small>QR ATTENDANCE SYSTEM</small>
          </div>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">A smarter way to check in</p>
          <h1>
            A smarter way
            <br />
            <span>to show up.</span>
          </h1>
          <p>
            Secure QR-based hostel mess attendance, made simple. Less waiting.
            More time for what matters.
          </p>
          <div className="auth-art">
            <QRIllustration />
          </div>
          <div className="auth-highlights">
            <span>
              <Zap size={15} />
              Instant QR check-in
            </span>
            <span>
              <CheckCircle2 size={15} />
              Real-time attendance
            </span>
            <span>
              <BarChart3 size={15} />
              Smart analytics
            </span>
          </div>
        </div>
        <p className="auth-footer">
          {config.institution_name || "Built for better hostel experiences."}
        </p>
      </section>
      <div className="auth-form-side">
        <motion.form
          className="auth-card"
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-mobile-brand">
            <Logo src={config.logo_url} />
            <strong>{config.app_name || "SmartMess"}</strong>
          </div>
          <span
            className="icon-tile tone-indigo"
            style={{ width: 44, height: 44, marginBottom: 24 }}
          >
            <LockKeyhole size={21} />
          </span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your attendance workspace.</p>
          {error && (
            <div role="alert" className="auth-error">
              {error}
            </div>
          )}
          <Field
            label="Login ID"
            name="username"
            autoComplete="username"
            placeholder="Enter your issued login ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <Field label="Password">
            <div className="password-wrap">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="icon-button"
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((v) => !v)}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Button type="submit" loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={16} />}
          </Button>
          <div className="auth-note">
            <ShieldCheck size={14} />
            Secure access for students and administrators
          </div>
          <p
            className="muted small"
            style={{ textAlign: "center", marginTop: 35 }}
          >
            New student?{" "}
            <Link to="/register">
              Create your account <ArrowRight size={13} />
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
