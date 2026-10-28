import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Building2,
  Pencil,
  Plus,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
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
  Panel,
  SearchInput,
} from "../components/ui";

export default function Management({ kind }) {
  const hostelPage = kind === "hostels";
  const { basePath } = useApp();
  const [q, setQ] = useState("");
  const query = useDebounced(q);
  const resource = useData(`/${kind}?q=${encodeURIComponent(query)}`);
  const hostels = useData("/hostels");
  const stats = useData(hostelPage ? "/overview" : null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const open = (row) => {
    setError("");
    setEditing(
      hostelPage
        ? {
            name: row?.name || "",
            contact: row?.contact || "",
            description: row?.description || "",
            active: row ? !!row.active : true,
            id: row?.id,
          }
        : {
            login_id: row?.login_id || "",
            password: "",
            name: row?.name || "",
            email: row?.email || "",
            mobile: row?.mobile || "",
            photo_url: row?.photo_url || "",
            role: row?.role || "admin",
            hostel_scope: row?.hostel_scope || "",
            active: row ? !!row.active : true,
            scanner_enabled: row ? !!row.scanner_enabled : true,
            id: row?.id,
          },
    );
  };
  const set = (key, value) => setEditing((old) => ({ ...old, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { id, ...payload } = editing;
      if (!hostelPage) {
        if (!payload.password) delete payload.password;
        if (!payload.hostel_scope) payload.hostel_scope = null;
      }
      await apiRequest(`/${kind}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(hostelPage ? "Hostel saved" : "Administrator saved");
      setEditing(null);
      resource.reload();
      hostels.reload();
      stats.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const items =
    resource.data?.items.filter(
      (r) =>
        (!q ||
          `${r.name} ${r.login_id || ""}`
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (!status || !!r.active === (status === "active")),
    ) || [];
  return (
    <div className="page-stack">
      <Heading
        eyebrow="System administration"
        title={hostelPage ? "Hostel management" : "Admin management"}
        description={
          hostelPage
            ? "Manage your hostels, their students, and attendance performance."
            : "Give your team the right access to the right hostels."
        }
        actions={
          <Button onClick={() => open(null)}>
            <Plus size={15} />
            {hostelPage ? "Add hostel" : "Add administrator"}
          </Button>
        }
      />
      <Panel>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder={
              hostelPage ? "Search hostels…" : "Search name or login ID…"
            }
          />
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <DataState resource={resource}>
          {!items.length ? (
            <Empty
              icon={hostelPage ? Building2 : ShieldCheck}
              title={hostelPage ? "No hostels yet" : "No administrators found"}
              description="Add a record to get started, or adjust your filters."
            />
          ) : hostelPage ? (
            <div className="grid-3">
              {items.map((h) => {
                const stat = stats.data?.hostels.find((s) => s.name === h.name);
                return (
                  <div className="panel" key={h.id}>
                    <div className="panel-heading">
                      <span className="icon-tile tone-indigo">
                        <Building2 size={20} />
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${h.name}`}
                        onClick={() => open(h)}
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <h2>{h.name}</h2>
                    <p
                      className="muted small"
                      style={{ margin: "10px 0 17px" }}
                    >
                      {h.description || "Hostel attendance workspace"}
                    </p>
                    <Badge tone={h.active ? "success" : "neutral"}>
                      {h.active ? "Active" : "Inactive"}
                    </Badge>
                    <dl className="detail-grid">
                      <div>
                        <dt>Students</dt>
                        <dd>{h.students}</dd>
                      </div>
                      <div>
                        <dt>Administrators</dt>
                        <dd>{h.admins}</dd>
                      </div>
                      <div>
                        <dt>Present today</dt>
                        <dd>{stat?.present ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Attendance</dt>
                        <dd>{stat?.attendance ?? 0}%</dd>
                      </div>
                    </dl>
                    <Link
                      className="panel-link"
                      to={`${basePath}/reports?hostel=${encodeURIComponent(h.name)}`}
                    >
                      View analytics
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Administrator",
                      "Login ID",
                      "Role",
                      "Assigned hostel",
                      "Status",
                      "Scanner",
                      "Actions",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="person">
                          <Avatar name={a.name} src={a.photo_url} size={35} />
                          <div>
                            <strong>{a.name}</strong>
                            <small>{a.email || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="mono">{a.login_id}</td>
                      <td>{a.role.replaceAll("-", " ")}</td>
                      <td>{a.hostel_scope || "All hostels"}</td>
                      <td>
                        <Badge tone={a.active ? "success" : "neutral"}>
                          {a.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={a.scanner_enabled ? "indigo" : "warning"}>
                          {a.scanner_enabled ? "Allowed" : "Disabled"}
                        </Badge>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="icon-button"
                            aria-label={`Edit ${a.name}`}
                            onClick={() => open(a)}
                          >
                            <Pencil size={15} />
                          </button>
                          <Link
                            className="icon-button"
                            aria-label={`View activity for ${a.name}`}
                            to={`${basePath}/audit-logs?actor=${a.id}`}
                          >
                            <Activity size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </Panel>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          hostelPage
            ? editing?.id
              ? "Edit hostel"
              : "Add hostel"
            : editing?.id
              ? "Edit administrator"
              : "Add administrator"
        }
        wide
      >
        {editing && (
          <form onSubmit={save}>
            {error && (
              <div role="alert" className="auth-error">
                {error}
              </div>
            )}
            <div className="form-grid">
              <Field
                label={hostelPage ? "Hostel name" : "Full name"}
                required
                value={editing.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {hostelPage ? (
                <>
                  <Field
                    label="Contact details"
                    value={editing.contact}
                    onChange={(e) => set("contact", e.target.value)}
                  />
                  <Field label="Description" className="full-width">
                    <textarea
                      rows={3}
                      value={editing.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Login ID"
                    required
                    value={editing.login_id}
                    onChange={(e) => set("login_id", e.target.value)}
                  />
                  <Field
                    label={
                      editing.id
                        ? "Reset password (optional)"
                        : "Initial password"
                    }
                    required={!editing.id}
                    minLength={10}
                    type="password"
                    autoComplete="new-password"
                    value={editing.password}
                    onChange={(e) => set("password", e.target.value)}
                    help="Use at least 10 characters."
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={editing.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                  <Field
                    label="Phone"
                    value={editing.mobile}
                    onChange={(e) => set("mobile", e.target.value)}
                  />
                  <Field label="Role">
                    <select
                      value={editing.role}
                      onChange={(e) => set("role", e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  </Field>
                  <Field
                    label="Assigned hostel"
                    help="Admins can access only their assigned hostel."
                  >
                    <select
                      required={editing.role === "admin"}
                      value={editing.hostel_scope || ""}
                      onChange={(e) => set("hostel_scope", e.target.value)}
                    >
                      <option value="">Select a hostel</option>
                      {hostels.data?.items
                        .filter((h) => h.active)
                        .map((h) => (
                          <option key={h.id}>{h.name}</option>
                        ))}
                    </select>
                  </Field>
                  <CheckLabel
                    label="Scanner access enabled"
                    checked={editing.scanner_enabled}
                    onChange={(v) => set("scanner_enabled", v)}
                  />
                </>
              )}
              <CheckLabel
                label="Account active"
                checked={editing.active}
                onChange={(v) => set("active", v)}
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
              <Button type="submit" loading={saving}>
                Save {hostelPage ? "hostel" : "administrator"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
