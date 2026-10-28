import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock3,
  RefreshCw,
  ShieldCheck,
  X,
  Pause,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { applicantRequest, applicationCredential } from "../lib/registration";
import { Badge, Button, Logo } from "../components/ui";
const states = {
  PENDING: {
    title: "Registration Submitted Successfully",
    subtitle: "Your application is waiting for administrator approval.",
    icon: Clock3,
    tone: "warning",
  },
  APPROVED: {
    title: "Your Account Has Been Approved!",
    subtitle:
      "Your hostel community is ready for you. Sign in to access your dashboard and secure QR.",
    icon: Check,
    tone: "success",
  },
  REJECTED: {
    title: "Registration Not Approved",
    subtitle: "Please review the feedback from your administrator.",
    icon: X,
    tone: "error",
  },
  SUSPENDED: {
    title: "Your account is currently inactive",
    subtitle: "Please contact your hostel administrator for assistance.",
    icon: Pause,
    tone: "warning",
  },
};
export default function RegistrationStatus() {
  const { config } = useApp();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await applicantRequest("/registration/status"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (applicationCredential()) load();
  }, []);
  const state = states[data?.status] || states.PENDING,
    Icon = state.icon;
  return (
    <div className="status-screen">
      <Link className="brand" to="/login">
        <Logo src={config.logo_url} />
        <strong>{config.app_name}</strong>
      </Link>
      <motion.section
        className={`status-card status-${data?.status?.toLowerCase() || "pending"}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="status-orbit" aria-hidden="true">
          <span />
          <span />
          <motion.div
            className={`status-symbol tone-${state.tone}`}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <Icon size={40} />
          </motion.div>
        </div>
        <p className="eyebrow">YOUR ENROLLMENT JOURNEY</p>
        <h1>{data ? state.title : "Track your application"}</h1>
        <p className="muted">
          {data
            ? state.subtitle
            : applicationCredential()
              ? "Checking your application…"
              : "Sign in with the login ID and password you chose during registration to securely check your status."}
        </p>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {data && (
          <>
            <Badge tone={state.tone}>{data.status}</Badge>
            <dl className="status-details">
              <div>
                <dt>Application reference</dt>
                <dd className="mono">{data.reference}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{new Date(data.created_at + "Z").toLocaleString()}</dd>
              </div>
              <div>
                <dt>Student</dt>
                <dd>{data.name}</dd>
              </div>
              <div>
                <dt>Hostel</dt>
                <dd>{data.hostel}</dd>
              </div>
              {data.reviewed_at && (
                <div>
                  <dt>Reviewed</dt>
                  <dd>{new Date(data.reviewed_at + "Z").toLocaleString()}</dd>
                </div>
              )}
            </dl>
            {data.status === "REJECTED" && (
              <div className="rejection-feedback">
                <strong>Administrator feedback</strong>
                <p>{data.rejection_reason}</p>
              </div>
            )}
            {data.status === "PENDING" && (
              <div className="approval-journey">
                <span className="done">
                  <Check size={16} /> Submitted
                </span>
                <i />
                <span className="active">
                  <Clock3 size={16} /> In review
                </span>
                <i />
                <span>
                  <ShieldCheck size={16} /> Approved
                </span>
              </div>
            )}
          </>
        )}
        <div className="status-actions">
          {applicationCredential() && (
            <Button variant="outline" loading={busy} onClick={load}>
              <RefreshCw size={15} />
              Check Status
            </Button>
          )}
          {data?.status === "REJECTED" && data.allow_resubmission && (
            <Link className="btn btn-primary" to="/register?resubmit=true">
              Correct application <ArrowRight size={15} />
            </Link>
          )}
          <Link
            className={`btn btn-${data?.status === "APPROVED" ? "primary" : "ghost"}`}
            to="/login"
          >
            {data?.status === "APPROVED" ? "Go to Login" : "Back to sign in"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </motion.section>
      <p className="muted small status-privacy">
        <ShieldCheck size={13} /> Only you and authorized administrators can
        view your application.
      </p>
    </div>
  );
}
