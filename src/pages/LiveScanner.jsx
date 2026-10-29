import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  Clock3,
  Keyboard,
  Radio,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
import { useClock, useData } from "../lib/hooks";
import ScanFeedback, { AnimatedScanCount } from "../components/ScanFeedback";
import {
  Avatar,
  Badge,
  Button,
  DataState,
  Empty,
  ErrorState,
  Field,
  Heading,
  Loading,
  Panel,
} from "../components/ui";

function scanSound(kind) {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    const frequencies =
      kind === "success"
        ? [740, 980]
        : kind === "duplicate"
          ? [440, 330]
          : [260, 190];
    oscillator.type = kind === "success" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequencies[0], context.currentTime);
    oscillator.frequency.setValueAtTime(frequencies[1], context.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.onended = () => context.close();
  } catch {
    /* Sound is optional. */
  }
}
const errorTitles = {
  QR_INVALID: "Invalid QR Code",
  QR_EXPIRED: "Expired QR Code",
  QR_USED: "QR Already Used",
  STUDENT_NOT_APPROVED: "Student Account Not Approved",
  STUDENT_SUSPENDED: "Student Account Suspended",
  STUDENT_INACTIVE: "Student access is disabled",
  NO_ACTIVE_SESSION: "No Active Meal Session",
  UNAUTHORIZED_SCANNER: "Scanner Not Authorized",
  NETWORK_ERROR: "Network Error",
  MEAL_ALREADY_MARKED: "Attendance Already Marked",
  ALREADY_MARKED: "Attendance Already Marked",
};
export default function LiveScanner() {
  const { config } = useApp();
  const now = useClock();
  const statusResource = useData("/scanner/status", 15000);
  const [accessError, setAccessError] = useState("");
  const scannerAllowed = Boolean(
    statusResource.data &&
    !statusResource.loading &&
    !statusResource.error &&
    !accessError,
  );
  const accessRef = useRef(scannerAllowed);
  accessRef.current = scannerAllowed;
  const [mode, setMode] = useState("hardware");
  const [cameraId, setCameraId] = useState("");
  const [cameras, setCameras] = useState([]);
  const [running, setRunning] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [value, setValue] = useState("");
  const [state, setState] = useState("Ready");
  const [feedback, setFeedback] = useState(null);
  const [activity, setActivity] = useState([]);
  const [sound, setSound] = useState(!!config.scanner_sound);
  const [counts, setCounts] = useState({
    total: 0,
    success: 0,
    duplicate: 0,
    invalid: 0,
  });
  const scanner = useRef(null);
  const lastCameraStop = useRef(0);
  const queue = useRef(Promise.resolve());
  const generation = useRef(0);
  const mounted = useRef(false);
  const processing = useRef(false);
  const resetTimer = useRef(null);
  const feedbackAnchor = useRef(null);
  const scanRequest = useRef(null);
  const eventId = useRef(0);
  const input = useRef(null);
  const handler = useRef(null);
  const modeRef = useRef(mode);
  const soundRef = useRef(sound);
  modeRef.current = mode;
  soundRef.current = sound;
  const enqueue = useCallback((fn) => {
    queue.current = queue.current.catch(() => {}).then(fn);
    return queue.current;
  }, []);
  const clearCamera = useCallback(async () => {
    const old = scanner.current;
    scanner.current = null;
    if (old) {
      try {
        if (old.isScanning) await old.stop();
      } catch {
        /* Browser may already have closed the track. */
      }
      try {
        old.clear();
      } catch {
        /* Container may have unmounted. */
      }
      lastCameraStop.current = Date.now();
    }
    document
      .querySelectorAll("#smartmess-camera video")
      .forEach((video) =>
        video.srcObject?.getTracks().forEach((track) => track.stop()),
      );
  }, []);
  const stopCamera = useCallback(async () => {
    generation.current++;
    await enqueue(clearCamera);
    if (mounted.current) {
      setRunning(false);
      setCameraBusy(false);
      if (!processing.current) setState("Ready");
    }
  }, [enqueue, clearCamera]);
  const startCamera = useCallback(
    async (preferred) => {
      const turn = ++generation.current;
      setCameraBusy(true);
      setCameraError("");
      setRunning(false);
      await enqueue(async () => {
        await clearCamera();
        // Give drivers a short handoff window after releasing the previous track.
        const handoff = Math.max(
          0,
          500 - (Date.now() - lastCameraStop.current),
        );
        if (handoff)
          await new Promise((resolve) => setTimeout(resolve, handoff));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (
          !mounted.current ||
          !accessRef.current ||
          turn !== generation.current
        )
          return;
        try {
          if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
            throw new Error(
              "Camera scanning needs HTTPS or localhost and a browser with camera support.",
            );
          let camera;
          for (let attempt = 0; attempt < 2; attempt++) {
            camera = new Html5Qrcode("smartmess-camera", false);
            scanner.current = camera;
            try {
              await camera.start(
                preferred
                  ? { deviceId: preferred }
                  : { facingMode: "environment" },
                {
                  fps: 10,
                  videoConstraints: {
                    ...(preferred
                      ? { deviceId: { exact: preferred } }
                      : { facingMode: { ideal: "environment" } }),
                    aspectRatio: { ideal: 4 / 3 },
                  },
                  qrbox: (width, height) => {
                    const size = Math.max(
                      50,
                      Math.floor(Math.min(width, height) * 0.67),
                    );
                    return { width: size, height: size };
                  },
                },
                (decoded) => handler.current?.(decoded),
                () => {},
              );
              break;
            } catch (error) {
              await clearCamera();
              if (
                attempt === 0 &&
                /NotReadable|NotFound|could not start video source/i.test(
                  String(error),
                )
              ) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                if (
                  !mounted.current ||
                  !accessRef.current ||
                  turn !== generation.current
                )
                  return;
              } else throw error;
            }
          }
          if (
            !mounted.current ||
            !accessRef.current ||
            turn !== generation.current
          ) {
            await clearCamera();
            return;
          }
          // Enumerate after permission is granted; opening a second probe stream
          // during a device handoff can fail on mobile and some camera drivers.
          const devices = await navigator.mediaDevices.enumerateDevices();
          const found = devices
            .filter((device) => device.kind === "videoinput")
            .map((device) => ({ id: device.deviceId, label: device.label }));
          if (
            !mounted.current ||
            !accessRef.current ||
            turn !== generation.current
          ) {
            await clearCamera();
            return;
          }
          setCameras(found);
          setCameraId(
            camera.getRunningTrackSettings()?.deviceId ||
              preferred ||
              found[0]?.id ||
              "",
          );
          setRunning(true);
          if (!processing.current) setState("Scanning");
        } catch (e) {
          await clearCamera();
          if (mounted.current && turn === generation.current) {
            setRunning(false);
            setState("Error");
            setCameraError(
              e?.name === "NotAllowedError" ||
                /permission|notallowed/i.test(String(e))
                ? "Camera permission denied. Allow camera access in your browser and select Start camera."
                : e.message || String(e),
            );
          }
        } finally {
          if (mounted.current && turn === generation.current)
            setCameraBusy(false);
        }
      });
    },
    [enqueue, clearCamera],
  );
  const reset = useCallback(() => {
    clearTimeout(resetTimer.current);
    if (!mounted.current) return;
    setFeedback(null);
    processing.current = false;
    setValue("");
    if (!accessRef.current) return;
    setState(
      modeRef.current === "camera" && scanner.current?.isScanning
        ? "Scanning"
        : "Ready",
    );
    try {
      scanner.current?.resume();
    } catch {
      /* Ready to recover manually if camera was stopped. */
    }
    if (modeRef.current === "hardware")
      requestAnimationFrame(() => {
        if (mounted.current && accessRef.current && !processing.current)
          input.current?.focus({ preventScroll: true });
      });
  }, []);
  const recordOutcome = useCallback(
    (event) => {
      const shownAt = Date.now();
      const entry = { ...event, shownAt, duration: 4000, id: ++eventId.current };
      setFeedback(entry);
      setState(
        event.kind === "success"
          ? "Success"
          : event.kind === "duplicate"
            ? "Duplicate"
            : "Error",
      );
      setCounts((c) => ({
        total: c.total + 1,
        success: c.success + (event.kind === "success" ? 1 : 0),
        duplicate: c.duplicate + (event.kind === "duplicate" ? 1 : 0),
        invalid: c.invalid + (event.kind === "invalid" ? 1 : 0),
      }));
      // Include rejected station scans alongside successful attendance events.
      setActivity((items) => [entry, ...items].slice(0, 12));
      if (soundRef.current) scanSound(event.kind);
      resetTimer.current = setTimeout(reset, entry.duration);
    },
    [reset],
  );
  useEffect(() => {
    if (!feedback) return;
    const frame = requestAnimationFrame(() => {
      const element = feedbackAnchor.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.top < 80 || bounds.top > window.innerHeight - 120)
        element.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [feedback]);
  const process = useCallback(
    async (token) => {
      token = token.trim();
      if (!token || processing.current || !accessRef.current) return;
      processing.current = true;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- timer ref belongs to this station lifecycle, not a DOM node
      clearTimeout(resetTimer.current);
      setState("Processing");
      setFeedback(null);
      const controller = new AbortController();
      scanRequest.current = controller;
      let timedOut = false;
      const requestTimeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 15000);
      try {
        scanner.current?.pause(true);
      } catch {
        /* Hardware mode has no camera. */
      }
      try {
        const response = await apiRequest("/scanner/consume", {
          method: "POST",
          body: JSON.stringify({ token, device_mode: modeRef.current }),
          signal: controller.signal,
        });
        if (!mounted.current) return;
        recordOutcome({ ...response, kind: "success" });
      } catch (e) {
        if (!mounted.current) return;
        if (e.name === "AbortError" && !timedOut) {
          reset();
          return;
        }
        const error = timedOut
          ? Object.assign(
              new Error(
                "The server took too long to respond. Attendance may have been recorded. Scan a fresh live QR to check safely.",
              ),
              { code: "NETWORK_ERROR" },
            )
          : e;
        const blocked =
          error.status === 401 ||
          (error.status === 403 && (!error.code || error.code === "UNAUTHORIZED_SCANNER"));
        const duplicate = ["ALREADY_MARKED", "MEAL_ALREADY_MARKED"].includes(
          error.code,
        );
        const invalidToken =
          error.status === 422 &&
          Array.isArray(error.data) &&
          error.data.some((issue) => issue.loc?.includes("token"));
        recordOutcome({
          ...error.data,
          kind: duplicate ? "duplicate" : "invalid",
          code: blocked
            ? "UNAUTHORIZED_SCANNER"
            : invalidToken ? "QR_INVALID" : error.code,
          title: blocked
            ? errorTitles.UNAUTHORIZED_SCANNER
            : invalidToken
              ? errorTitles.QR_INVALID
              : errorTitles[error.code] || "Check-in could not be completed",
          message: invalidToken
            ? "This QR does not contain a valid attendance pass. Ask the student to open their live QR in SmartMess."
            : error.message,
          meal: error.data?.meal || error.data?.session?.meal,
          blocked,
        });
        if (blocked) setAccessError(error.message);
      } finally {
        clearTimeout(requestTimeout);
        if (scanRequest.current === controller) scanRequest.current = null;
      }
    },
    [recordOutcome, reset],
  );
  handler.current = process;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- invalidate pending camera work during cleanup; this is not a DOM ref
      generation.current++;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- mutable timer is owned by this station lifecycle
      clearTimeout(resetTimer.current);
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- cancel this station's pending request during cleanup
      scanRequest.current?.abort();
      enqueue(clearCamera);
    };
  }, [enqueue, clearCamera]);
  useEffect(() => {
    if (scannerAllowed) return;
    stopCamera();
  }, [scannerAllowed, stopCamera]);
  useEffect(() => {
    if (!scannerAllowed) return;
    const controller = new AbortController();
    let active = true,
      timer = null,
      inFlight = false;
    const heartbeat = async () => {
      if (inFlight || !active) return;
      inFlight = true;
      try {
        await apiRequest(`/scanner/heartbeat?mode=${mode}`, {
          method: "POST",
          signal: controller.signal,
        });
      } catch (error) {
        if (
          active &&
          error.name !== "AbortError" &&
          (error.status === 401 || error.status === 403)
        ) {
          clearInterval(timer);
          setAccessError(error.message);
        }
      } finally {
        inFlight = false;
      }
    };
    heartbeat();
    timer = setInterval(heartbeat, 20000);
    return () => {
      active = false;
      clearInterval(timer);
      controller.abort();
    };
  }, [mode, scannerAllowed]);
  const switchMode = async (next) => {
    if (processing.current || cameraBusy) return;
    clearTimeout(resetTimer.current);
    setFeedback(null);
    setValue("");
    modeRef.current = next;
    setMode(next);
    setState("Ready");
    await stopCamera();
    if (next === "hardware") input.current?.focus();
  };
  const session = statusResource.data?.session;
  const submit = (e) => {
    e.preventDefault();
    const token = value;
    setValue("");
    process(token);
  };
  const scanLocked = state === "Processing" || Boolean(feedback);
  const remaining = feedback
    ? Math.min(
        4,
        Math.max(
          0,
          Math.ceil(
            (feedback.duration - (now.getTime() - feedback.shownAt)) / 1000,
          ),
        ),
      )
    : 0;
  if (!scannerAllowed)
    return (
      <div className="page-stack">
        <Heading
          eyebrow="Instant, secure check-ins"
          title="Live attendance scanner"
          description="Scanner access is verified before camera or keyboard scanning starts."
        />
        <div ref={feedbackAnchor} className="scanner-feedback-anchor">
          <ScanFeedback
            feedback={feedback}
            timezone={config.timezone}
            remaining={remaining}
            onDismiss={reset}
          />
        </div>
        <Panel title="Scanner access">
          {statusResource.loading ? (
            <Loading rows={2} />
          ) : (
            <ErrorState
              error={
                accessError ||
                statusResource.error ||
                "Scanner access could not be verified."
              }
              retry={() => {
                setAccessError("");
                statusResource.reload();
              }}
            />
          )}
        </Panel>
      </div>
    );
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Instant, secure check-ins"
        title="Live attendance scanner"
        description="Scan a student’s live QR. We’ll take care of the rest."
        actions={
          <>
            <Badge tone={session ? "success" : "warning"}>
              {session ? `${session.meal} session open` : "No active session"}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setSound((v) => !v)}
              aria-label={sound ? "Mute scanner sounds" : "Enable scanner sounds"}
            >
              {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}Sound{" "}
              {sound ? "on" : "off"}
            </Button>
          </>
        }
      />
      <div className="scanner-layout">
        <div className="scanner-main">
          <Panel
            title="Check-in station"
            description="Choose the scanner that works for you"
            action={
              <span className="icon-tile tone-indigo">
                <ScanLine size={18} />
              </span>
            }
          >
            <div ref={feedbackAnchor} className="scanner-feedback-anchor">
              <ScanFeedback
                feedback={feedback}
                timezone={config.timezone}
                remaining={remaining}
                onDismiss={reset}
              />
            </div>
            <div className="tabs" style={{ marginBottom: 22 }}>
              <button
                className={mode === "camera" ? "active" : ""}
                disabled={scanLocked || cameraBusy}
                onClick={() => switchMode("camera")}
              >
                <Camera
                  size={13}
                  style={{ display: "inline", marginRight: 7 }}
                />
                Camera
              </button>
              <button
                className={mode === "hardware" ? "active" : ""}
                disabled={scanLocked || cameraBusy}
                onClick={() => switchMode("hardware")}
              >
                <Keyboard
                  size={13}
                  style={{ display: "inline", marginRight: 7 }}
                />
                USB / Bluetooth
              </button>
            </div>
            <div className="scanner-preview">
              <div
                id="smartmess-camera"
                style={{ display: mode === "camera" ? "block" : "none" }}
              />
              {mode === "camera" && running && !scanLocked && (
                <div className="scanner-overlay">
                  <div className="scanner-line" />
                </div>
              )}
              {(!running || mode === "hardware") && (
                <div className="scanner-placeholder">
                  <span className="icon-tile tone-indigo">
                    {mode === "camera" ? (
                      <Camera size={32} />
                    ) : (
                      <Keyboard size={32} />
                    )}
                  </span>
                  <h3>
                    {mode === "camera"
                      ? "Ready when you are"
                      : "Ready for your scanner"}
                  </h3>
                  <p className="muted">
                    {mode === "camera"
                      ? "Start your camera and position the student’s live QR inside the frame."
                      : "Connect a USB or Bluetooth scanner in keyboard mode, focus the input below, and scan a live QR."}
                  </p>
                  {mode === "camera" && (
                    <Button
                      loading={cameraBusy}
                      disabled={scanLocked}
                      style={{ marginTop: 24 }}
                      onClick={() => startCamera(cameraId)}
                    >
                      <Camera size={15} />
                      Start camera
                    </Button>
                  )}
                </div>
              )}
            </div>
            {cameraError && (
              <div className="auth-error" role="alert">
                {cameraError}
              </div>
            )}
            {mode === "camera" ? (
              <div className="scanner-controls">
                <select
                  aria-label="Camera source"
                  disabled={scanLocked || cameraBusy}
                  value={cameraId}
                  onChange={(e) => {
                    setCameraId(e.target.value);
                    if (running) startCamera(e.target.value);
                  }}
                >
                  <option value="">Automatic camera selection</option>
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  disabled={cameras.length < 2 || cameraBusy || scanLocked}
                  onClick={() => {
                    const index = cameras.findIndex((c) => c.id === cameraId);
                    const next = cameras[(index + 1) % cameras.length];
                    if (next) startCamera(next.id);
                  }}
                >
                  Switch camera
                </Button>
                <Button
                  variant="outline"
                  loading={cameraBusy}
                  disabled={scanLocked && !running}
                  onClick={() =>
                    running ? stopCamera() : startCamera(cameraId)
                  }
                >
                  {running ? <Square size={14} /> : <Camera size={14} />}{" "}
                  {running ? "Stop" : "Start"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={cameraBusy || scanLocked}
                  onClick={() => startCamera(cameraId)}
                  aria-label="Restart camera"
                >
                  <RefreshCw size={15} />
                </Button>
              </div>
            ) : (
              <form className="hardware-input" onSubmit={submit}>
                <Field
                  label="Scanner input"
                  help="Select this field before scanning. Devices that send Enter submit automatically."
                >
                  <input
                    ref={input}
                    type="password"
                    aria-label="Hardware scanner input"
                    placeholder="Focus here, then scan a QR code"
                    autoComplete="off"
                    spellCheck={false}
                    value={value}
                    disabled={scanLocked}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </Field>
                <div className="actions" style={{ marginTop: 15 }}>
                  <Button
                    type="submit"
                    disabled={!value || scanLocked}
                    loading={state === "Processing"}
                  >
                    <ScanLine size={14} />
                    Submit scan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={scanLocked}
                    onClick={() => input.current?.focus()}
                  >
                    Focus scanner input
                  </Button>
                </div>
              </form>
            )}
            <div className="notice" style={{ marginTop: 20 }}>
              <ShieldCheck size={17} />
              Only live, single-use QR codes are accepted. Session timing,
              student access, and duplicate prevention are verified by the
              server.
            </div>
          </Panel>
        </div>
        <aside className="scanner-side">
          <Panel
            title="Scanner status"
            action={<Radio size={17} color="#818cf8" />}
          >
            <div className="actions">
              <Badge
                tone={
                  state === "Success"
                    ? "success"
                    : state === "Duplicate"
                      ? "warning"
                      : state === "Error"
                        ? "error"
                        : "indigo"
                }
              >
                {state}
              </Badge>
              <span className="muted small">
                {mode === "camera"
                  ? running
                    ? "Camera active"
                    : "Camera stopped"
                  : "Keyboard scanner"}
              </span>
            </div>
            <p className="muted small" style={{ marginTop: 15 }}>
              {state === "Processing"
                ? "Securely validating QR and recording attendance…"
                : state === "Ready" || state === "Scanning"
                  ? "Ready for a student’s live attendance pass."
                  : cameraError
                    ? "Check camera access or restart the camera to recover."
                    : "The scanner will resume automatically."}
            </p>
          </Panel>
          <Panel
            title="This station’s activity"
            description="Actual submissions during this visit"
          >
            <div className="scanner-stats">
              {[
                ["Total Scans", counts.total, ""],
                ["Successful Scans", counts.success, "text-success"],
                ["Duplicate Scans", counts.duplicate, "text-warning"],
                ["Invalid Scans", counts.invalid, "text-error"],
              ].map(([label, value, tone]) => (
                <div className="scanner-stat" key={label}>
                  <strong className={tone}>
                    <AnimatedScanCount value={value} />
                  </strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Current session"
            action={<Clock3 size={17} color="#818cf8" />}
          >
            <DataState resource={statusResource}>
              {session ? (
                <>
                  <div className="session-detail">
                    <span className="muted">Meal</span>
                    <strong>{session.meal}</strong>
                  </div>
                  <div className="session-detail">
                    <span className="muted">Date</span>
                    <span>{session.session_date}</span>
                  </div>
                  <div className="session-detail">
                    <span className="muted">Window</span>
                    <span className="mono">
                      {session.start_time} – {session.end_time}
                    </span>
                  </div>
                  <div className="session-detail">
                    <span className="muted">Status</span>
                    <Badge tone="success">Open</Badge>
                  </div>
                </>
              ) : (
                <p className="muted small">
                  No global session is open. Hostel-specific sessions are
                  checked against each student on the server.
                </p>
              )}
              <p className="muted small" style={{ marginTop: 12 }}>
                {config.timezone}
              </p>
            </DataState>
          </Panel>
          <Panel
            title="Recent scan activity"
            description="Latest 12 scans from this visit"
          >
            {activity.length ? (
              <ol className="scanner-activity" aria-label="Recent scan events">
                {activity.map((event) => (
                  <li className="activity-item" key={event.id}>
                    <Avatar
                      name={event.student?.name || "?"}
                      src={event.student?.photo_url}
                      size={32}
                    />
                    <div className="scanner-activity-person">
                      <strong>{event.student?.name || "Unidentified QR"}</strong>
                      <small>
                        {event.meal || "Meal unverified"} ·{" "}
                        {new Date(event.shownAt).toLocaleTimeString("en-IN", {
                          timeZone: config.timezone,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </small>
                      {event.kind === "invalid" && <small>{event.title}</small>}
                    </div>
                    <Badge
                      tone={
                        event.kind === "success"
                          ? "success"
                          : event.kind === "duplicate" ? "warning" : "error"
                      }
                    >
                      {event.kind === "success"
                        ? "Success"
                        : event.kind === "duplicate" ? "Duplicate" : "Invalid"}
                    </Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty
                title="Ready for the first scan"
                description="Successful, duplicate, and invalid scans will appear here."
              />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
