import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { localDate, useDebounced } from "./hooks";
import { queryString } from "./api";

export function useAttendanceFilters() {
  const { config } = useApp();
  const [params] = useSearchParams();
  const [values, setValues] = useState(() => ({
    q: params.get("q") || "",
    hostel: params.get("hostel") || "",
    meal: "",
    status: "Present",
    course: "",
    year: "",
    student_id: params.get("student_id") || "",
    from_date: localDate(config.timezone, new Date(Date.now() - 29 * 86400000)),
    to_date: localDate(config.timezone),
  }));
  const search = useDebounced(values.q);
  const set = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  return { values, set, query: queryString({ ...values, q: search }) };
}
