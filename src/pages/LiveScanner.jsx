import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Clock,
  Gauge,
  Keyboard,
  Loader2,
  RefreshCw,
  Radio,
  ScanBarcode,
  ScanLine,
  ShieldAlert,
  ShieldAlert as AdminIcon,
  ShieldCheck,
  University,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { apiRequest } from "../lib/api";

const SCANNER_ID = "mess-live-qr-reader";
// Matches the `fps` value passed into Html5Qrcode.start() below — surfaced
// in the side panel as "scan rate" so the UI never fabricates a number.
const CAMERA_TARGET_FPS = 10;

/* ------------------------------------------------------------------ */
/* Theme (glass / glow / laser / grid / confetti keyframes)            */
/* Pure presentation: nothing here touches scanner/business logic.     */
/* ------------------------------------------------------------------ */
const SCANNER_THEME_CSS = `
/* ==========================================================================
   Live Mess Scanner — premium theme
   Deep-navy / royal-blue / cyan / emerald "secure access gate" system.
   Pure presentation: no selectors here ever touch scanner/business logic.
   ========================================================================== */

:root {
  --lms-navy-950: #05070f;
  --lms-navy-900: #0a0f1f;
  --lms-navy-800: #0e1630;
  --lms-navy-700: #131c3d;
  --lms-blue-500: #2a5cff;
  --lms-blue-400: #4d7bff;
  --lms-cyan-400: #29e7f5;
  --lms-cyan-300: #7df3fb;
  --lms-emerald-400: #22d68c;
  --lms-emerald-300: #6df5c1;
  --lms-amber-400: #f5a623;
  --lms-red-400: #ff4d5e;
  --lms-orange-400: #ff8a3d;
  --lms-purple-400: #9b6bff;
  --lms-ink-50: #eaf2ff;
  --lms-ink-300: #a9bde3;
  --lms-ink-500: #7c93be;
  --lms-glass-fill: rgba(13, 20, 41, 0.55);
  --lms-glass-fill-soft: rgba(13, 20, 41, 0.35);
  --lms-glass-border: rgba(148, 197, 255, 0.14);
}

.lms-scope {
  color-scheme: dark;
}

/* ---------------------------------------------------------------------- */
/* Background atmosphere                                                  */
/* ---------------------------------------------------------------------- */
@keyframes lms-drift-a {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(4%, -6%, 0) scale(1.08); }
}
@keyframes lms-drift-b {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-6%, 5%, 0) scale(1.12); }
}
@keyframes lms-drift-c {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(3%, 4%, 0) scale(1.05); }
}
@keyframes lms-noise-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-40px, -40px); }
}
@keyframes lms-twinkle {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.7; }
}

.lms-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 120% 80% at 15% -10%, rgba(42, 92, 255, 0.22), transparent 60%),
    radial-gradient(ellipse 100% 70% at 100% 10%, rgba(41, 231, 245, 0.14), transparent 55%),
    radial-gradient(ellipse 90% 70% at 50% 120%, rgba(34, 214, 140, 0.12), transparent 60%),
    linear-gradient(180deg, var(--lms-navy-950) 0%, var(--lms-navy-900) 45%, var(--lms-navy-950) 100%);
}
.lms-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  will-change: transform;
}
.lms-blob-1 { top: -10%; left: -8%; width: 42vw; height: 42vw; background: rgba(42, 92, 255, 0.35); animation: lms-drift-a 22s ease-in-out infinite; }
.lms-blob-2 { top: 30%; right: -10%; width: 36vw; height: 36vw; background: rgba(41, 231, 245, 0.22); animation: lms-drift-b 26s ease-in-out infinite; }
.lms-blob-3 { bottom: -14%; left: 25%; width: 40vw; height: 40vw; background: rgba(34, 214, 140, 0.18); animation: lms-drift-c 30s ease-in-out infinite; }

.lms-noise {
  position: absolute;
  inset: -40px;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: lms-noise-shift 1.4s steps(2) infinite;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.lms-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 20% 30%, rgba(234,242,255,0.9), transparent),
    radial-gradient(1.5px 1.5px at 70% 15%, rgba(234,242,255,0.7), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(234,242,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 85% 60%, rgba(234,242,255,0.8), transparent),
    radial-gradient(1px 1px at 55% 45%, rgba(234,242,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 10% 85%, rgba(234,242,255,0.7), transparent);
  background-size: 100% 100%;
  animation: lms-twinkle 4s ease-in-out infinite;
}

/* ---------------------------------------------------------------------- */
/* Glass surfaces                                                         */
/* ---------------------------------------------------------------------- */
.lms-glass {
  background: var(--lms-glass-fill);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--lms-glass-border);
}
.lms-glass-soft {
  background: var(--lms-glass-fill-soft);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  border: 1px solid var(--lms-glass-border);
}
@keyframes lms-shimmer {
  0% { transform: translateX(-120%) skewX(-12deg); }
  100% { transform: translateX(220%) skewX(-12deg); }
}
.lms-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0.05) 55%, transparent 70%);
  animation: lms-shimmer 3.2s ease-in-out infinite;
  pointer-events: none;
}

/* ---------------------------------------------------------------------- */
/* Scanner frame                                                          */
/* ---------------------------------------------------------------------- */
@keyframes lms-grid-pan {
  0% { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}
.lms-grid {
  background-image:
    linear-gradient(rgba(77, 123, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(77, 123, 255, 0.16) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: lms-grid-pan 6s linear infinite;
}
@keyframes lms-laser {
  0% { top: 6%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 94%; opacity: 0; }
}
.lms-laser {
  position: absolute;
  left: 6%;
  right: 6%;
  height: 2px;
  border-radius: 9999px;
  background: linear-gradient(90deg, transparent, var(--lms-cyan-300), var(--lms-blue-400), transparent);
  box-shadow: 0 0 12px 2px rgba(41, 231, 245, 0.8), 0 0 30px 6px rgba(42, 92, 255, 0.4);
  animation: lms-laser 2.6s ease-in-out infinite;
}
@keyframes lms-corner-pulse {
  0%, 100% { opacity: 0.55; filter: drop-shadow(0 0 2px rgba(41,231,245,0.5)); }
  50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(41,231,245,0.9)); }
}
.lms-corner { animation: lms-corner-pulse 2.4s ease-in-out infinite; }

@keyframes lms-frame-glow-idle {
  0%, 100% { box-shadow: 0 0 0 1px rgba(77,123,255,0.25), 0 0 30px 4px rgba(42,92,255,0.18), inset 0 0 40px rgba(42,92,255,0.06); }
  50% { box-shadow: 0 0 0 1px rgba(41,231,245,0.35), 0 0 46px 8px rgba(41,231,245,0.22), inset 0 0 50px rgba(41,231,245,0.08); }
}
.lms-frame-idle { animation: lms-frame-glow-idle 3.2s ease-in-out infinite; }

@keyframes lms-frame-glow-success {
  0%, 100% { box-shadow: 0 0 0 1px rgba(34,214,140,0.5), 0 0 40px 10px rgba(34,214,140,0.3); }
  50% { box-shadow: 0 0 0 1px rgba(109,245,193,0.7), 0 0 60px 16px rgba(34,214,140,0.4); }
}
.lms-frame-success { animation: lms-frame-glow-success 1.1s ease-in-out infinite; }

@keyframes lms-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.015); }
}
.lms-breathe { animation: lms-breathe 4.5s ease-in-out infinite; }

@keyframes lms-ripple {
  0% { transform: scale(0.3); opacity: 0.9; }
  100% { transform: scale(2.4); opacity: 0; }
}
.lms-ripple {
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 9999px;
  border: 2px solid var(--lms-cyan-300);
  animation: lms-ripple 1s ease-out infinite;
}

/* ---------------------------------------------------------------------- */
/* Status + indicator micro-motion                                       */
/* ---------------------------------------------------------------------- */
@keyframes lms-pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,214,140,0.55); }
  50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(34,214,140,0); }
}
.lms-pulse-dot { animation: lms-pulse-dot 1.8s ease-in-out infinite; }

@keyframes lms-wifi-wave {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.lms-wifi-bar-1 { animation: lms-wifi-wave 1.6s ease-in-out infinite; animation-delay: 0s; }
.lms-wifi-bar-2 { animation: lms-wifi-wave 1.6s ease-in-out infinite; animation-delay: 0.18s; }
.lms-wifi-bar-3 { animation: lms-wifi-wave 1.6s ease-in-out infinite; animation-delay: 0.36s; }

@keyframes lms-spin-slow { to { transform: rotate(360deg); } }
.lms-spin-slow { animation: lms-spin-slow 1.1s linear infinite; }

@keyframes lms-clock-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.lms-clock-hand { transform-origin: 50% 50%; animation: lms-clock-spin 3s linear infinite; }

@keyframes lms-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
  90% { transform: translateX(1px); }
}
.lms-shake { animation: lms-shake 0.5s ease-in-out; }

@keyframes lms-grow {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.lms-grow { animation: lms-grow 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

@keyframes lms-shield-flicker {
  0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
  50% { filter: drop-shadow(0 0 10px currentColor); }
}
.lms-shield-flicker { animation: lms-shield-flicker 1.6s ease-in-out infinite; }

@keyframes lms-check-draw {
  from { stroke-dashoffset: 48; }
  to { stroke-dashoffset: 0; }
}
.lms-check-path {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: lms-check-draw 0.5s 0.15s ease-out forwards;
}

@keyframes lms-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,214,140,0.45); }
  50% { box-shadow: 0 0 0 10px rgba(34,214,140,0); }
}
.lms-ring-pulse { animation: lms-ring-pulse 2s ease-in-out infinite; }

/* ---------------------------------------------------------------------- */
/* Confetti                                                                */
/* ---------------------------------------------------------------------- */
@keyframes lms-confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(220px) rotate(400deg); opacity: 0; }
}
.lms-confetti-piece { animation-name: lms-confetti-fall; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); animation-fill-mode: forwards; }

/* ---------------------------------------------------------------------- */
/* Scrollbar (subtle, matches theme)                                      */
/* ---------------------------------------------------------------------- */
.lms-scope ::-webkit-scrollbar { width: 8px; height: 8px; }
.lms-scope ::-webkit-scrollbar-thumb { background: rgba(77,123,255,0.35); border-radius: 9999px; }

@media (prefers-reduced-motion: reduce) {
  .lms-scope *, .lms-scope *::before, .lms-scope *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;

function ScannerTheme() {
  return <style>{SCANNER_THEME_CSS}</style>;
}

/* ------------------------------------------------------------------ */
/* Presentational sub-components                                       */
/* ------------------------------------------------------------------ */

function AnimatedBackground() {
  return (
    <div className="lms-bg" aria-hidden="true">
      <div className="lms-stars" />
      <div className="lms-blob lms-blob-1" />
      <div className="lms-blob lms-blob-2" />
      <div className="lms-blob lms-blob-3" />
      <div className="lms-noise" />
    </div>
  );
}

function WifiPulseIcon({ online }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={online ? "text-emerald-300" : "text-slate-500"}>
      <path
        d="M12 19.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z"
        fill="currentColor"
        className={online ? "lms-wifi-bar-1" : ""}
      />
      <path
        d="M8.3 14.8a5.2 5.2 0 0 1 7.4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={online ? "lms-wifi-bar-2" : ""}
      />
      <path
        d="M5 11.4a9.6 9.6 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={online ? "lms-wifi-bar-3" : ""}
      />
    </svg>
  );
}

function ScannerHeader({ meal, online }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="lms-glass relative overflow-hidden rounded-2xl px-4 py-4 sm:px-6 sm:py-5"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-gradient-to-br from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(41,231,245,0.45)]">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
              Live Mess Scanner
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-300/70 sm:text-[13px]">
              AI Powered Attendance Verification
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="lms-glass-soft flex items-center gap-2 rounded-xl2 px-3 py-2 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Current Meal</p>
              <p className="text-sm font-semibold text-white">{meal || "Closed"}</p>
            </div>
          </div>

          <div className="lms-glass-soft flex items-center gap-2 rounded-xl2 px-3 py-2">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{date}</p>
              <p className="font-mono text-sm font-semibold text-cyan-200">{time}</p>
            </div>
          </div>

          <div className="lms-glass-soft flex items-center gap-2 rounded-xl2 px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 lms-pulse-dot" : "bg-slate-500"}`}
              aria-hidden="true"
            />
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-200">
              <Radio size={13} className={online ? "text-emerald-300" : "text-slate-500"} />
              {online ? "Live" : "Offline"}
            </span>
            <WifiPulseIcon online={online} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

const ERROR_TONE_STYLES = {
  amber: { text: "text-amber-300", ring: "bg-amber-400/15", extraClass: "" },
  red: { text: "text-red-300", ring: "bg-red-400/15", extraClass: "lms-shake" },
  orange: { text: "text-orange-300", ring: "bg-orange-400/15", extraClass: "" },
  purple: { text: "text-purple-300", ring: "bg-purple-400/15", extraClass: "" },
  blue: { text: "text-cyan-300", ring: "bg-cyan-400/15", extraClass: "" },
};

const CORNER_POSITIONS = [
  { pos: "top-3 left-3", rotate: "0deg" },
  { pos: "top-3 right-3", rotate: "90deg" },
  { pos: "bottom-3 right-3", rotate: "180deg" },
  { pos: "bottom-3 left-3", rotate: "270deg" },
];

function CornerBracket({ position, rotate, tone }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`lms-corner absolute h-8 w-8 sm:h-10 sm:w-10 ${position}`}
      style={{ transform: `rotate(${rotate})` }}
      aria-hidden="true"
    >
      <path
        d="M2 16V6a4 4 0 0 1 4-4h10"
        fill="none"
        stroke={tone}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FRAME_TONE = {
  idle: { border: "border-blue-400/40", glow: "lms-frame-idle", stroke: "#4d7bff" },
  detecting: { border: "border-emerald-400/70", glow: "lms-frame-success", stroke: "#22d68c" },
  rejected: { border: "border-red-400/60", glow: "", stroke: "#ff4d5e" },
};

/**
 * Presentational wrapper around the camera surface.
 * `scannerId` MUST be rendered as a plain, always-mounted div with that id —
 * html5-qrcode attaches to it directly. Visibility is toggled with classes,
 * never by unmounting, to avoid breaking the existing camera lifecycle.
 */
function ScannerFrame({ scannerId, deviceMode, status, errorState }) {
  const showCameraSurface = deviceMode === "camera";
  const isDetecting = status === "validating";
  const isRejected = status === "rejected";
  const tone = isDetecting ? FRAME_TONE.detecting : isRejected ? FRAME_TONE.rejected : FRAME_TONE.idle;

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border-2 ${tone.border} ${tone.glow} transition-colors duration-500`}
    >
      {/* animated grid backdrop, only meaningful behind the live camera */}
      <div className={`lms-grid absolute inset-0 opacity-40 ${showCameraSurface ? "block" : "hidden"}`} aria-hidden="true" />

      <div className={`relative ${showCameraSurface ? "lms-breathe" : ""}`}>
        <div
          id={scannerId}
          className={`${showCameraSurface ? "block" : "hidden"} mx-auto aspect-square w-full max-h-[70vh] overflow-hidden rounded-[24px] bg-black sm:aspect-[4/3] lg:aspect-square`}
        />

        {showCameraSurface && (
          <>
            {CORNER_POSITIONS.map((c, i) => (
              <CornerBracket key={i} position={c.pos} rotate={c.rotate} tone={tone.stroke} />
            ))}
            {(status === "ready" || status === "starting") && <div className="lms-laser" aria-hidden="true" />}
          </>
        )}
      </div>

      <AnimatePresence>
        {isDetecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
            style={{ background: "rgba(5,7,15,0.55)" }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="lms-ripple" />
              <span className="lms-ripple" style={{ animationDelay: "0.35s" }} />
              <ScanLine size={34} className="relative z-10 text-emerald-300" />
            </div>
            <motion.p
              key="qr-detected"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300"
            >
              QR Detected
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <Loader2 size={14} className="lms-spin-slow" />
                Validating
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce [animation-delay:-0.3s]">.</span>
                  <span className="animate-bounce [animation-delay:-0.15s]">.</span>
                  <span className="animate-bounce">.</span>
                </span>
              </div>
              <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-emerald-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 2.4, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {isRejected && errorState && (
          <motion.div
            key="error-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{ background: "rgba(5,7,15,0.6)" }}
          >
            <div
              className={`lms-grow flex h-16 w-16 items-center justify-center rounded-full ${
                ERROR_TONE_STYLES[errorState.tone]?.ring || ERROR_TONE_STYLES.red.ring
              } ${ERROR_TONE_STYLES[errorState.tone]?.extraClass || ""}`}
            >
              <errorState.icon
                size={30}
                className={`lms-shield-flicker ${ERROR_TONE_STYLES[errorState.tone]?.text || ERROR_TONE_STYLES.red.text} ${
                  errorState.tone === "amber" ? "lms-clock-hand" : ""
                }`}
              />
            </div>
            <p className={`text-sm font-bold uppercase tracking-[0.16em] ${ERROR_TONE_STYLES[errorState.tone]?.text || ERROR_TONE_STYLES.red.text}`}>
              {errorState.title}
            </p>
            <p className="max-w-xs text-xs text-slate-300">{errorState.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function USBScannerCard({ hardwareInputRef, hardwareValue, onChange, onBlur, onSubmit }) {
  return (
    <div className="lms-glass lms-frame-idle relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-blue-400/30 px-6 py-10 text-center">
      <div className="lms-grid absolute inset-0 opacity-20" aria-hidden="true" />

      <div className="lms-glass-soft absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 lms-pulse-dot" />
        Connected
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-400/20">
          <span className="absolute inset-0 rounded-full border border-cyan-300/40 lms-ring-pulse" />
          <span className="absolute inset-2 rounded-full border border-blue-400/30" />
          <ScanBarcode size={44} className="text-cyan-200" />
        </div>

        <h2 className="font-display mt-5 text-xl font-semibold text-white">USB / Bluetooth Scanner</h2>

        <motion.p
          className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-cyan-300/80"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Waiting for USB Scanner...
        </motion.p>

        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          <Keyboard size={14} className="text-blue-300" />
          Listening in keyboard mode
        </div>

        {/* live character feedback, purely decorative */}
        <div className="mt-4 flex h-2 items-center gap-1" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors duration-150 ${
                i < Math.min(hardwareValue.length, 12) ? "bg-cyan-300 shadow-[0_0_6px_rgba(41,231,245,0.8)]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex w-full max-w-sm flex-col items-center">
          {/* Functionally identical input: visually hidden (not display:none) so it
              stays focused and keeps receiving hardware "keystrokes" + Enter. */}
          <input
            ref={hardwareInputRef}
            value={hardwareValue}
            onChange={onChange}
            onBlur={onBlur}
            autoFocus
            autoComplete="off"
            aria-label="Hardware scanner input"
            className="absolute h-px w-px overflow-hidden opacity-0"
            tabIndex={-1}
          />
          <button
            type="submit"
            className="group relative overflow-hidden rounded-xl2 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(41,231,245,0.35)] transition active:scale-[0.97]"
          >
            <span className="relative z-10">Submit scan</span>
            <span className="lms-shimmer absolute inset-0" />
          </button>
        </form>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#29e7f5", "#4d7bff", "#22d68c", "#f5a623", "#eaf2ff"];

function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.1 + Math.random() * 0.9,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      size: 4 + Math.random() * 5,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0 overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="lms-confetti-piece absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Visual-only countdown. Mirrors (but does not drive) the real 4000ms
 * resumeTimerRef timeout that already lives in the parent — this timer is
 * purely for the "Returning to scanner in 4 3 2 1" readout and never calls
 * resumeScanner itself.
 */
function useDisplayCountdown(seconds = 4) {
  const [count, setCount] = useState(seconds);
  useEffect(() => {
    setCount(seconds);
    const id = setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : 1));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return count;
}

function SuccessCard({ result }) {
  const s = result.student;
  const countdown = useDisplayCountdown(4);

  const details = [
    ["Registration No.", s.registration_number],
    ["Admission No.", s.admission_number],
    ["Course", s.course],
    ["Department", s.department],
    ["Year / Semester", [s.academic_year, s.semester].filter(Boolean).join(" / ")],
    ["Hostel", s.hostel],
    ["Room", s.room_number],
    ["Current Meal", result.meal],
    ["Scan Date", result.scan_date],
    ["Exact Scan Time", result.scan_time],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative"
    >
      <ConfettiBurst />

      {/* glow bloom behind the card */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[36px] bg-emerald-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[28px] border-2 border-emerald-400/50 lms-frame-success">
        <div className="lms-glass p-5 sm:p-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <circle cx="12" cy="12" r="11" stroke="#22d68c" strokeWidth="1.5" opacity="0.5" />
                <path
                  d="M7 12.5l3 3 7-7"
                  stroke="#6df5c1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lms-check-path"
                />
              </svg>
            </motion.div>
            <h2 className="font-display text-xl font-semibold text-emerald-200 sm:text-2xl">
              Attendance Marked Successfully
            </h2>
          </div>

          <div className="lms-shimmer relative mt-4 overflow-hidden rounded-[22px] border border-emerald-400/25 sm:mt-5" style={{ background: "rgba(9,14,28,0.65)" }}>
            <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-blue-700/90 to-cyan-600/90 px-4 py-3 text-white sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <University size={22} className="shrink-0 sm:size-[24px]" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold sm:text-base">Magadh Mahila College</p>
                  <p className="text-[10px] text-white/75">Digital Mess Attendance ID</p>
                </div>
              </div>
              <ShieldCheck size={26} className="shrink-0 sm:size-[28px]" />
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 sm:grid-cols-[130px_1fr] md:grid-cols-[160px_1fr]">
              <div className="mx-auto text-center sm:mx-0">
                <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-36">
                  <span className="absolute -inset-1.5 rounded-xl2 lms-ring-pulse" aria-hidden="true" />
                  <img
                    src={s.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`}
                    alt={s.name}
                    className="relative h-full w-full rounded-xl2 border-4 border-emerald-300/40 object-cover"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-3 inline-block rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300"
                >
                  MARKED
                </motion.div>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">{s.name}</h3>
                <p className="text-sm text-slate-400">Student ID: {s.registration_number}</p>
                <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 xs:grid-cols-2 sm:grid-cols-2">
                  {details.map(([label, value], i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="break-words text-sm font-semibold text-slate-100">{value || "—"}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Returning to scanner in
            <motion.span
              key={countdown}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 font-mono text-sm font-bold text-emerald-300"
            >
              {countdown}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const TONE_STYLES = {
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  red: "border-red-400/30 bg-red-400/10 text-red-200",
  orange: "border-orange-400/30 bg-orange-400/10 text-orange-200",
  purple: "border-purple-400/30 bg-purple-400/10 text-purple-200",
  blue: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
};

function StatCounter({ label, value, tone }) {
  return (
    <div className="lms-glass-soft rounded-xl2 px-3 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.4, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-mono text-lg font-bold ${tone}`}
      >
        {value}
      </motion.p>
    </div>
  );
}

function SidePanel({
  deviceMode,
  status,
  message,
  errorState,
  meal,
  scanCounts,
  cameraFps,
  cameras,
  cameraId,
  onSelectCamera,
  onActivateHardware,
  onCameraChange,
  onRestartOrFocus,
}) {
  const bannerTone = errorState ? TONE_STYLES[errorState.tone] : TONE_STYLES.blue;
  const BannerIcon = errorState?.icon;
  const online = status === "ready" || status === "validating" || status === "success";

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="lms-glass flex flex-col rounded-[26px] p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        {deviceMode === "hardware" ? (
          <ScanBarcode className="text-cyan-300" size={20} />
        ) : (
          <Camera className="text-cyan-300" size={20} />
        )}
        <h2 className="font-semibold text-white">{deviceMode === "hardware" ? "Hardware Scanner" : "Camera Scanner"}</h2>
      </div>

      <div role="status" aria-live="polite" className={`mt-4 flex items-start gap-2 rounded-xl2 border p-3 text-sm ${bannerTone}`}>
        {BannerIcon && <BannerIcon size={16} className="mt-0.5 shrink-0" />}
        <div>
          <p className="font-semibold">{errorState ? errorState.title : message}</p>
          {errorState && <p className="mt-0.5 text-xs opacity-80">{errorState.detail}</p>}
        </div>
      </div>

      {/* Live counters */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatCounter label="Scanned" value={scanCounts.total} tone="text-cyan-200" />
        <StatCounter label="Success" value={scanCounts.success} tone="text-emerald-300" />
        <StatCounter label="Rejected" value={scanCounts.rejected} tone="text-red-300" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="lms-glass-soft flex items-center justify-between rounded-xl2 px-3 py-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5"><Gauge size={13} className="text-blue-300" /> Scan rate</span>
          <span className="font-mono font-semibold text-white">{cameraFps} fps</span>
        </div>
        <div className="lms-glass-soft flex items-center justify-between rounded-xl2 px-3 py-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            {online ? <Wifi size={13} className="text-emerald-300" /> : <WifiOff size={13} className="text-slate-500" />}
            Link
          </span>
          <span className={`font-semibold ${online ? "text-emerald-300" : "text-slate-400"}`}>{online ? "Online" : "Idle"}</span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-400">Scanner device</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Scanner device">
          <button
            type="button"
            onClick={onSelectCamera}
            className={`relative flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl2 border px-2 py-2 text-xs font-semibold transition ${
              deviceMode === "camera"
                ? "border-cyan-300/60 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_16px_rgba(41,231,245,0.35)]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30"
            }`}
          >
            <Camera size={16} /> Camera
          </button>
          <button
            type="button"
            onClick={onActivateHardware}
            className={`relative flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl2 border px-2 py-2 text-xs font-semibold transition ${
              deviceMode === "hardware"
                ? "border-cyan-300/60 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_16px_rgba(41,231,245,0.35)]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30"
            }`}
          >
            <ScanBarcode size={16} /> USB Scanner
          </button>
        </div>
      </div>

      {deviceMode === "camera" && (
        <label className="mt-4 block text-xs font-semibold text-slate-400">
          Camera source
          <select
            value={cameraId}
            onChange={(event) => onCameraChange(event.target.value)}
            className="lms-glass-soft mt-1.5 w-full rounded-xl2 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
          >
            {!cameras.length && <option value="">Detecting cameras...</option>}
            {cameras.map((camera, index) => (
              <option key={camera.id} value={camera.id} className="bg-slate-900 text-white">
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        onClick={onRestartOrFocus}
        className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl2 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(41,231,245,0.3)] transition active:scale-[0.98]"
      >
        <RefreshCw size={15} />
        {deviceMode === "hardware" ? "Focus scanner input" : "Restart camera"}
        <span className="lms-shimmer absolute inset-0" />
      </button>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {deviceMode === "hardware"
          ? "Connect the scanner in keyboard mode. Its scan is submitted automatically when the device sends Enter."
          : "Camera access works on HTTPS or localhost. The scanner pauses during validation and resumes automatically after each result."}
      </p>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/* Sound                                                               */
/* ------------------------------------------------------------------ */
function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
    oscillator.onended = () => context.close();
  } catch (error) {
    console.warn("[MessScanner] success audio unavailable", error);
  }
}

/* ------------------------------------------------------------------ */
/* Error classification                                                */
/* Backend is expected to return either error.code or a message that   */
/* matches one of these patterns. This keeps the four required states  */
/* visually and textually distinct instead of one generic red banner.  */
/* ------------------------------------------------------------------ */
const ERROR_STATES = {
  QR_EXPIRED: {
    title: "QR Expired",
    detail: "Ask student to show the latest live QR",
    icon: Clock,
    tone: "amber",
  },
  QR_USED: {
    title: "QR Already Used",
    detail: "This code cannot be accepted again",
    icon: ShieldAlert,
    tone: "red",
  },
  QR_INVALID: {
    title: "Invalid Mess QR",
    detail: "This code could not be verified",
    icon: XCircle,
    tone: "red",
  },
  MEAL_ALREADY_MARKED: {
    title: "Meal Attendance Already Marked",
    detail: "This student's attendance for the current meal is already recorded",
    icon: AlertTriangle,
    tone: "orange",
  },
  ADMIN_SESSION_REQUIRED: {
    title: "Admin Session Required",
    detail: "Log out and sign in through the Admin or Super Admin portal",
    icon: AdminIcon,
    // Cosmetic-only change from the original "red": gives the
    // permissions/auth case its own identity (purple/shield-lock) per the
    // design brief, without touching how errors are classified.
    tone: "purple",
  },
};

function classifyError(error) {
  const code = error?.code || error?.data?.code;
  if (code && ERROR_STATES[code]) return ERROR_STATES[code];

  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("expired")) return ERROR_STATES.QR_EXPIRED;
  if (msg.includes("already used") || msg.includes("reused") || msg.includes("used already")) return ERROR_STATES.QR_USED;
  if (msg.includes("already marked") || msg.includes("already recorded")) return ERROR_STATES.MEAL_ALREADY_MARKED;
  if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("token expired")) return ERROR_STATES.ADMIN_SESSION_REQUIRED;
  return { ...ERROR_STATES.QR_INVALID, detail: error?.message || ERROR_STATES.QR_INVALID.detail };
}

/* ------------------------------------------------------------------ */
/* Main scanner                                                        */
/* ------------------------------------------------------------------ */
export default function LiveScanner() {
  const scannerRef = useRef(null);
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const recentRef = useRef(new Map());
  const resumeTimerRef = useRef(null);
  const mealRef = useRef(null);
  const startingRef = useRef(false);
  const hardwareInputRef = useRef(null);
  const deviceModeRef = useRef("hardware");

  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");
  const [deviceMode, setDeviceMode] = useState("hardware");
  const [hardwareValue, setHardwareValue] = useState("");
  const [meal, setMeal] = useState(null);
  const [status, setStatus] = useState("starting"); // starting | ready | validating | success | rejected | error
  const [message, setMessage] = useState("Checking camera and meal window…");
  const [errorState, setErrorState] = useState(null); // classified error for rejected state
  const [result, setResult] = useState(null);

  // UI-only counters for the side panel. They observe `status` transitions
  // below and never influence scanning, validation, or resume behavior.
  const [scanCounts, setScanCounts] = useState({ total: 0, success: 0, rejected: 0 });

  const resumeScanner = useCallback(() => {
    setResult(null);
    setErrorState(null);
    processingRef.current = false;
    try {
      scannerRef.current?.resume();
      setStatus("ready");
      setMessage("Ready to scan next student");
      if (deviceModeRef.current === "hardware") {
        setTimeout(() => hardwareInputRef.current?.focus(), 0);
      }
    } catch (error) {
      console.warn("[MessScanner] resume failed", error);
      setStatus("error");
      setMessage("Scanner could not resume. Restart the camera.");
    }
  }, []);

  const handleDecoded = useCallback(
    async (decodedText) => {
      const token = decodedText.trim();
      const now = Date.now();
      for (const [key, time] of recentRef.current) if (now - time > 30000) recentRef.current.delete(key);
      if (!token || processingRef.current || recentRef.current.has(token)) return;

      processingRef.current = true;
      recentRef.current.set(token, now);
      try {
        scannerRef.current?.pause(true);
      } catch (error) {
        console.warn("[MessScanner] pause failed", error);
      }

      setStatus("validating");
      setErrorState(null);
      setMessage("Validating live QR and marking attendance…");
      console.info("[MessScanner] QR decoded; validating with backend");

      try {
        const data = await apiRequest("/scanner/consume", {
          method: "POST",
          body: JSON.stringify({ token, meal: mealRef.current }),
        });
        setResult(data);
        setStatus("success");
        setMessage("Attendance marked");
        playSuccessSound();
        setScanCounts((c) => ({ ...c, total: c.total + 1, success: c.success + 1 }));
        resumeTimerRef.current = setTimeout(resumeScanner, 4000);
      } catch (error) {
        console.error("[MessScanner] validation rejected", error);
        const classified = classifyError(error);
        setErrorState(classified);
        setStatus("rejected");
        setMessage(classified.title);
        setScanCounts((c) => ({ ...c, total: c.total + 1, rejected: c.rejected + 1 }));
        resumeTimerRef.current = setTimeout(resumeScanner, 2800);
      }
    },
    [resumeScanner]
  );

  const startCamera = useCallback(
    async (preferredId) => {
      if (!mountedRef.current || startingRef.current || scannerRef.current?.isScanning) return;
      if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        setStatus("error");
        setMessage("Camera access requires HTTPS or localhost.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setMessage("This browser does not support camera access.");
        return;
      }
      try {
        startingRef.current = true;
        setStatus("starting");
        setMessage("Requesting camera permission…");
        const found = await Html5Qrcode.getCameras();
        if (!found.length) throw new Error("No camera was detected");
        if (!mountedRef.current) return;

        setCameras(found);
        const rear = found.find((c) => /back|rear|environment/i.test(c.label));
        const selected = preferredId || rear?.id || found[0].id;
        setCameraId(selected);

        const scanner = new Html5Qrcode(SCANNER_ID, false);
        scannerRef.current = scanner;
        await scanner.start(
          selected,
          {
            fps: CAMERA_TARGET_FPS,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.72);
              return { width: size, height: size };
            },
            aspectRatio: window.innerWidth < 640 ? 1 : 1.333,
          },
          handleDecoded,
          () => {}
        );
        if (!mountedRef.current) {
          await scanner.stop();
          await scanner.clear();
          if (scannerRef.current === scanner) scannerRef.current = null;
          return;
        } else {
          setStatus("ready");
          setMessage("Ready to scan live Mess QR");
          console.info("[MessScanner] camera started", { camera: selected, meal: mealRef.current });
        }
      } catch (error) {
        console.error("[MessScanner] camera start failed", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            error?.name === "NotAllowedError"
              ? "Camera permission denied. Allow camera access and try again."
              : error.message || "Unable to start camera"
          );
        }
      } finally {
        startingRef.current = false;
      }
    },
    [handleDecoded]
  );

  const restartCamera = useCallback(
    async (id = cameraId) => {
      if (startingRef.current) return;
      clearTimeout(resumeTimerRef.current);
      processingRef.current = false;
      const old = scannerRef.current;
      scannerRef.current = null;
      if (old) {
        try {
          if (old.isScanning) await old.stop();
          await old.clear();
        } catch (error) {
          console.warn("[MessScanner] cleanup before restart failed", error);
        }
      }
      await startCamera(id);
    },
    [cameraId, startCamera]
  );

  const activateHardwareScanner = useCallback(async () => {
    clearTimeout(resumeTimerRef.current);
    processingRef.current = false;
    const old = scannerRef.current;
    scannerRef.current = null;
    if (old) {
      try {
        if (old.isScanning) await old.stop();
        await old.clear();
      } catch (error) {
        console.warn("[MessScanner] camera cleanup for hardware scanner failed", error);
      }
    }
    deviceModeRef.current = "hardware";
    setDeviceMode("hardware");
    setHardwareValue("");
    setStatus("ready");
    setMessage("USB/Bluetooth scanner ready");
    setTimeout(() => hardwareInputRef.current?.focus(), 0);
  }, []);

  const selectCamera = useCallback(
    async (id) => {
      deviceModeRef.current = "camera";
      setDeviceMode("camera");
      setCameraId(id);
      await restartCamera(id);
    },
    [restartCamera]
  );

  const submitHardwareScan = useCallback(
    (event) => {
      event.preventDefault();
      const value = hardwareValue.trim();
      if (!value) return;
      setHardwareValue("");
      handleDecoded(value);
    },
    [handleDecoded, hardwareValue]
  );

  useEffect(() => {
    mountedRef.current = true;
    apiRequest("/scanner/status")
      .then((data) => {
        if (!mountedRef.current) return;
        mealRef.current = data.meal;
        setMeal(data.meal);
        if (!data.meal) {
          setStatus("error");
          setMessage("No meal scanning window is currently active");
          return;
        }
        activateHardwareScanner();
      })
      .catch((error) => {
        console.error("[MessScanner] status request failed", error);
        setStatus("error");
        setMessage(error.message);
      });

    return () => {
      mountedRef.current = false;
      clearTimeout(resumeTimerRef.current);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        const cleanup = scanner.isScanning ? scanner.stop().then(() => scanner.clear()) : scanner.clear();
        cleanup.catch((error) => console.warn("[MessScanner] camera cleanup failed", error));
      }
    };
  }, [activateHardwareScanner]);

  const online = status === "ready" || status === "validating" || status === "success";

  return (
    <div className="lms-scope relative min-h-screen overflow-x-hidden">
      <ScannerTheme />
      <AnimatedBackground />

      <div className="relative mx-auto w-full max-w-6xl space-y-4 px-3 pb-[env(safe-area-inset-bottom)] pt-4 sm:space-y-5 sm:px-4 sm:pt-6 lg:px-0">
        <ScannerHeader meal={meal} online={online} />

        {/* Success ID card replaces the scanner view */}
        {result && <SuccessCard result={result} />}

        {/* Scanner + side panel — stacks on mobile/tablet, side-by-side on desktop */}
        <div className={`${result ? "hidden" : "grid"} grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]`}>
          {deviceMode === "hardware" ? (
            <USBScannerCard
              hardwareInputRef={hardwareInputRef}
              hardwareValue={hardwareValue}
              onChange={(event) => setHardwareValue(event.target.value)}
              onBlur={() => setTimeout(() => hardwareInputRef.current?.focus(), 0)}
              onSubmit={submitHardwareScan}
            />
          ) : (
            <ScannerFrame scannerId={SCANNER_ID} deviceMode={deviceMode} status={status} errorState={errorState} />
          )}

          {/* The camera target div must stay mounted even while the USB card is
              shown, since html5-qrcode's lifecycle is keyed to its DOM id and
              we must not change camera start/stop logic. */}
          {deviceMode === "hardware" && <div id={SCANNER_ID} className="hidden" />}

          <SidePanel
            deviceMode={deviceMode}
            status={status}
            message={message}
            errorState={errorState}
            meal={meal}
            scanCounts={scanCounts}
            cameraFps={CAMERA_TARGET_FPS}
            cameras={cameras}
            cameraId={cameraId}
            onSelectCamera={() => selectCamera(cameraId)}
            onActivateHardware={activateHardwareScanner}
            onCameraChange={selectCamera}
            onRestartOrFocus={() => (deviceMode === "hardware" ? hardwareInputRef.current?.focus() : restartCamera())}
          />
        </div>
      </div>
    </div>
  );
}