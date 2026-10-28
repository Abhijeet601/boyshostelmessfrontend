import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarClock, Pencil, Plus, Radio, ScanLine } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
import { localDate, useData } from "../lib/hooks";
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
export default function Sessions() {
  const { config, basePath } = useApp();
  const location = useLocation();
  const [tab, setTab] = useState(
    location.pathname.endsWith("scanner-management") ? "devices" : "sessions",
  );
  const [day, setDay] = useState(localDate(config.timezone));
  const sessions = useData(`/sessions?day=${day}`);
  const scanners = useData("/scanners", 15000);
  const hostels = useData("/hostels");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = (row) => {
    setError("");
    setForm({
      meal: row?.meal || "Breakfast",
      session_date: day,
      start_time: row?.start_time || "07:30",
      end_time: row?.end_time || "09:30",
      hostel: row?.hostel || "*",
      active: row ? !!row.active : true,
    });
  };
  const set = (k, v) => setForm((old) => ({ ...old, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/sessions", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast.success("Attendance session saved");
      setForm(null);
      sessions.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Attendance operations"
        title="Scanners & sessions"
        description="Control when students can check in and who can operate a scanner."
        actions={
          <>
            <Link className="btn btn-outline" to={`${basePath}/scanner`}>
              <ScanLine size={15} />
              Open scanner
            </Link>
            <Button onClick={() => open(null)}>
              <Plus size={15} />
              Add session
            </Button>
          </>
        }
      />
      <div className="tabs">
        <button
          className={tab === "sessions" ? "active" : ""}
          onClick={() => setTab("sessions")}
        >
          Attendance sessions
        </button>
        <button
          className={tab === "devices" ? "active" : ""}
          onClick={() => setTab("devices")}
        >
          Scanner health
        </button>
      </div>
      {tab === "sessions" ? (
        <Panel
          title="Session schedule"
          description={`Server-validated windows · ${config.timezone}`}
          action={
            <input
              aria-label="Session date"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 9,
                fontSize: 11,
              }}
            />
          }
        >
          <DataState resource={sessions}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Meal",
                      "Date",
                      "Window",
                      "Hostel",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.data?.items.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.meal}</strong>
                      </td>
                      <td>{s.session_date}</td>
                      <td className="mono">
                        {s.start_time} – {s.end_time}
                      </td>
                      <td>{s.hostel === "*" ? "All hostels" : s.hostel}</td>
                      <td>
                        <Badge tone={s.active ? "success" : "neutral"}>
                          {s.active ? "Enabled" : "Disabled"}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${s.meal} session`}
                          onClick={() => open(s)}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="notice" style={{ marginTop: 18 }}>
              <CalendarClock size={17} />
              Hostel-specific sessions override the global schedule for that
              meal and date. Overnight windows are supported. Recurring timings
              are configured in Settings.
            </div>
          </DataState>
        </Panel>
      ) : (
        <Panel
          title="Authorized scanner operators"
          description="Online status is based on a heartbeat received in the last 60 seconds."
        >
          <DataState resource={scanners}>
            {scanners.data?.items.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "Operator",
                        "Hostel",
                        "Mode",
                        "Connection",
                        "Permission",
                        "Last seen",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scanners.data.items.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                        </td>
                        <td>{s.hostel_scope || "All hostels"}</td>
                        <td>{s.mode || "—"}</td>
                        <td>
                          <Badge tone={s.online ? "success" : "neutral"}>
                            {s.online ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            tone={s.scanner_enabled ? "indigo" : "warning"}
                          >
                            {s.scanner_enabled ? "Allowed" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="mono">
                          {s.last_seen
                            ? new Date(`${s.last_seen}Z`).toLocaleString(
                                "en-IN",
                                { timeZone: config.timezone },
                              )
                            : "Never connected"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty icon={Radio} title="No scanner operators yet" />
            )}
            <Link
              className="panel-link"
              style={{ marginTop: 20 }}
              to={`${basePath}/admins`}
            >
              Manage operator permissions →
            </Link>
          </DataState>
        </Panel>
      )}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title="Configure attendance session"
      >
        {form && (
          <form onSubmit={save}>
            {error && (
              <div role="alert" className="auth-error">
                {error}
              </div>
            )}
            <div className="form-grid">
              <Field label="Meal">
                <select
                  value={form.meal}
                  onChange={(e) => set("meal", e.target.value)}
                >
                  {["Breakfast", "Lunch", "Snacks", "Dinner"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Session date"
                type="date"
                required
                value={form.session_date}
                onChange={(e) => set("session_date", e.target.value)}
              />
              <Field
                label="Start time"
                type="time"
                required
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
              <Field
                label="End time"
                type="time"
                required
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
              <Field label="Hostel applicability" className="full-width">
                <select
                  value={form.hostel}
                  onChange={(e) => set("hostel", e.target.value)}
                >
                  <option value="*">All hostels</option>
                  {hostels.data?.items.map((h) => (
                    <option key={h.id}>{h.name}</option>
                  ))}
                </select>
              </Field>
              <CheckLabel
                label="Session enabled"
                checked={form.active}
                onChange={(v) => set("active", v)}
              />
            </div>
            <div className="form-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setForm(null)}
              >
                Cancel
              </Button>
              <Button loading={busy}>Save session</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
