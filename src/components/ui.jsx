/* oxlint-disable react/only-export-components */
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { apiRequest, getToken } from "../lib/api";
import { applicationCredential } from "../lib/registration";

export function Logo({ size = 38, src }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt="Institution logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 10,
          }}
        />
      ) : (
        <QrCode size={size * 0.57} strokeWidth={2.1} />
      )}
    </span>
  );
}
export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`btn btn-${variant} ${className}`}
    >
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Avatar({ src, name = "", size = 40, credential }) {
  credential = credential || (!getToken() ? applicationCredential() : null);
  const [privateSrc, setPrivateSrc] = useState(null);
  const protectedPhoto = src?.startsWith("/api/registration/photos/");
  useEffect(() => {
    if (!protectedPhoto) return;
    const controller = new AbortController();
    let url;
    setPrivateSrc(null);
    apiRequest(src.slice(4), {
      raw: true,
      signal: controller.signal,
      ...(credential
        ? { public: true, headers: { Authorization: `Bearer ${credential}` } }
        : {}),
    })
      .then((blob) => {
        if (!controller.signal.aborted) {
          url = URL.createObjectURL(blob);
          setPrivateSrc(url);
        }
      })
      .catch(() => {});
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, protectedPhoto, credential]);
  const imageSrc = protectedPhoto ? privateSrc : src;
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <span>
        {name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("") || "SM"}
      </span>
    </span>
  );
}
export function Heading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {description && <p className="muted small">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
function AnimatedNumber({ value }) {
  const reducedMotion = useReducedMotion();
  const previous = useRef(0);
  const [display, setDisplay] = useState(typeof value === "number" ? value : 0);
  useEffect(() => {
    if (typeof value !== "number") return;
    if (reducedMotion) {
      previous.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.3,
      ease: "easeOut",
      onUpdate: (current) => {
        previous.current = current;
        setDisplay(current);
      },
    });
    return () => controls.stop();
  }, [value, reducedMotion]);
  return typeof value === "number"
    ? (Number.isInteger(value)
        ? Math.round(display)
        : Math.round(display * 10) / 10
      ).toLocaleString("en-IN")
    : (value ?? "—");
}
export function Metric({
  label,
  value,
  icon: Icon,
  note,
  tone = "indigo",
  suffix = "",
}) {
  return (
    <motion.div
      className="metric"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="metric-top">
        <span className={`icon-tile tone-${tone}`}>
          {Icon && <Icon size={18} />}
        </span>
        <span className="metric-note">{note}</span>
      </div>
      <p className="metric-value">
        <AnimatedNumber value={value} />
        {suffix}
      </p>
      <p className="muted small">{label}</p>
    </motion.div>
  );
}
export function Loading({ rows = 4 }) {
  return (
    <div role="status" aria-label="Loading" className="skeleton-wrap">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton" key={i} style={{ height: i ? 62 : 110 }} />
      ))}
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "Records will appear here as your team gets started.",
  icon: Icon = QrCode,
  action,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p className="muted small">{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div role="alert" className="error-state">
      <AlertCircle size={20} />
      <div>
        <strong>We couldn’t load this information</strong>
        <p>{error}</p>
      </div>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function DataState({ resource, children }) {
  return resource.error ? (
    <ErrorState error={resource.error} retry={resource.reload} />
  ) : resource.loading && !resource.data ? (
    <Loading />
  ) : (
    children
  );
}
export function Field({
  label,
  help,
  error,
  children,
  className = "",
  ...props
}) {
  const id = useId();
  const enhance = (nodes) =>
    Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      if (["input", "select", "textarea"].includes(child.type))
        return cloneElement(child, {
          id,
          "aria-describedby": help ? `${id}-help` : undefined,
          "aria-invalid": error ? true : undefined,
        });
      return child.props.children
        ? cloneElement(child, {}, enhance(child.props.children))
        : child;
    });
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children ? (
        enhance(children)
      ) : (
        <input
          id={id}
          aria-describedby={help ? `${id}-help` : undefined}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      )}{" "}
      {help && <small id={`${id}-help`}>{help}</small>}
      {error && (
        <small role="alert" className="text-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Pager({ page, total, size = 10, onChange }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pager">
      <span className="muted small">
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}`
          : "0 records"}
      </span>
      <div className="actions">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ArrowLeft size={15} />
        </Button>
        <span className="small">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  drawer = false,
}) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("input,button,select,textarea")?.focus();
    const key = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = [
          ...(ref.current?.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select,textarea,a[href]",
          ) || []),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = scroll;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div
      className={`modal-backdrop ${drawer ? "drawer-backdrop" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`modal ${wide ? "modal-wide" : ""} ${drawer ? "drawer" : ""}`}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.section>
    </div>,
    document.body,
  );
}
export function CheckLabel({ label, checked, onChange }) {
  return (
    <label className="check-label">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
      {checked && <Check size={14} />}
    </label>
  );
}
export function AttendanceTable({ items, timezone, compact = false }) {
  return !items?.length ? (
    <Empty
      title="No attendance recorded"
      description="Successful QR check-ins will appear here."
    />
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            {!compact && <th>Hostel / room</th>}
            <th>Meal</th>
            <th>Check-in</th>
            <th>Status</th>
            {!compact && <th>Operator</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="person">
                  <Avatar src={r.photo_url} name={r.name} size={34} />
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {r.admission_number} · {r.registration_number}
                    </small>
                  </div>
                </div>
              </td>
              {!compact && (
                <td>
                  {r.hostel}
                  <small>Room {r.room_number}</small>
                </td>
              )}
              <td>{r.meal_type}</td>
              <td className="mono small">
                {r.scanned_at
                  ? new Date(r.scanned_at).toLocaleString("en-IN", {
                      timeZone: timezone,
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : `${r.meal_date} · No check-in`}
              </td>
              <td>
                <Badge tone={r.status === "Missed" ? "warning" : "success"}>
                  {r.status || "Present"}
                </Badge>
              </td>
              {!compact && <td>{r.operator || "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
