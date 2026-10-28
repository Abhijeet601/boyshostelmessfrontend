import { motion, useReducedMotion } from "framer-motion";
export default function ProgressRing({
  value = 0,
  label = "Attendance this period",
}) {
  const reduced = useReducedMotion(),
    safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className="attendance-ring"
      role="img"
      aria-label={`${safe}% ${label}`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#e5e7ff"
          strokeWidth="7"
        />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          pathLength="100"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="100"
          initial={{ strokeDashoffset: reduced ? 100 - safe : 100 }}
          animate={{ strokeDashoffset: 100 - safe }}
          transition={{ duration: reduced ? 0 : 0.35 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div>
        <strong>{safe}%</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}
