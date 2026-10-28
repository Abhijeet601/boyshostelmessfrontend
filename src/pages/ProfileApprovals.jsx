import { useState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "../lib/api";
import { useData } from "../lib/hooks";
import {
  Badge,
  Button,
  DataState,
  Empty,
  Field,
  Heading,
  Modal,
  Panel,
} from "../components/ui";
export default function ProfileApprovals() {
  const resource = useData("/admin/profile-change-requests");
  const [filter, setFilter] = useState("Pending Approval");
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = (item, result) => {
    setDecision({ item, result });
    setReason("");
    setError("");
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest(
        `/admin/profile-change-requests/${decision.item.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({
            decision: decision.result,
            admin_note: reason || null,
          }),
        },
      );
      toast.success(`Request ${decision.result.toLowerCase()}`);
      setDecision(null);
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const items =
    resource.data?.requests.filter((r) => !filter || r.status === filter) || [];
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Keep student details accurate"
        title="Profile requests"
        description="Review requested changes before they become part of a student’s record."
      />
      <div className="tabs">
        {["Pending Approval", "Approved", "Rejected", ""].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f || "All requests"}
          </button>
        ))}
      </div>
      <DataState resource={resource}>
        {items.length ? (
          items.map((r) => (
            <Panel
              key={r.id}
              title={r.name}
              description={`${r.registration_number} · ${r.hostel} · ${new Date(r.created_at + "Z").toLocaleDateString("en-IN")}`}
              action={
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
              }
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Current / original value</th>
                      <th>Requested value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(r.changes).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ textTransform: "capitalize" }}>
                          {key.replaceAll("_", " ")}
                        </td>
                        <td>{r.original[key] ?? "—"}</td>
                        <td className="text-accent">{value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {r.admin_note && (
                <p className="muted small" style={{ marginTop: 15 }}>
                  Review note: {r.admin_note}
                </p>
              )}
              {r.status === "Pending Approval" && (
                <div className="actions" style={{ marginTop: 20 }}>
                  <Button onClick={() => open(r, "Approved")}>
                    <Check size={14} />
                    Approve changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => open(r, "Rejected")}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                </div>
              )}
            </Panel>
          ))
        ) : (
          <Panel>
            <Empty
              icon={CheckCheck}
              title="No requests to review"
              description="Student profile updates will appear here."
            />
          </Panel>
        )}
      </DataState>
      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={
          decision?.result === "Approved"
            ? "Approve these changes?"
            : "Reject profile request"
        }
      >
        {decision && (
          <form onSubmit={submit}>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <p className="muted small" style={{ marginBottom: 20 }}>
              Reviewing {decision.item.name}’s profile update.
            </p>
            <Field
              label={
                decision.result === "Rejected"
                  ? "Rejection reason"
                  : "Review note (optional)"
              }
            >
              <textarea
                rows={3}
                required={decision.result === "Rejected"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
              />
            </Field>
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                loading={busy}
                variant={
                  decision.result === "Rejected" ? "destructive" : "primary"
                }
              >
                Confirm{" "}
                {decision.result === "Rejected" ? "rejection" : "approval"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
