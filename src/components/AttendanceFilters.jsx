import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import { SearchInput } from "./ui";
export default function AttendanceFilters({
  filter,
  reports = false,
  onChange = () => {},
}) {
  const { role } = useApp();
  const hostels = useData(role !== "student" ? "/hostels" : null);
  const { values, set } = filter;
  const change = (key, value) => {
    set(key, value);
    onChange();
  };
  return (
    <div className="toolbar">
      {role !== "student" && (
        <SearchInput
          placeholder="Search name, roll or registration…"
          value={values.q}
          onChange={(v) => change("q", v)}
        />
      )}
      <input
        type="date"
        aria-label="From date"
        value={values.from_date}
        onChange={(e) => change("from_date", e.target.value)}
        max={values.to_date}
      />
      <input
        type="date"
        aria-label="To date"
        value={values.to_date}
        onChange={(e) => change("to_date", e.target.value)}
        min={values.from_date}
      />
      {role !== "student" && (
        <select
          aria-label="Hostel filter"
          value={values.hostel}
          onChange={(e) => change("hostel", e.target.value)}
        >
          <option value="">All hostels</option>
          {hostels.data?.items.map((h) => (
            <option key={h.id}>{h.name}</option>
          ))}
        </select>
      )}
      <select
        aria-label="Meal filter"
        value={values.meal}
        onChange={(e) => change("meal", e.target.value)}
      >
        <option value="">All meals</option>
        {["Breakfast", "Lunch", "Snacks", "Dinner"].map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      {!reports && (
        <select
          aria-label="Attendance status"
          value={values.status}
          onChange={(e) => change("status", e.target.value)}
        >
          <option value="Present">Present</option>
          <option value="Missed">Missed</option>
        </select>
      )}
      {reports && (
        <>
          <input
            aria-label="Course filter"
            placeholder="Course"
            value={values.course}
            onChange={(e) => change("course", e.target.value)}
          />
          <input
            aria-label="Academic year filter"
            placeholder="Academic year"
            value={values.year}
            onChange={(e) => change("year", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
