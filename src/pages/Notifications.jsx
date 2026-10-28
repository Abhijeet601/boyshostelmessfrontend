import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Megaphone,
  Plus,
  Utensils,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
import { useData } from "../lib/hooks";
import {
  Button,
  DataState,
  Empty,
  Field,
  Heading,
  Modal,
} from "../components/ui";
const icons = {
  menu: Utensils,
  profile: UserCheck,
  announcement: Megaphone,
  attendance: CheckCheck,
  security: ShieldCheck,
};
export default function Notifications() {
  const { role, config, markRead, markAllRead, refreshNotifications } =
    useApp();
  const resource = useData("/notifications");
  const [filter, setFilter] = useState("all");
  const [kind, setKind] = useState("");
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items =
    resource.data?.items.filter(
      (n) => (filter !== "unread" || n.unread) && (!kind || n.kind === kind),
    ) || [];
  const groups = [
    ...new Set(
      items.map((n) =>
        new Date(n.created_at + "Z").toLocaleDateString("en-IN", {
          timeZone: config.timezone,
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ),
    ),
  ];
  const read = async (id, unread) => {
    try {
      await markRead(id, unread);
      resource.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const all = async () => {
    try {
      await markAllRead();
      resource.reload();
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error(e.message);
    }
  };
  const publish = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("/notifications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCompose(false);
      setForm({ title: "", body: "" });
      resource.reload();
      refreshNotifications();
      toast.success("Announcement published");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-stack" style={{ maxWidth: 1000 }}>
      <Heading
        eyebrow="Stay in the loop"
        title="Notification center"
        description={`${resource.data?.unread_count ?? 0} unread updates from your attendance workspace.`}
        actions={
          <>
            <Button variant="outline" onClick={all}>
              <CheckCheck size={14} />
              Mark all read
            </Button>
            {role !== "student" && (
              <Button onClick={() => setCompose(true)}>
                <Plus size={14} />
                Announcement
              </Button>
            )}
          </>
        }
      />
      <div className="toolbar">
        <div className="tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All updates
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>
        <select
          aria-label="Notification type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">All types</option>
          {[
            "attendance",
            "announcement",
            "menu",
            "profile",
            "security",
            "system",
          ].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>
      <DataState resource={resource}>
        {items.length ? (
          groups.map((date) => (
            <section key={date}>
              <p className="notification-date">{date}</p>
              {items
                .filter(
                  (n) =>
                    new Date(n.created_at + "Z").toLocaleDateString("en-IN", {
                      timeZone: config.timezone,
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }) === date,
                )
                .map((n) => {
                  const Icon = icons[n.kind] || Bell;
                  return (
                    <article
                      key={n.id}
                      className={`notification-row ${n.unread ? "unread" : ""}`}
                    >
                      <span className="icon-tile tone-indigo">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3>
                          {n.title}
                          {!!n.unread && (
                            <span
                              style={{
                                display: "inline-block",
                                width: 5,
                                height: 5,
                                borderRadius: 5,
                                background: "#6366f1",
                                marginLeft: 9,
                              }}
                            />
                          )}
                        </h3>
                        <p>{n.body}</p>
                        <small>
                          {new Date(n.created_at + "Z").toLocaleTimeString(
                            "en-IN",
                            {
                              timeZone: config.timezone,
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </small>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={
                          n.unread ? "Mark as read" : "Mark as unread"
                        }
                        title={n.unread ? "Mark as read" : "Mark as unread"}
                        onClick={() => read(n.id, !n.unread)}
                      >
                        <CheckCheck size={16} />
                      </button>
                    </article>
                  );
                })}
            </section>
          ))
        ) : (
          <Empty
            icon={Bell}
            title="You’re all caught up"
            description="Announcements and attendance updates will appear here."
          />
        )}
      </DataState>
      <Modal
        open={compose}
        onClose={() => setCompose(false)}
        title="Publish an announcement"
      >
        <form onSubmit={publish}>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <div className="page-stack">
            <Field
              label="Title"
              required
              minLength={2}
              maxLength={150}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Field label="Message">
              <textarea
                rows={5}
                required
                minLength={2}
                maxLength={2000}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-actions">
            <Button
              variant="outline"
              type="button"
              onClick={() => setCompose(false)}
            >
              Cancel
            </Button>
            <Button loading={busy}>Publish announcement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
