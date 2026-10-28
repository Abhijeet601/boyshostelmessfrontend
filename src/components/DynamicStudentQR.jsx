import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useClock } from "../lib/hooks";
import { useApp } from "../context/AppContext";
import { Badge, Button } from "./ui";

export default function DynamicStudentQR({ student }) {
  const { config } = useApp();
  const now = useClock();
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skew, setSkew] = useState(0);
  const timer = useRef(null);
  const mounted = useRef(false);
  const running = useRef(false);
  const controller = useRef(null);
  const requestVersion = useRef(0);
  const refreshRef = useRef(null);
  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setQr(null);
    clearTimeout(timer.current);
    controller.current = new AbortController();
    try {
      const result = await apiRequest("/student/qr", {
        method: "POST",
        signal: controller.current.signal,
      });
      if (mounted.current && version === requestVersion.current) {
        setQr(result);
        setSkew(new Date(result.server_time).getTime() - Date.now());
        setError("");
        timer.current = setTimeout(
          () => refreshRef.current?.(),
          result.refresh_seconds * 1000,
        );
      }
    } catch (e) {
      if (
        mounted.current &&
        version === requestVersion.current &&
        e.name !== "AbortError"
      ) {
        setError(e.message);
        timer.current = setTimeout(() => refreshRef.current?.(), 10000);
      }
    } finally {
      if (version === requestVersion.current) {
        running.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }, []);
  refreshRef.current = refresh;
  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- invalidate pending requests during cleanup; this is not a DOM ref
      requestVersion.current++;
      running.current = false;
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- mutable timer is owned by this QR lifecycle
      clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, [refresh]);
  const remaining = qr
    ? Math.min(
        qr.ttl_seconds,
        Math.max(
          0,
          Math.ceil(
            (new Date(qr.expires_at).getTime() - now.getTime() - skew) / 1000,
          ),
        ),
      )
    : 0;
  const currentMeal = qr?.session;
  return (
    <section className="qr-pass">
      <div className="qr-pass-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: 5 }}>
            Your digital attendance pass
          </p>
          <h2>One scan. You’re checked in.</h2>
        </div>
        <Badge tone={remaining > 0 ? "success" : "neutral"}>
          {remaining > 0 ? "Live QR" : "Refreshing"}
        </Badge>
      </div>
      <div className="qr-pass-body">
        <div className="qr-info">
          <span className="icon-tile tone-indigo">
            <ShieldCheck size={19} />
          </span>
          <h3>{student?.name}</h3>
          <p className="muted">
            {student?.hostel} · Room {student?.room_number}
          </p>
          <p className="muted mono" style={{ marginTop: 6 }}>
            {student?.registration_number}
          </p>
          <div className="actions">
            <Badge tone={currentMeal ? "indigo" : "neutral"}>
              {currentMeal?.meal || "Between meal sessions"}
            </Badge>
          </div>
          <div className="actions">
            <span
              className={`qr-countdown ${remaining < 8 ? "text-error" : ""}`}
            >
              {remaining}s remaining
            </span>
            <Button variant="ghost" loading={loading} onClick={refresh}>
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>
          {error && (
            <p
              className="text-error small"
              role="alert"
              style={{ marginTop: 12 }}
            >
              {error}
            </p>
          )}
        </div>
        <div className="qr-frame" onContextMenu={(e) => e.preventDefault()}>
          {qr && remaining > 0 ? (
            <QRCode value={qr.token} size={190} fgColor="#1e1b4b" />
          ) : (
            <div className="skeleton" style={{ width: 190, height: 190 }} />
          )}
          <div className="qr-watermark">
            {student?.name} ·{" "}
            {now.toLocaleTimeString("en-IN", { timeZone: config.timezone })}
          </div>
        </div>
      </div>
      <div className="qr-pass-footer">
        <ShieldCheck size={14} />
        <span>
          Short-lived, single-use and verified securely. Present your current
          live code at the scanner.
        </span>
      </div>
    </section>
  );
}
