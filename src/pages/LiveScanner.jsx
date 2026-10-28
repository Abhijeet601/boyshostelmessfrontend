import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
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
import { localDate, useClock, useData } from "../lib/hooks";
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

function successSound() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.setValueAtTime(980, context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.onended = () => context.close();
  } catch {
    /* Sound is optional. */
  }
}
const errorTitles = {
  QR_INVALID: "Invalid QR code",
  QR_EXPIRED: "This QR code has expired",
  QR_USED: "This QR code has already been used",
  STUDENT_INACTIVE: "Student access is disabled",
  NO_ACTIVE_SESSION: "No active attendance session",
  UNAUTHORIZED_SCANNER: "Scanner access is restricted",
  NETWORK_ERROR: "Connection interrupted",
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
  const today = localDate(config.timezone);
  const recent = useData(
    scannerAllowed
      ? `/attendance?from_date=${today}&to_date=${today}&page_size=5`
      : null,
    15000,
  );
  const reloadRecent = recent.reload;
  const [mode, setMode] = useState("hardware");
  const [cameraId, setCameraId] = useState("");
  const [cameras, setCameras] = useState([]);
  const [running, setRunning] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [value, setValue] = useState("");
  const [state, setState] = useState("Ready");
  const [result, setResult] = useState(null);
  const [rejection, setRejection] = useState(null);
  const [sound, setSound] = useState(!!config.scanner_sound);
  const [counts, setCounts] = useState({
    total: 0,
    success: 0,
    duplicate: 0,
    rejected: 0,
  });
  const scanner = useRef(null);
  const lastCameraStop = useRef(0);
  const queue = useRef(Promise.resolve());
  const generation = useRef(0);
  const mounted = useRef(false);
  const processing = useRef(false);
  const resetTimer = useRef(null);
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
      setState("Ready");
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
          setState("Scanning");
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
    if (!mounted.current || !accessRef.current) return;
    processing.current = false;
    setResult(null);
    setRejection(null);
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
    if (
      modeRef.current === "hardware" &&
      document.activeElement === document.body
    )
      input.current?.focus();
  }, []);
  const process = useCallback(
    async (token) => {
      token = token.trim();
      if (!token || processing.current || !accessRef.current) return;
      processing.current = true;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- timer ref belongs to this station lifecycle, not a DOM node
      clearTimeout(resetTimer.current);
      setState("Processing");
      setResult(null);
      setRejection(null);
      try {
        scanner.current?.pause(true);
      } catch {
        /* Hardware mode has no camera. */
      }
      try {
        const response = await apiRequest("/scanner/consume", {
          method: "POST",
          body: JSON.stringify({ token, device_mode: modeRef.current }),
        });
        if (!mounted.current) return;
        setResult({ ...response, shownAt: Date.now() });
        setState("Success");
        setCounts((c) => ({
          ...c,
          total: c.total + 1,
          success: c.success + 1,
        }));
        if (soundRef.current) successSound();
        reloadRecent();
        resetTimer.current = setTimeout(reset, 4000);
      } catch (e) {
        if (!mounted.current) return;
        if (e.name === "AbortError") return;
        if (
          e.status === 401 ||
          (e.status === 403 && (!e.code || e.code === "UNAUTHORIZED_SCANNER"))
        ) {
          setAccessError(e.message);
          setState("Error");
          return;
        }
        const duplicate = ["ALREADY_MARKED", "MEAL_ALREADY_MARKED"].includes(e.code);
        setState(duplicate ? "Duplicate" : "Error");
        setRejection({
          title: errorTitles[e.code] || "Check-in could not be completed",
          message: e.message,
          duplicate,
          original: e.data?.original_time,
        });
        setCounts((c) => ({
          ...c,
          total: c.total + 1,
          duplicate: c.duplicate + (duplicate ? 1 : 0),
          rejected: c.rejected + (duplicate ? 0 : 1),
        }));
        resetTimer.current = setTimeout(reset, duplicate ? 4000 : 5000);
      }
    },
    [reloadRecent, reset],
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
      enqueue(clearCamera);
    };
  }, [enqueue, clearCamera]);
  useEffect(() => {
    if (scannerAllowed) return;
    clearTimeout(resetTimer.current);
    processing.current = false;
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
    clearTimeout(resetTimer.current);
    processing.current = false;
    setResult(null);
    setRejection(null);
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
  const remaining = result
    ? Math.min(
        4,
        Math.max(0, 4 - Math.floor((now.getTime() - result.shownAt) / 1000)),
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
              aria-label={sound ? "Mute success sound" : "Enable success sound"}
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
            <div className="tabs" style={{ marginBottom: 22 }}>
              <button
                className={mode === "camera" ? "active" : ""}
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
              {mode === "camera" && running && (
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
                  disabled={cameras.length < 2 || cameraBusy}
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
                  onClick={() =>
                    running ? stopCamera() : startCamera(cameraId)
                  }
                >
                  {running ? <Square size={14} /> : <Camera size={14} />}{" "}
                  {running ? "Stop" : "Start"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={cameraBusy}
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
                    disabled={processing.current}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </Field>
                <div className="actions" style={{ marginTop: 15 }}>
                  <Button
                    type="submit"
                    disabled={!value || processing.current}
                    loading={state === "Processing"}
                  >
                    <ScanLine size={14} />
                    Submit scan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
            {result && (
              <div className="scan-result" role="status" aria-live="polite">
                <div className="actions">
                  <span className="icon-tile tone-success">
                    <Check size={23} />
                  </span>
                  <div>
                    <h3>Attendance marked successfully</h3>
                    <p>{result.meal} check-in confirmed</p>
                  </div>
                </div>
                <div className="person">
                  <Avatar
                    name={result.student.name}
                    src={result.student.photo_url}
                    size={62}
                  />
                  <div>
                    <strong style={{ fontSize: 17 }}>
                      {result.student.name}
                    </strong>
                    <p className="muted">
                      {result.student.hostel} · Room{" "}
                      {result.student.room_number}
                    </p>
                  </div>
                </div>
                <dl className="detail-grid">
                  {[
                    ["Roll number", result.student.admission_number],
                    ["Registration", result.student.registration_number],
                    ["Meal", result.meal],
                    [
                      "Check-in time",
                      new Date(result.scanned_at).toLocaleString("en-IN", {
                        timeZone: config.timezone,
                      }),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="small text-success">
                  Ready for the next student in {remaining}s
                </p>
              </div>
            )}
            {rejection && (
              <div
                className={`scan-result ${rejection.duplicate ? "warning" : "error"}`}
                role="alert"
              >
                <div className="actions">
                  <AlertCircle size={22} />
                  <h3>{rejection.title}</h3>
                </div>
                <p>{rejection.message}</p>
                {rejection.original && (
                  <p>
                    Original check-in:{" "}
                    {new Date(rejection.original).toLocaleString("en-IN", {
                      timeZone: config.timezone,
                    })}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={reset}
                  style={{ marginTop: 15 }}
                >
                  Ready for next scan
                </Button>
              </div>
            )}
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
                ["Total scans", counts.total, ""],
                ["Successful", counts.success, "text-success"],
                ["Duplicates", counts.duplicate, ""],
                ["Rejected", counts.rejected, "text-error"],
              ].map(([label, value, tone]) => (
                <div className="scanner-stat" key={label}>
                  <strong className={tone}>{value}</strong>
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
            title="Recent check-ins"
            description="Latest verified attendance"
          >
            <DataState resource={recent}>
              {recent.data?.items.length ? (
                recent.data.items.map((r) => (
                  <div className="activity-item" key={r.id}>
                    <Avatar name={r.name} src={r.photo_url} size={32} />
                    <div>
                      <strong>{r.name}</strong>
                      <small>
                        {r.meal_type} ·{" "}
                        {new Date(r.scanned_at).toLocaleTimeString("en-IN", {
                          timeZone: config.timezone,
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <CheckCircle2
                      size={14}
                      color="#059669"
                      style={{ marginLeft: "auto" }}
                    />
                  </div>
                ))
              ) : (
                <Empty
                  title="Ready for the first check-in"
                  description="Today’s recent scans will appear here."
                />
              )}
            </DataState>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
