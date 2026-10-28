import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useApp } from "../context/AppContext";
export default function AccessDenied() {
  const { basePath } = useApp();
  return (
    <div className="status-page">
      <div>
        <span
          className="icon-tile tone-warning"
          style={{ width: 64, height: 64 }}
        >
          <LockKeyhole size={28} />
        </span>
        <p className="eyebrow" style={{ marginTop: 24 }}>
          403 · Restricted access
        </p>
        <h1>This page needs a different permission</h1>
        <p className="muted small">
          Contact your Super Admin if you need access to this workspace.
        </p>
        <Link className="btn btn-primary" to={`${basePath}/dashboard`}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
