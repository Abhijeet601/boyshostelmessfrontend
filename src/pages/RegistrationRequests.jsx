import { useEffect, useState } from "react";
import {
  Check,
  ClipboardList,
  Clock3,
  Eye,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, queryString } from "../lib/api";
import { useData, useDebounced } from "../lib/hooks";
import {
  Avatar,
  Badge,
  Button,
  DataState,
  Empty,
  Field,
  Heading,
  Metric,
  Modal,
  Pager,
  Panel,
  SearchInput,
} from "../components/ui";
import { TrendChart } from "../components/Charts";
const tone = (status) =>
  ({
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "error",
    SUSPENDED: "neutral",
  })[status] || "neutral";
const time = (value) =>
  value
    ? new Date(value.endsWith("Z") ? value : value + "Z").toLocaleString()
    : "—";
export default function RegistrationRequests() {
  const [q, setQ] = useState(""),
    [hostel, setHostel] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1);
  const search = useDebounced(q),
    hostels = useData("/hostels");
  const resource = useData(
    `/registration/requests?${queryString({ q: search, hostel, status, from_date: from, to_date: to, page })}`,
    15000,
  );
  const [selected, setSelected] = useState(null),
    [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState(""),
    [decision, setDecision] = useState(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const loadDetail = async (id) => {
    setDetail(null);
    setDetailError("");
    try {
      setDetail(await apiRequest(`/registration/requests/${id}`));
    } catch (e) {
      setDetailError(e.message);
    }
  };
  useEffect(() => {
    if (selected) loadDetail(selected);
  }, [selected]);
  const filter = (set, value) => {
    set(value);
    setPage(1);
  };
  const decide = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/registration/requests/${selected}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
      toast.success(
        decision === "APPROVED"
          ? "Student account approved"
          : "Application rejected",
      );
      setDecision(null);
      setSelected(null);
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const summary = resource.data?.summary || {};
  return (
    <div className="page-stack">
      <Heading
        eyebrow="WELCOME YOUR NEXT COMMUNITY"
        title="Student Registration Requests"
        description="Review new students, verify their details, and give them a secure start."
        actions={
          <Button
            variant="outline"
            loading={resource.loading}
            onClick={resource.reload}
          >
            <RefreshCw size={15} />
            Refresh
          </Button>
        }
      />
      <div className="metrics-grid registration-metrics">
        {[
          ["Total applications", "TOTAL", ClipboardList, "indigo"],
          ["Pending review", "PENDING", Clock3, "warning"],
          ["Approved", "APPROVED", UserCheck, "success"],
          ["Rejected", "REJECTED", UserX, "neutral"],
        ].map(([label, key, Icon, color]) => (
          <Metric
            key={key}
            label={label}
            value={summary[key] ?? 0}
            icon={Icon}
            tone={color}
            note="All time"
          />
        ))}
      </div>
      <Panel
        title="Application inbox"
        description="Every approval opens a new chapter."
      >
        <div className="toolbar registration-filters">
          <SearchInput
            value={q}
            onChange={(v) => filter(setQ, v)}
            placeholder="Search name, roll or registration"
          />
          <Field label="Hostel">
            <select
              value={hostel}
              onChange={(e) => filter(setHostel, e.target.value)}
            >
              <option value="">All permitted hostels</option>
              {hostels.data?.items.map((h) => (
                <option key={h.id}>{h.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => filter(setStatus, e.target.value)}
            >
              <option value="">All statuses</option>
              {["PENDING", "APPROVED", "REJECTED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Submitted from"
            type="date"
            value={from}
            onChange={(e) => filter(setFrom, e.target.value)}
          />
          <Field
            label="Submitted to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => filter(setTo, e.target.value)}
          />
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
                        "Roll / registration",
                        "Hostel",
                        "Course",
                        "Submitted",
                        "Status",
                        "Review",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.items.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="person">
                            <Avatar
                              src={app.photo_url}
                              name={app.name}
                              size={38}
                            />
                            <div>
                              <strong>{app.name}</strong>
                              <small className="mono">{app.reference}</small>
                            </div>
                          </div>
                        </td>
                        <td className="mono">
                          {app.admission_number}
                          <small>{app.registration_number}</small>
                        </td>
                        <td>
                          {app.hostel}
                          <small>Room {app.room_number}</small>
                        </td>
                        <td>
                          {app.course}
                          <small>{app.academic_year}</small>
                        </td>
                        <td>{time(app.created_at)}</td>
                        <td>
                          <Badge tone={tone(app.status)}>{app.status}</Badge>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            onClick={() => setSelected(app.id)}
                            aria-label={`Review ${app.name}`}
                          >
                            <Eye size={15} />
                            Details
                          </Button>
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
              title="Your inbox is clear"
              description="Student applications matching these filters will appear here."
            />
          )}
        </DataState>
      </Panel>
      <Panel
        title="Approval momentum"
        description="Students approved per day over the last 30 days"
      >
        {resource.data?.trend.length ? (
          <TrendChart
            data={resource.data.trend}
            value="value"
            label="date"
            name="Students approved"
          />
        ) : (
          <Empty
            title="A fresh start"
            description="Approval trends will appear after students are approved."
          />
        )}
      </Panel>
      <Modal
        open={!!selected}
        onClose={() => {
          if (!busy) {
            setSelected(null);
            setDecision(null);
          }
        }}
        title={
          decision
            ? decision === "APPROVED"
              ? "Approve this student?"
              : "Reject this application?"
            : "Application details"
        }
        drawer={!decision}
      >
        {decision ? (
          <form onSubmit={decide}>
            <div className="decision-summary">
              <ShieldCheck size={30} />
              <h3>{detail?.name}</h3>
              <p className="muted">
                {decision === "APPROVED"
                  ? "This creates an approved student account and enables secure QR access. The student will sign in separately."
                  : "The applicant can read your feedback on their secure status page."}
              </p>
            </div>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            {decision === "REJECTED" && (
              <Field label="Rejection reason">
                <textarea
                  required
                  minLength={3}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain what needs to be corrected"
                  rows={4}
                />
              </Field>
            )}
            <div className="form-actions">
              <Button
                variant="outline"
                type="button"
                disabled={busy}
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                loading={busy}
                type="submit"
                variant={decision === "REJECTED" ? "danger" : "primary"}
              >
                {decision === "APPROVED" ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                Confirm {decision === "APPROVED" ? "approval" : "rejection"}
              </Button>
            </div>
          </form>
        ) : detail ? (
          <div className="application-detail">
            <div className="review-person">
              <Avatar src={detail.photo_url} name={detail.name} size={74} />
              <div>
                <h2>{detail.name}</h2>
                <p className="mono muted small">{detail.reference}</p>
                <Badge tone={tone(detail.status)}>{detail.status}</Badge>
              </div>
            </div>
            <dl className="detail-grid">
              {[
                ["Email", "email"],
                ["Mobile", "mobile"],
                ["Roll number", "admission_number"],
                ["Registration", "registration_number"],
                ["Course", "course"],
                ["Department", "department"],
                ["Academic year", "academic_year"],
                ["Semester", "semester"],
                ["Academic session", "academic_session"],
                ["Hostel", "hostel"],
                ["Room", "room_number"],
                ["Login ID", "login_id"],
              ].map(([label, key]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{detail[key]}</dd>
                </div>
              ))}
              <div>
                <dt>Submitted</dt>
                <dd>{time(detail.created_at)}</dd>
              </div>
              {detail.reviewed_at && (
                <div>
                  <dt>Reviewed</dt>
                  <dd>{time(detail.reviewed_at)}</dd>
                </div>
              )}
            </dl>
            {detail.conflicts.map((c) => (
              <div key={c} className="notice notice-warning">
                {c}
              </div>
            ))}
            {detail.rejection_reason && (
              <div className="rejection-feedback">
                <strong>Rejection reason</strong>
                <p>{detail.rejection_reason}</p>
              </div>
            )}
            <h3>Approval history</h3>
            <ol className="approval-timeline">
              {detail.history.map((h, i) => (
                <li key={i}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{h.action.replaceAll("_", " ")}</strong>
                    <small>
                      {h.reviewer || "Applicant"} · {time(h.created_at)}
                    </small>
                    {(() => {
                      try {
                        const reason = JSON.parse(h.details).reason;
                        return reason ? <p>{reason}</p> : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </li>
              ))}
            </ol>
            {detail.status === "PENDING" && (
              <div className="sticky-review-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDecision("REJECTED");
                    setReason("");
                    setError("");
                  }}
                >
                  <X size={16} />
                  Reject
                </Button>
                <Button
                  disabled={detail.conflicts.length > 0}
                  onClick={() => {
                    setDecision("APPROVED");
                    setError("");
                  }}
                >
                  <Check size={16} />
                  Approve student
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div role={detailError ? "alert" : "status"} className="muted">
            {detailError || "Loading application…"}
            {detailError && (
              <Button onClick={() => loadDetail(selected)} variant="ghost">
                Retry
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
