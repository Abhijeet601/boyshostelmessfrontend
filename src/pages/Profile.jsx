import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Save, Send, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest, clearSession } from "../lib/api";
import { useData } from "../lib/hooks";
import {
  Avatar,
  Badge,
  Button,
  DataState,
  Empty,
  Field,
  Heading,
  Panel,
} from "../components/ui";
const fields = [
  ["name", "Full name"],
  ["email", "Email"],
  ["mobile", "Mobile number"],
  ["room_number", "Room number"],
  ["course", "Course"],
  ["department", "Department"],
  ["academic_year", "Academic year"],
  ["semester", "Semester"],
  ["photo_url", "Photo URL"],
];
export default function Profile() {
  const { role, setCurrentUser, config } = useApp();
  const navigate = useNavigate();
  const student = role === "student";
  const resource = useData(student ? "/student/me" : "/auth/me");
  const requests = useData(student ? "/student/profile-change-requests" : null);
  const activity = useData("/auth/activity");
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  useEffect(() => {
    if (resource.data)
      setForm(
        Object.fromEntries(
          (student
            ? fields
            : [["name"], ["email"], ["mobile"], ["photo_url"]]
          ).map(([key]) => [key, resource.data[key] || ""]),
        ),
      );
  }, [resource.data, student]);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (student) {
        const changes = Object.fromEntries(
          Object.entries(form).filter(
            ([key, value]) => value !== (resource.data[key] || ""),
          ),
        );
        if (!Object.keys(changes).length)
          throw new Error("Change at least one field before submitting.");
        await apiRequest("/student/profile-change-requests", {
          method: "POST",
          body: JSON.stringify({ changes }),
        });
        requests.reload();
        toast.success("Profile changes sent for approval");
      } else {
        await apiRequest("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        const user = await apiRequest("/auth/me");
        setCurrentUser(user);
        toast.success("Profile saved");
      }
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordError("");
    try {
      await apiRequest("/auth/password", {
        method: "POST",
        body: JSON.stringify(passwords),
      });
      clearSession();
      setCurrentUser(null);
      toast.success("Password updated. Please sign in again.");
      navigate("/login");
    } catch (e) {
      setPasswordError(e.message);
    } finally {
      setPasswordBusy(false);
    }
  };
  const shownFields = student
    ? fields
    : fields.filter(([key]) =>
        ["name", "email", "mobile", "photo_url"].includes(key),
      );
  return (
    <div className="page-stack" style={{ maxWidth: 1100 }}>
      <Heading
        eyebrow="Your account"
        title="My profile"
        description={
          student
            ? "Your personal details and profile update requests."
            : "Manage your account details and keep your access secure."
        }
      />
      <DataState resource={resource}>
        {resource.data && (
          <>
            <Panel>
              <div className="profile-header">
                <Avatar
                  name={resource.data.name}
                  src={resource.data.photo_url}
                  size={76}
                />
                <div>
                  <h2>{resource.data.name}</h2>
                  <div className="actions">
                    <Badge tone="indigo">{role.replaceAll("-", " ")}</Badge>
                    <Badge tone={resource.data.active ? "success" : "neutral"}>
                      {resource.data.active
                        ? "Active account"
                        : "Inactive account"}
                    </Badge>
                    {student && (
                      <Badge
                        tone={resource.data.qr_enabled ? "success" : "warning"}
                      >
                        {resource.data.qr_enabled
                          ? "QR enabled"
                          : "QR disabled"}
                      </Badge>
                    )}
                  </div>
                  <p className="muted small" style={{ marginTop: 12 }}>
                    {student
                      ? `${resource.data.hostel} · Room ${resource.data.room_number}`
                      : resource.data.hostel_scope || "All hostels"}
                  </p>
                </div>
              </div>
              {student && (
                <dl className="detail-grid">
                  <div>
                    <dt>Roll / admission number</dt>
                    <dd>{resource.data.admission_number}</dd>
                  </div>
                  <div>
                    <dt>Registration number</dt>
                    <dd>{resource.data.registration_number}</dd>
                  </div>
                </dl>
              )}
            </Panel>
            <Panel
              title={
                student ? "Request a profile update" : "Personal information"
              }
              description={
                student
                  ? "Changes are applied after your administrator approves them."
                  : "Your changes are saved to your account."
              }
            >
              <form onSubmit={save}>
                {error && (
                  <div role="alert" className="auth-error">
                    {error}
                  </div>
                )}
                <div className="form-grid">
                  {shownFields.map(([key, label]) => (
                    <Field
                      label={label}
                      key={key}
                      value={form[key] ?? ""}
                      type={key === "email" ? "email" : "text"}
                      required={key === "name"}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  ))}
                </div>
                <div className="form-actions">
                  <Button loading={busy}>
                    {student ? <Send size={14} /> : <Save size={14} />}{" "}
                    {student ? "Request profile update" : "Save profile"}
                  </Button>
                </div>
              </form>
            </Panel>
          </>
        )}
      </DataState>
      {student && (
        <Panel
          title="Request history"
          description="Track each requested change and its review outcome"
        >
          <DataState resource={requests}>
            {requests.data?.requests.length ? (
              requests.data.requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "18px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    className="actions"
                    style={{
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span className="muted small">
                      {new Date(r.created_at + "Z").toLocaleString("en-IN", {
                        timeZone: config.timezone,
                      })}
                    </span>
                    <Badge
                      tone={
                        r.status === "Approved"
                          ? "success"
                          : r.status === "Rejected"
                            ? "error"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Original value</th>
                          <th>Requested value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(r.changes).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key.replaceAll("_", " ")}</td>
                            <td>{r.original[key] || "—"}</td>
                            <td>{value || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {r.admin_note && (
                    <p className="muted small" style={{ marginTop: 10 }}>
                      Administrator: {r.admin_note}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <Empty
                title="No profile requests yet"
                description="Your submitted changes will appear here."
              />
            )}
          </DataState>
        </Panel>
      )}
      <div className="grid-2">
        <Panel
          title="Change password"
          description="Updating your password signs out all existing sessions."
        >
          <form onSubmit={changePassword}>
            {passwordError && (
              <div className="auth-error" role="alert">
                {passwordError}
              </div>
            )}
            <div className="page-stack">
              <Field
                label="Current password"
                type="password"
                autoComplete="current-password"
                required
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    current_password: e.target.value,
                  })
                }
              />
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
                help="Use at least 10 characters."
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords({ ...passwords, new_password: e.target.value })
                }
              />
            </div>
            <Button loading={passwordBusy} style={{ marginTop: 23 }}>
              <KeyRound size={14} />
              Update password
            </Button>
          </form>
        </Panel>
        <Panel
          title="Recent account activity"
          description="Actions associated with your account"
        >
          <DataState resource={activity}>
            {activity.data?.items.length ? (
              activity.data.items.slice(0, 6).map((a) => (
                <div className="activity-item" key={a.id}>
                  <span className="icon-tile tone-indigo">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <strong style={{ textTransform: "capitalize" }}>
                      {a.action.replaceAll("_", " ")}
                    </strong>
                    <small>
                      {new Date(a.created_at + "Z").toLocaleString("en-IN", {
                        timeZone: config.timezone,
                      })}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <Empty title="No account activity yet" />
            )}
          </DataState>
        </Panel>
      </div>
    </div>
  );
}
