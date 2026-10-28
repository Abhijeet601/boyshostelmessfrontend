import { Badge } from "./ui";
export default function AttendanceCalendar({ days = [] }) {
  const offset = days.length
    ? new Date(`${days[0].date}T12:00:00`).getDay()
    : 0;
  return (
    <>
      <div className="calendar">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div className="calendar-weekday" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`offset-${i}`} />
        ))}
        {days.map((day) => (
          <div
            className="calendar-day"
            key={day.date}
            title={`${day.date}: ${Object.entries(day.meals)
              .map(([m, s]) => `${m}: ${s}`)
              .join(", ")}`}
          >
            <span>
              {new Date(`${day.date}T12:00:00`).toLocaleDateString("en-IN", {
                day: "numeric",
                ...(day.date.endsWith("01") ? { month: "short" } : {}),
              })}
            </span>
            <div className="calendar-dots">
              {Object.entries(day.meals).map(([meal, state]) => (
                <span
                  key={meal}
                  aria-label={`${meal}: ${state}`}
                  className={
                    state === "Present"
                      ? "present"
                      : state === "Missed"
                        ? "missed"
                        : state === "Not Yet Marked"
                          ? "pending"
                          : ""
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 17 }}>
        <Badge tone="success">Present</Badge>
        <Badge tone="error">Missed</Badge>
        <Badge tone="warning">Open session</Badge>
        <Badge>Upcoming / disabled</Badge>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        Each dot represents a meal. Hover over a day for its attendance details.
      </p>
    </>
  );
}
