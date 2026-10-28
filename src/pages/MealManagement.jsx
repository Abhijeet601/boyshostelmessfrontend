import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Moon,
  Save,
  Utensils,
} from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { apiRequest } from "../lib/api";
import { localDate, useClock, useData } from "../lib/hooks";
import {
  Badge,
  Button,
  DataState,
  Field,
  Heading,
  Panel,
} from "../components/ui";
const meals = [
  ["breakfast", "Breakfast", Coffee],
  ["lunch", "Lunch", Utensils],
  ["snacks", "Snacks", Cookie],
  ["dinner", "Dinner", Moon],
];
export default function MealManagement() {
  const { role, config } = useApp();
  const now = useClock();
  const today = localDate(config.timezone);
  const [week, setWeek] = useState(today);
  const resource = useData(`/meal-menus?week=${week}`);
  const [menus, setMenus] = useState([]);
  const [saving, setSaving] = useState("");
  useEffect(() => {
    if (resource.data) setMenus(resource.data.menus);
  }, [resource.data]);
  const start = resource.data?.week_start || week;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${start}T12:00:00`);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-CA");
    return {
      menu_date: key,
      breakfast: "",
      lunch: "",
      snacks: "",
      dinner: "",
      ...menus.find((m) => m.menu_date === key),
    };
  });
  const todayMenu = days.find((d) => d.menu_date === today);
  const editable = role !== "student";
  const time = now.toLocaleTimeString("en-GB", {
    timeZone: config.timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const change = (day, key, value) =>
    setMenus((old) => [
      ...old.filter((m) => m.menu_date !== day.menu_date),
      { ...day, [key]: value },
    ]);
  const save = async (day) => {
    setSaving(day.menu_date);
    try {
      await apiRequest("/admin/meal-menus", {
        method: "PUT",
        body: JSON.stringify(
          Object.fromEntries(
            ["menu_date", ...meals.map((m) => m[0])].map((key) => [
              key,
              day[key],
            ]),
          ),
        ),
      });
      toast.success("Menu saved");
      resource.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving("");
    }
  };
  const shift = (amount) => {
    const d = new Date(`${week}T12:00:00`);
    d.setDate(d.getDate() + amount);
    setWeek(d.toLocaleDateString("en-CA"));
  };
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Good food, planned ahead"
        title="Meal menu"
        description={
          editable
            ? "Plan the week and keep everyone in the loop."
            : "See what’s being served, from breakfast through dinner."
        }
      />
      {todayMenu && (
        <div className="grid-4">
          {meals.map(([key, name, Icon]) => {
            const schedule = config.schedules?.find((s) => s.meal === name);
            const current =
              schedule &&
              (schedule.start < schedule.end
                ? time >= schedule.start && time < schedule.end
                : time >= schedule.start || time < schedule.end);
            return (
              <article className="menu-meal" key={key}>
                <div
                  className="actions"
                  style={{ justifyContent: "space-between" }}
                >
                  <span className="icon-tile tone-indigo">
                    <Icon size={18} />
                  </span>
                  <Badge tone={current ? "success" : "neutral"}>
                    {current
                      ? "Current"
                      : schedule && time >= schedule.end
                        ? "Completed"
                        : "Upcoming"}
                  </Badge>
                </div>
                <h3>{name}</h3>
                <small className="mono muted">
                  {schedule
                    ? `${schedule.start} – ${schedule.end}`
                    : "Time not configured"}
                </small>
                <p>{todayMenu[key] || "Menu not published yet"}</p>
              </article>
            );
          })}
        </div>
      )}
      <Panel
        title="The week ahead"
        description={`${new Date(`${start}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} · ${editable ? "Edit a day and save your changes" : "Your weekly mess menu"}`}
        action={
          <div className="actions">
            <button
              className="icon-button"
              onClick={() => shift(-7)}
              aria-label="Previous week"
            >
              <ChevronLeft size={17} />
            </button>
            <Button variant="ghost" onClick={() => setWeek(today)}>
              This week
            </Button>
            <button
              className="icon-button"
              onClick={() => shift(7)}
              aria-label="Next week"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        }
      >
        <DataState resource={resource}>
          <div className="week-menu">
            {days.map((day) => (
              <article
                key={day.menu_date}
                className={`week-day ${day.menu_date === today ? "today" : ""}`}
              >
                <h3>
                  {new Date(`${day.menu_date}T12:00:00`).toLocaleDateString(
                    "en-IN",
                    { weekday: "short", day: "numeric" },
                  )}
                  {day.menu_date === today && (
                    <span className="text-accent"> · Today</span>
                  )}
                </h3>
                {meals.map(([key, label]) => (
                  <Field label={label} key={key}>
                    {editable ? (
                      <textarea
                        rows={3}
                        aria-label={`${label} ${day.menu_date}`}
                        value={day[key]}
                        onChange={(e) => change(day, key, e.target.value)}
                      />
                    ) : (
                      <p>{day[key] || "—"}</p>
                    )}
                  </Field>
                ))}
                {editable && (
                  <Button
                    loading={saving === day.menu_date}
                    variant="secondary"
                    onClick={() => save(day)}
                  >
                    <Save size={12} />
                    Save day
                  </Button>
                )}
              </article>
            ))}
          </div>
        </DataState>
      </Panel>
    </div>
  );
}
