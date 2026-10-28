import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

export function useData(path, interval = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    let timer = null;
    let inFlight = false;
    setLoading(true);
    setError("");
    setErrorStatus(null);
    setErrorCode(null);
    const fetchData = async () => {
      if (inFlight || !active) return;
      inFlight = true;
      try {
        const result = await apiRequest(path, { signal: controller.signal });
        if (active) {
          setData(result);
          setError("");
          setErrorStatus(null);
          setErrorCode(null);
        }
      } catch (e) {
        if (active && e.name !== "AbortError") {
          setError(e.message);
          setErrorStatus(e.status || null);
          setErrorCode(e.code || null);
          if (e.status === 401 || e.status === 403) clearInterval(timer);
        }
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };
    fetchData();
    timer = interval ? setInterval(fetchData, interval) : null;
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [path, version, interval]);
  return { data, loading, error, errorStatus, errorCode, reload, setData };
}
export function useDebounced(value, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function localDate(timezone = "Asia/Kolkata", value = new Date()) {
  return value.toLocaleDateString("en-CA", { timeZone: timezone });
}
