import { useEffect, useRef } from "react";
import { AnimatePresence, animate, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowRight, CircleX, Clock3, RotateCcw, ScanLine, TriangleAlert } from "lucide-react";
import { Avatar, Button } from "./ui";
import "./ScanFeedback.css";

function formatTimestamp(value, timezone, options) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString("en-IN", { timeZone: timezone, ...options });
}

export function AnimatedScanCount({ value }) {
  const reducedMotion = useReducedMotion();
  const element = useRef(null);
  const previous = useRef(value);
  useEffect(() => {
    if (!element.current) return;
    const from = previous.current;
    previous.current = value;
    if (reducedMotion || from === value) {
      element.current.textContent = value.toLocaleString("en-IN");
      return;
    }
    const controls = animate(from, value, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (element.current) element.current.textContent = Math.round(latest).toLocaleString("en-IN");
      },
    });
    return () => controls.stop();
  }, [value, reducedMotion]);
  return <span ref={element} aria-label={String(value)}>{value.toLocaleString("en-IN")}</span>;
}

function FeedbackIcon({ kind, reducedMotion }) {
  return (
    <motion.div
      className="scan-feedback-icon"
      aria-hidden="true"
      initial={reducedMotion ? false : { scale: 0.65, rotate: -8 }}
      animate={reducedMotion ? undefined : { scale: 1, rotate: kind === "duplicate" ? [0, -9, 8, -4, 0] : 0 }}
      transition={{ duration: 0.65, delay: 0.08 }}
    >
      {kind === "success" ? (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" opacity="0.28" />
          <motion.path
            d="M14 24.5L21 31L34 17"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
          />
        </svg>
      ) : kind === "duplicate" ? <TriangleAlert size={43} strokeWidth={1.8} /> : <CircleX size={43} strokeWidth={1.8} />}
    </motion.div>
  );
}

function FeedbackCard({ feedback, timezone, remaining, onDismiss }) {
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const card = useRef(null);
  useEffect(() => {
    card.current?.focus({ preventScroll: true });
  }, []);
  const { kind, student, meal } = feedback;
  const duplicate = kind === "duplicate";
  const success = kind === "success";
  const title = duplicate
    ? "ATTENDANCE ALREADY MARKED!"
    : success ? "ATTENDANCE MARKED SUCCESSFULLY!" : feedback.title || "Unable to scan QR code";
  const message = duplicate
    ? "This student has already marked attendance for this meal."
    : success ? "Check-in confirmed. Your student is ready for this meal." : feedback.message;
  const recordedAt = duplicate
    ? feedback.alreadyMarkedAt || feedback.original_time
    : feedback.scanned_at;
  const duration = feedback.duration || (kind === "invalid" ? 5000 : 4000);
  const details = student ? [
    ["Roll number", student.admission_number || student.rollNumber],
    ["Registration number", student.registration_number || student.registrationNumber],
    ["Hostel", student.hostel],
    ["Room number", student.room_number || student.room],
    ["Current meal", meal],
    [duplicate ? "Original attendance date" : "Attendance date", formatTimestamp(recordedAt, timezone, { day: "2-digit", month: "short", year: "numeric" })],
    [duplicate ? "Original attendance time" : "Attendance time", formatTimestamp(recordedAt, timezone, { hour: "2-digit", minute: "2-digit", second: "2-digit" })],
  ] : [];

  return (
    <motion.section
      ref={card}
      tabIndex={-1}
      className={`scan-feedback scan-feedback-${kind}`}
      data-testid="scan-feedback"
      style={{ pointerEvents: isPresent ? undefined : "none" }}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, x: duplicate ? [0, -4, 4, -2, 2, 0] : 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: reducedMotion ? 0.1 : 0.38, ease: "easeOut" }}
      aria-label={title}
    >
      <div className="scan-feedback-heading">
        <FeedbackIcon kind={kind} reducedMotion={reducedMotion} />
        <div>
          <span className="scan-feedback-eyebrow">{duplicate ? "Duplicate detected" : success ? "Check-in complete" : "Scan needs attention"}</span>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
      </div>

      {student && (
        <div className="scan-feedback-student">
          <div className="scan-feedback-person">
            <Avatar name={student.name} src={student.photo_url || student.photoUrl} size={64} />
            <div>
              <h3>{student.name}</h3>
              <span className="scan-feedback-status"><span />{duplicate ? "DUPLICATE SCAN" : success ? "ATTENDANCE MARKED" : "SCAN REJECTED"}</span>
            </div>
          </div>
          <dl className="scan-feedback-details">
            {details.map(([label, value]) => (
              <div key={label} className={label.includes("time") ? "scan-feedback-time" : undefined}>
                <dt>{label}</dt>
                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="scan-feedback-footer">
        {feedback.blocked ? (
          <span className="scan-feedback-countdown">Scanning paused. Verify your scanner access to continue.</span>
        ) : (
          <span className="scan-feedback-countdown" aria-hidden="true">
            <Clock3 size={14} /> Ready for next scan in {Math.max(0, remaining)}s
          </span>
        )}
        <Button type="button" className="scan-feedback-dismiss" onClick={onDismiss} disabled={!isPresent}>
          {kind === "invalid" ? <RotateCcw size={16} /> : <ScanLine size={16} />}
          {feedback.blocked ? "Review Scanner Access" : kind === "invalid" ? "Try Again" : "Scan Next Student"}
          <ArrowRight size={15} />
        </Button>
      </div>
      {!feedback.blocked && <div className="scan-feedback-progress" aria-hidden="true">
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: reducedMotion ? 1 : 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      </div>}
    </motion.section>
  );
}

export default function ScanFeedback({ feedback, timezone, remaining = 0, onDismiss }) {
  // Keep the live regions mounted so screen readers announce a new scan once.
  const announcement = feedback
    ? feedback.kind === "duplicate"
      ? `Attendance already marked! ${feedback.student?.name || "This student"} has already marked attendance for ${feedback.meal || "this meal"}.`
      : feedback.kind === "success"
        ? `Attendance marked successfully! ${feedback.student?.name || "Student"}, ${feedback.meal || "current meal"}.`
        : `${feedback.title || "Scan rejected"}. ${feedback.message || "Please try again."}`
    : "";
  return (
    <>
      <span className="scan-feedback-sr" role="alert" aria-atomic="true">{feedback?.kind !== "success" ? announcement : ""}</span>
      <span className="scan-feedback-sr" role="status" aria-atomic="true">{feedback?.kind === "success" ? announcement : ""}</span>
      <AnimatePresence mode="wait">
        {feedback && <FeedbackCard key={feedback.shownAt} feedback={feedback} timezone={timezone} remaining={remaining} onDismiss={onDismiss} />}
      </AnimatePresence>
    </>
  );
}
