import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Eye,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest, queryString } from "../lib/api";
import { useData, useDebounced } from "../lib/hooks";
import {
  Avatar,
  Badge,
  Button,
  CheckLabel,
  DataState,
  Empty,
  Field,
  Heading,
  Modal,
  Pager,
  Panel,
  SearchInput,
} from "../components/ui";

const blank = {
  name: "",
  admission_number: "",
  registration_number: "",
  email: "",
  mobile: "",
  hostel: "",
  room_number: "",
  course: "",
  department: "",
  academic_year: "",
  semester: "",
  academic_session: "",
  photo_url: "",
  active: true,
  qr_enabled: true,
  login_id: "",
  password: "",
};
function payloadOf(student) {
  return Object.fromEntries(
    Object.keys(blank).map((key) => [key, student[key] ?? blank[key]]),
  );
}
export default function Students() {
  const { basePath } = useApp();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const search = useDebounced(q);
  const [hostel, setHostel] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const resource = useData(
    `/students?${queryString({ q: search, hostel, year, status, sort, page })}`,
  );
  const hostels = useData("/hostels");
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewId = preview?.id;
  useEffect(() => {
    if (!previewId) return;
    const latest = resource.data?.items.find((item) => item.id === previewId);
    if (latest) setPreview(latest);
  }, [resource.data, previewId]);
  const [archiving, setArchiving] = useState(null);
  const [changingState, setChangingState] = useState(null);
  const [stateReason, setStateReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const open = (student) => {
    setFormError("");
    setEditing(
      student
        ? { ...payloadOf(student), id: student.id }
        : {
            ...blank,
            hostel: hostels.data?.items?.find((h) => h.active)?.name || "",
          },
    );
  };
  const set = (key, value) => setEditing((old) => ({ ...old, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = payloadOf(editing);
      if (!payload.login_id) {
        delete payload.login_id;
        delete payload.password;
      }
      await apiRequest(`/students${editing.id ? `/${editing.id}` : ""}`, {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(editing.id ? "Student updated" : "Student registered");
      setEditing(null);
      resource.reload();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const toggle = async (student) => {
    setChangingState(student);
    setStateReason("");
    setFormError("");
  };
  const saveState = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await apiRequest(`/students/${changingState.id}/account-state`, {
        method: "POST",
        body: JSON.stringify({
          active: !changingState.active,
          reason: stateReason,
        }),
      });
      toast.success(
        changingState.active ? "Student suspended" : "Student reactivated",
      );
      setChangingState(null);
      resource.reload();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const archive = async () => {
    setSaving(true);
    try {
      await apiRequest(`/students/${archiving.id}`, { method: "DELETE" });
      toast.success("Student archived. Attendance retained.");
      setArchiving(null);
      resource.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Your community"
        title="Student management"
        description="Keep student records, hostel assignments, and QR access in sync."
        actions={
          <Button onClick={() => open(null)}>
            <Plus size={15} />
            Add student
          </Button>
        }
      />
      <Panel>
        <div className="panel-heading">
          <div>
            <h2>
              All students{" "}
              <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                {resource.data?.total ?? "—"}
              </span>
            </h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              Real student records from your authorized hostels
            </p>
          </div>
          <span className="icon-tile tone-indigo">
            <Users size={18} />
          </span>
        </div>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Search name, roll or registration…"
          />
          <select
            aria-label="Filter hostel"
            value={hostel}
            onChange={(e) => {
              setHostel(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All hostels</option>
            {hostels.data?.items.map((h) => (
              <option key={h.id}>{h.name}</option>
            ))}
          </select>
          <select
            aria-label="Filter academic year"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All years</option>
            {resource.data?.years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select
            aria-label="Filter account status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            aria-label="Sort students"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="roll">Roll number</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
        <DataState resource={resource}>
          {resource.data?.items.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "Student",
                        "Roll number",
                        "Registration",
                        "Hostel / room",
                        "Course / year",
                        "Approval",
                        "Attendance (30d)",
                        "Account",
                        "QR access",
                        "Actions",
                      ].map((t) => (
                        <th key={t}>{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.items.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link
                            className="person"
                            to={`${basePath}/students/${s.id}`}
                          >
                            <Avatar name={s.name} src={s.photo_url} size={35} />
                            <div>
                              <strong>{s.name}</strong>
                              <small>{s.email || "No email"}</small>
                            </div>
                          </Link>
                        </td>
                        <td className="mono">{s.admission_number}</td>
                        <td className="mono">{s.registration_number}</td>
                        <td>
                          {s.hostel}
                          <small>Room {s.room_number}</small>
                        </td>
                        <td>
                          {s.course || "—"}
                          <small>{s.academic_year || "—"}</small>
                        </td>
                        <td>
                          <Badge
                            tone={
                              s.approval_status === "APPROVED"
                                ? "success"
                                : "warning"
                            }
                          >
                            {s.approval_status}
                          </Badge>
                        </td>
                        <td className="mono">
                          {s.attendance_percentage == null
                            ? "—"
                            : `${s.attendance_percentage}%`}
                        </td>
                        <td>
                          <Badge tone={s.active ? "success" : "neutral"}>
                            {s.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={s.qr_enabled ? "indigo" : "warning"}>
                            {s.qr_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="icon-button"
                              aria-label={`Preview ${s.name}`}
                              onClick={() => setPreview(s)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${s.name}`}
                              onClick={() => open(s)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`${s.active ? "Disable" : "Enable"} ${s.name}`}
                              onClick={() => toggle(s)}
                            >
                              <ShieldCheck size={14} />
                            </button>
                            <button
                              className="icon-button text-error"
                              aria-label={`Archive ${s.name}`}
                              onClick={() => setArchiving(s)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager
                page={page}
                total={resource.data.total}
                onChange={setPage}
              />
            </>
          ) : (
            <Empty
              icon={UserRound}
              title="No students found"
              description="Try a different filter, or register your first student."
              action={
                <Button variant="outline" onClick={() => open(null)}>
                  <Plus size={14} />
                  Add student
                </Button>
              }
            />
          )}
        </DataState>
      </Panel>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit student" : "Register a student"}
        wide
      >
        {editing && (
          <form onSubmit={save}>
            {formError && (
              <div role="alert" className="auth-error">
                {formError}
              </div>
            )}
            <div className="form-grid">
              {[
                ["name", "Full name"],
                ["admission_number", "Roll / admission number"],
                ["registration_number", "Registration number"],
                ["room_number", "Room number"],
                ["email", "Email"],
                ["mobile", "Mobile number"],
                ["course", "Course"],
                ["department", "Department"],
                ["academic_year", "Academic year"],
                ["semester", "Semester"],
                ["academic_session", "Academic session"],
                ["photo_url", "Photo URL"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={editing[key]}
                  type={key === "email" ? "email" : "text"}
                  required={[
                    "name",
                    "admission_number",
                    "registration_number",
                    "room_number",
                  ].includes(key)}
                  onChange={(e) => set(key, e.target.value)}
                />
              ))}
              <Field label="Hostel">
                <select
                  value={editing.hostel}
                  onChange={(e) => set("hostel", e.target.value)}
                  required
                >
                  <option value="">Select a hostel</option>
                  {hostels.data?.items
                    .filter((h) => h.active)
                    .map((h) => (
                      <option key={h.id}>{h.name}</option>
                    ))}
                </select>
              </Field>
              {!editing.id && (
                <>
                  <Field
                    label="Student login ID"
                    help="Optional: create portal access with this student."
                    value={editing.login_id}
                    onChange={(e) => set("login_id", e.target.value)}
                  />
                  <Field
                    label="Initial password"
                    type="password"
                    minLength={10}
                    autoComplete="new-password"
                    value={editing.password}
                    onChange={(e) => set("password", e.target.value)}
                    help="At least 10 characters; required with a login ID."
                  />
                </>
              )}
              <CheckLabel
                label="Account active"
                checked={editing.active}
                onChange={(v) => set("active", v)}
              />
              <CheckLabel
                label="Live QR access enabled"
                checked={editing.qr_enabled}
                onChange={(v) => set("qr_enabled", v)}
              />
            </div>
            <div className="form-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button loading={saving} type="submit">
                Save student
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={!!changingState}
        onClose={() => !saving && setChangingState(null)}
        title={changingState?.active ? "Suspend student" : "Reactivate student"}
      >
        <form onSubmit={saveState}>
          <p className="muted" style={{ marginBottom: 20 }}>
            {changingState?.name} ·{" "}
            {changingState?.active
              ? "Dashboard and QR access will be disabled immediately."
              : "Approved dashboard and QR access will be restored."}
          </p>
          {formError && (
            <div role="alert" className="auth-error">
              {formError}
            </div>
          )}
          <Field label="Reason">
            <textarea
              value={stateReason}
              onChange={(e) => setStateReason(e.target.value)}
              minLength={3}
              maxLength={1000}
              required
              rows={3}
            />
          </Field>
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setChangingState(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Confirm {changingState?.active ? "suspension" : "reactivation"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Student preview"
      >
        {preview && (
          <>
            <div className="profile-header">
              <Avatar name={preview.name} src={preview.photo_url} size={65} />
              <div>
                <h2>{preview.name}</h2>
                <Badge tone={preview.active ? "success" : "neutral"}>
                  {preview.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <dl className="detail-grid">
              {[
                ["Roll number", preview.admission_number],
                ["Registration", preview.registration_number],
                ["Hostel", preview.hostel],
                ["Room", preview.room_number],
                ["Course", preview.course],
                ["Academic year", preview.academic_year],
                ["Email", preview.email],
                ["Mobile", preview.mobile],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <Link
              className="btn btn-primary"
              to={`${basePath}/students/${preview.id}`}
            >
              Open full profile
              <ArrowUpRight size={14} />
            </Link>
          </>
        )}
      </Modal>
      <Modal
        open={!!archiving}
        onClose={() => setArchiving(null)}
        title="Archive this student?"
      >
        <p className="muted small">
          {archiving?.name} will lose portal and QR access. Their attendance
          history and linked records will be retained for reporting. This action
          does not physically delete the student.
        </p>
        <div className="form-actions">
          <Button variant="outline" onClick={() => setArchiving(null)}>
            Cancel
          </Button>
          <Button variant="destructive" loading={saving} onClick={archive}>
            Archive student
          </Button>
        </div>
      </Modal>
    </div>
  );
}
