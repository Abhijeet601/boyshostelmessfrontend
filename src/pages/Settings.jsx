import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  DatabaseBackup,
  Download,
  Image,
  Palette,
  QrCode,
  RefreshCw,
  Save,
  ScanLine,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest, download } from "../lib/api";
import { useData } from "../lib/hooks";
import {
  Badge,
  Button,
  CheckLabel,
  DataState,
  Empty,
  Field,
  Heading,
  Modal,
  Panel,
} from "../components/ui";
const sections = [
  ["general", "General settings", Settings2],
  ["branding", "Institution branding", Image],
  ["hostels", "Hostel settings", Building2],
  ["timing", "Meal timing", Clock3],
  ["sessions", "Attendance sessions", CalendarClock],
  ["qr", "QR settings", QrCode],
  ["scanner", "Scanner settings", ScanLine],
  ["security", "Security", ShieldCheck],
  ["appearance", "Appearance", Palette],
  ["backup", "Backup & restore", DatabaseBackup],
];
export default function Settings() {
  const { basePath, setConfig } = useApp();
  const [params] = useSearchParams();
  const [active, setActive] = useState(params.get("section") || "general");
  const resource = useData("/settings");
  const backups = useData("/backups");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [restore, setRestore] = useState(null);
  const [backupBusy, setBackupBusy] = useState(false);
  useEffect(() => {
    if (resource.data) setForm(resource.data);
  }, [resource.data]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest("/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setConfig(updated);
      setForm(updated);
      toast.success("Settings saved");
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const backup = async () => {
    setBackupBusy(true);
    try {
      await apiRequest("/backups", { method: "POST" });
      backups.reload();
      toast.success("Backup created");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBackupBusy(false);
    }
  };
  const merge = async () => {
    setBackupBusy(true);
    try {
      const result = await apiRequest(`/backups/${restore}/restore`, {
        method: "POST",
      });
      toast.success(`${result.inserted} missing records restored`);
      setRestore(null);
      backups.reload();
      resource.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBackupBusy(false);
    }
  };
  const field = (key, label, type = "text", help) => (
    <Field
      key={key}
      label={label}
      type={type}
      value={form?.[key] ?? ""}
      help={help}
      onChange={(e) =>
        set(key, type === "number" ? Number(e.target.value) : e.target.value)
      }
    />
  );
  const canSave = [
    "general",
    "branding",
    "timing",
    "qr",
    "scanner",
    "appearance",
  ].includes(active);
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Make the workspace yours"
        title="System settings"
        description="Configure your institution, attendance policies, and operating preferences."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map(([key, label, Icon]) => (
            <button
              key={key}
              className={active === key ? "active" : ""}
              onClick={() => {
                setActive(key);
                setError("");
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <DataState resource={resource}>
          {form && (
            <Panel
              title={sections.find((s) => s[0] === active)?.[1]}
              description="Changes are validated and saved on the server."
            >
              <form onSubmit={save}>
                {error && (
                  <div className="auth-error" role="alert">
                    {error}
                  </div>
                )}
                {active === "general" && (
                  <div className="form-grid">
                    {field("app_name", "Application name")}
                    {field(
                      "academic_session",
                      "Academic session",
                      "text",
                      "For example, 2026–27",
                    )}
                    {field(
                      "timezone",
                      "Timezone",
                      "text",
                      "Use an IANA timezone, such as Asia/Kolkata.",
                    )}
                    {field("contact_email", "Contact email", "email")}
                    {field("contact_phone", "Contact phone")}
                  </div>
                )}
                {active === "branding" && (
                  <>
                    <div className="form-grid">
                      {field(
                        "institution_name",
                        "Institution name",
                        "text",
                        "Leave blank to use neutral application branding.",
                      )}
                      {field(
                        "logo_url",
                        "Institution logo URL",
                        "url",
                        "Public HTTP(S) image URL.",
                      )}
                    </div>
                    {form.logo_url && (
                      <div style={{ marginTop: 25 }}>
                        <p className="muted small" style={{ marginBottom: 10 }}>
                          Logo preview
                        </p>
                        <img
                          alt="Institution logo preview"
                          src={form.logo_url}
                          style={{
                            maxHeight: 80,
                            maxWidth: 200,
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {active === "hostels" && (
                  <>
                    <p className="muted small">
                      Manage hostel names, contact information, account status,
                      and administrator assignments in the hostel workspace.
                    </p>
                    <div className="actions" style={{ marginTop: 22 }}>
                      <Link
                        className="btn btn-primary"
                        to={`${basePath}/hostels`}
                      >
                        Manage hostels
                        <ArrowUpRight size={14} />
                      </Link>
                      <Link
                        className="btn btn-outline"
                        to={`${basePath}/admins`}
                      >
                        Assign administrators
                      </Link>
                    </div>
                  </>
                )}
                {active === "timing" && (
                  <>
                    <div className="notice" style={{ marginBottom: 25 }}>
                      <Clock3 size={17} />
                      Recurring timings apply to automatically generated
                      sessions. Date-specific and hostel-specific overrides
                      remain in effect. An end time before the start time
                      creates an overnight session.
                    </div>
                    <div className="page-stack">
                      {form.schedules.map((item, index) => (
                        <div
                          key={item.meal}
                          className="panel"
                          style={{ padding: 17 }}
                        >
                          <div
                            className="panel-heading"
                            style={{ marginBottom: 15 }}
                          >
                            <h3>{item.meal}</h3>
                            <CheckLabel
                              label="Attendance enabled"
                              checked={item.enabled}
                              onChange={(value) =>
                                set(
                                  "schedules",
                                  form.schedules.map((s, i) =>
                                    i === index ? { ...s, enabled: value } : s,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="form-grid">
                            <Field
                              label="Starts"
                              type="time"
                              required
                              value={item.start}
                              onChange={(e) =>
                                set(
                                  "schedules",
                                  form.schedules.map((s, i) =>
                                    i === index
                                      ? { ...s, start: e.target.value }
                                      : s,
                                  ),
                                )
                              }
                            />
                            <Field
                              label="Ends"
                              type="time"
                              required
                              value={item.end}
                              onChange={(e) =>
                                set(
                                  "schedules",
                                  form.schedules.map((s, i) =>
                                    i === index
                                      ? { ...s, end: e.target.value }
                                      : s,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {active === "sessions" && (
                  <>
                    <p className="muted small">
                      Configure a particular day or hostel without changing your
                      recurring meal schedule.
                    </p>
                    <Link
                      className="btn btn-primary"
                      style={{ marginTop: 22 }}
                      to={`${basePath}/sessions`}
                    >
                      Manage attendance sessions
                      <ArrowUpRight size={14} />
                    </Link>
                  </>
                )}
                {active === "qr" && (
                  <>
                    <div className="notice" style={{ marginBottom: 25 }}>
                      <ShieldCheck size={17} />
                      Live QR codes are opaque, single-use, and bound to student
                      accounts. Static QR downloads are unavailable.
                    </div>
                    <div className="form-grid">
                      {field(
                        "qr_ttl_seconds",
                        "Token expiry (seconds)",
                        "number",
                        "Allowed range: 15–120 seconds.",
                      )}
                      {field(
                        "qr_refresh_seconds",
                        "Refresh interval (seconds)",
                        "number",
                        "Must be shorter than the expiry period.",
                      )}
                    </div>
                    <Link
                      className="panel-link"
                      style={{ marginTop: 22 }}
                      to={`${basePath}/qr-management`}
                    >
                      View QR security
                      <ArrowUpRight size={14} />
                    </Link>
                  </>
                )}
                {active === "scanner" && (
                  <>
                    <CheckLabel
                      label="Play a subtle sound after successful scans"
                      checked={form.scanner_sound}
                      onChange={(value) => set("scanner_sound", value)}
                    />
                    <p className="muted small">
                      Operators can also mute their station. Both camera and
                      keyboard scanners use the same secure validation.
                    </p>
                    <div className="actions" style={{ marginTop: 22 }}>
                      <Link
                        className="btn btn-outline"
                        to={`${basePath}/scanner-management`}
                      >
                        Scanner health
                      </Link>
                      <Link
                        className="btn btn-outline"
                        to={`${basePath}/admins`}
                      >
                        Operator permissions
                      </Link>
                    </div>
                  </>
                )}
                {active === "security" && (
                  <>
                    <CheckLabel label="Allow rejected applicants to correct and resubmit their application" checked={form.registration_resubmission} onChange={value=>set('registration_resubmission',value)} />
                    <div className="notice">
                      <ShieldCheck size={18} />
                      Authentication, role permissions, active accounts, and
                      hostel scope are enforced by the backend. Password changes
                      revoke existing sessions.
                    </div>
                    <dl className="detail-grid">
                      <div>
                        <dt>QR tokens</dt>
                        <dd>Hashed at rest · short-lived</dd>
                      </div>
                      <div>
                        <dt>Attendance</dt>
                        <dd>Atomic validation · unique records</dd>
                      </div>
                      <div>
                        <dt>Passwords</dt>
                        <dd>PBKDF2 salted hashes</dd>
                      </div>
                      <div>
                        <dt>Abuse protection</dt>
                        <dd>Database-backed rate limits</dd>
                      </div>
                    </dl>
                    <Link
                      className="btn btn-outline"
                      to={`${basePath}/profile`}
                    >
                      Manage your password
                    </Link>
                  </>
                )}
                {active === "appearance" && (
                  <>
                    <p className="muted small" style={{ marginBottom: 20 }}>
                      Choose a workspace accent. The light appearance keeps
                      tables, passes, and scanner controls consistent.
                    </p>
                    <Field label="Accent">
                      <select
                        value={form.accent || "indigo"}
                        onChange={(e) => set("accent", e.target.value)}
                      >
                        <option value="indigo">Indigo</option>
                        <option value="violet">Violet</option>
                        <option value="blue">Blue</option>
                      </select>
                    </Field>
                    <div className="actions" style={{ marginTop: 22 }}>
                      <Badge tone="indigo">Selected accent</Badge>
                      <Badge tone="success">Light theme</Badge>
                    </div>
                    <p className="muted small" style={{ marginTop: 20 }}>
                      Motion follows the reduced-motion preference set on your
                      device.
                    </p>
                  </>
                )}
                {active === "backup" && (
                  <>
                    <div
                      className="notice notice-warning"
                      style={{ marginBottom: 23 }}
                    >
                      <DatabaseBackup size={18} />
                      Backups contain private institutional records and password
                      hashes. Keep downloads secure. Restore merges missing rows
                      and preserves existing records.
                    </div>
                    <Button type="button" loading={backupBusy} onClick={backup}>
                      <DatabaseBackup size={15} />
                      Create backup
                    </Button>
                    <div style={{ marginTop: 24 }}>
                      <DataState resource={backups}>
                        {backups.data?.items.length ? (
                          backups.data.items.map((b) => (
                            <div className="activity-item" key={b.name}>
                              <div
                                style={{
                                  minWidth: 0,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                <strong>{b.name}</strong>
                                <small>{(b.size / 1024).toFixed(1)} KB</small>
                              </div>
                              <div
                                className="actions"
                                style={{ marginLeft: "auto", flexShrink: 0 }}
                              >
                                <button
                                  className="icon-button"
                                  type="button"
                                  aria-label={`Download ${b.name}`}
                                  onClick={() =>
                                    download(
                                      `/backups/${b.name}`,
                                      b.name,
                                    ).catch((e) => toast.error(e.message))
                                  }
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  type="button"
                                  aria-label={`Restore missing rows from ${b.name}`}
                                  onClick={() => setRestore(b.name)}
                                >
                                  <RefreshCw size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <Empty
                            title="No backups yet"
                            description="Create a backup to preserve the current workspace."
                          />
                        )}
                      </DataState>
                    </div>
                  </>
                )}
                {canSave && (
                  <div className="form-actions">
                    <Button loading={saving}>
                      <Save size={14} />
                      Save changes
                    </Button>
                  </div>
                )}
              </form>
            </Panel>
          )}
        </DataState>
      </div>
      <Modal
        open={!!restore}
        onClose={() => setRestore(null)}
        title="Restore missing records?"
      >
        <p className="muted small">
          A fresh backup will be created first. Missing records from this backup
          will be added where their identifiers do not conflict. Existing
          records and settings will remain intact.
        </p>
        <div className="form-actions">
          <Button variant="outline" onClick={() => setRestore(null)}>
            Cancel
          </Button>
          <Button loading={backupBusy} onClick={merge}>
            Restore missing records
          </Button>
        </div>
      </Modal>
    </div>
  );
}
