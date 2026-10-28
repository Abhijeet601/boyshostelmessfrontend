import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Clock3,
  KeyRound,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import {
  Badge,
  DataState,
  Empty,
  Heading,
  Metric,
  Panel,
} from "../components/ui";
import DynamicStudentQR from "../components/DynamicStudentQR";
export default function QRManagement() {
  const { role, basePath, config } = useApp();
  const student = useData(role === "student" ? "/student/me" : null);
  const resource = useData(role !== "student" ? "/overview" : null, 15000);
  const security = useData(role !== "student" ? "/qr-security" : null, 15000);
  if (role === "student")
    return (
      <div className="page-stack">
        <Heading
          eyebrow="Secure access, made simple"
          title="My QR attendance pass"
          description="Keep this page open and show your current live code at the mess entrance."
        />
        <DataState resource={student}>
          {student.data && <DynamicStudentQR student={student.data} />}
        </DataState>
        <div className="grid-3">
          {[
            [
              Smartphone,
              "Always live",
              "Refreshes automatically while this page is open.",
            ],
            [
              Clock3,
              "Short-lived access",
              `Codes expire after ${config.qr_ttl_seconds || 30} seconds.`,
            ],
            [
              ShieldCheck,
              "One use per code",
              "Every accepted QR is consumed securely on the server.",
            ],
          ].map(([Icon, title, body]) => (
            <Panel key={title}>
              <span className="icon-tile tone-indigo">
                <Icon size={20} />
              </span>
              <h3 style={{ margin: "16px 0 9px" }}>{title}</h3>
              <p className="muted small">{body}</p>
            </Panel>
          ))}
        </div>
      </div>
    );
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Security by design"
        title="QR security overview"
        description="Short-lived credentials. Verified students. Protected attendance."
        actions={
          <Link className="btn btn-outline" to={`${basePath}/students`}>
            Manage student QR access
            <ArrowUpRight size={14} />
          </Link>
        }
      />
      <div className="metrics-grid">
        <Metric
          label="Token expiry"
          value={config.qr_ttl_seconds || 30}
          suffix="s"
          icon={Clock3}
        />
        <Metric
          label="Automatic refresh"
          value={config.qr_refresh_seconds || 25}
          suffix="s"
          icon={QrCode}
          tone="cyan"
        />
        <Metric
          label="Scanners online"
          value={resource.data?.summary.active_scanners ?? "—"}
          icon={Smartphone}
          tone="success"
        />
        <Metric
          label="Verified check-ins today"
          value={resource.data?.summary.total_scans_today ?? "—"}
          icon={ShieldCheck}
        />
      </div>
      <DataState resource={security}>
        <div className="grid-3">
          <Metric
            label="Currently active QR passes"
            value={security.data?.active_tokens}
            icon={QrCode}
          />
          <Metric
            label="Successful validations"
            value={security.data?.successful}
            icon={ShieldCheck}
            tone="success"
          />
          <Metric
            label="Rejected validations"
            value={security.data?.rejected}
            icon={KeyRound}
            tone="warning"
          />
        </div>
      </DataState>
      <div className="grid-2">
        {[
          [
            KeyRound,
            "Opaque, cryptographically secure tokens",
            "QR payloads contain a random token. Personal details and student identifiers are never embedded.",
          ],
          [
            ShieldCheck,
            "Atomic replay and duplicate protection",
            "Accepted tokens are consumed once. The database enforces one attendance record per student and session.",
          ],
          [
            Clock3,
            "Server-controlled attendance windows",
            "Expiry, student status, authorized hostels, and active sessions are checked before attendance is recorded.",
          ],
          [
            Smartphone,
            "Student-session access",
            "Only an authenticated student can request their own live pass. Reusable exports are unavailable.",
          ],
        ].map(([Icon, title, text]) => (
          <Panel key={title}>
            <span className="icon-tile tone-indigo">
              <Icon size={20} />
            </span>
            <h3 style={{ margin: "17px 0 10px" }}>{title}</h3>
            <p className="muted small">{text}</p>
          </Panel>
        ))}
      </div>
      <Panel
        title="Recent validation activity"
        description="Actual outcomes from the attendance scanner"
        action={
          role === "super-admin" ? (
            <Link className="panel-link" to={`${basePath}/settings?section=qr`}>
              Configure QR policy
              <ArrowUpRight size={13} />
            </Link>
          ) : null
        }
      >
        <DataState resource={resource}>
          {resource.data?.security.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Outcome</th>
                    <th>Operator</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data.security.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Badge
                          tone={e.outcome === "SUCCESS" ? "success" : "warning"}
                        >
                          {e.outcome.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td>{e.operator}</td>
                      <td>{e.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No validation events yet"
              description="Scanner activity will appear after a QR is submitted."
            />
          )}
        </DataState>
      </Panel>
      {role === "super-admin" && (
        <Panel
          title="Scanner permissions"
          description="Activate, deactivate, and assign hostel access for administrators."
        >
          <Link className="panel-link" to={`${basePath}/admins`}>
            Manage authorized operators
            <ArrowUpRight size={13} />
          </Link>
        </Panel>
      )}
    </div>
  );
}
