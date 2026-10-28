import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Moon,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  UserX,
  Utensils,
  Zap,
  Building2,
  Activity,
  Percent,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import {
  AttendanceTable,
  Avatar,
  Badge,
  DataState,
  Empty,
  Heading,
  Metric,
  Panel,
} from "../components/ui";
import { BarsChart, DonutChart, TrendChart } from "../components/Charts";
import DynamicStudentQR from "../components/DynamicStudentQR";
import MealMenuSummary from "../components/MealMenuSummary";
import AttendanceCalendar from "../components/AttendanceCalendar";
import EnrollmentOverview from "../components/EnrollmentOverview";
import AttendanceOrbit from "../components/AttendanceOrbit";
import ProgressRing from "../components/ProgressRing";
import RecentNotifications from "../components/RecentNotifications";

function QRArt() {
  return <AttendanceOrbit />;
}
export default function Dashboard() {
  const { role, basePath, currentUser, config } = useApp();
  const resource = useData("/overview", 15000);
  const data = resource.data;
  const s = data?.summary || {};
  const hour = data
    ? new Date(data.server_time).toLocaleString("en-GB", {
        timeZone: config.timezone,
        hour: "2-digit",
        hour12: false,
      })
    : 12;
  const greeting =
    Number(hour) < 12
      ? "Good morning"
      : Number(hour) < 17
        ? "Good afternoon"
        : "Good evening";
  const executive = role === "super-admin";
  return (
    <DataState resource={resource}>
      {data && (
        <div className="page-stack">
          {role === "student" ? (
            <>
              <div className="student-hero">
                <Avatar
                  name={data.student?.name}
                  src={data.student?.photo_url}
                  size={70}
                />
                <div>
                  <p className="eyebrow">Your attendance, at a glance</p>
                  <h1>
                    {greeting},{" "}
                    {data.student?.name?.split(" ")[0] ||
                      currentUser.name.split(" ")[0]}
                  </h1>
                  <p className="muted small">
                    {data.student?.course || "Student"} ·{" "}
                    {data.student?.academic_year} · {data.student?.hostel}, Room{" "}
                    {data.student?.room_number}
                  </p>
                  <p className="muted mono small" style={{ marginTop: 7 }}>
                    {data.student?.admission_number} ·{" "}
                    {data.student?.registration_number}
                  </p>
                </div>
                <ProgressRing value={s.period_attendance_rate} />
              </div>
              <div className="grid-main">
                <DynamicStudentQR student={data.student} />
                <Panel
                  title="Today’s check-ins"
                  description="Your meal-by-meal attendance"
                >
                  {data.today_status.map((item) => (
                    <div key={item.meal} className="activity-item">
                      <span className="icon-tile tone-indigo">
                        {item.meal === "Breakfast" ? (
                          <Coffee size={17} />
                        ) : item.meal === "Dinner" ? (
                          <Moon size={17} />
                        ) : (
                          <Utensils size={17} />
                        )}
                      </span>
                      <div>
                        <strong>{item.meal}</strong>
                        <small className="mono">
                          {item.start} – {item.end}
                        </small>
                      </div>
                      <Badge
                        tone={
                          item.status === "Present"
                            ? "success"
                            : item.status === "Missed"
                              ? "error"
                              : item.status === "Not Yet Marked"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                  <p className="muted small" style={{ marginTop: 20 }}>
                    Your live QR can be accepted once per meal session.
                  </p>
                </Panel>
              </div>
              <div className="metrics-grid">
                <Metric
                  label="Meals this week"
                  value={data.weekly.reduce((sum, d) => sum + d.meals, 0)}
                  icon={CalendarDays}
                />
                <Metric
                  label="Meals this period"
                  value={s.total_meals}
                  icon={Utensils}
                  tone="cyan"
                />
                <Metric
                  label="Missed meals"
                  value={s.missed_meals}
                  icon={UserX}
                  tone="warning"
                />
                <Metric
                  label="Attendance rate"
                  value={s.period_attendance_rate}
                  suffix="%"
                  icon={Percent}
                  tone="success"
                />
              </div>
              <div className="grid-2">
                <Panel
                  title="Your attendance calendar"
                  description="Last 30 days · each dot is a meal"
                >
                  <AttendanceCalendar days={data.calendar} />
                </Panel>
                <Panel
                  title="Weekly consistency"
                  description="Meals attended over the last seven days"
                >
                  <TrendChart data={data.weekly} value="meals" />
                </Panel>
              </div>
              <MealMenuSummary />
              <Panel
                title="Recent activity"
                description="Your latest successful check-ins"
                action={
                  <Link className="panel-link" to={`${basePath}/attendance`}>
                    View all
                    <ArrowUpRight size={13} />
                  </Link>
                }
              >
                <AttendanceTable
                  items={data.recent}
                  timezone={config.timezone}
                  compact
                />
              </Panel>
            </>
          ) : (
            <>
              <Heading
                eyebrow={executive ? "System overview" : "Your workspace"}
                title={
                  executive
                    ? "Attendance control center"
                    : "Attendance overview"
                }
                description={
                  executive
                    ? "A clear view of every hostel, meal, and check-in."
                    : "Everything you need to keep today’s meals running smoothly."
                }
                actions={
                  <Link className="btn btn-outline" to={`${basePath}/reports`}>
                    <CalendarDays size={14} />
                    View reports
                    <ArrowUpRight size={14} />
                  </Link>
                }
              />
              <section className="welcome-hero">
                <div className="hero-copy">
                  <p className="eyebrow">
                    {new Date(data.server_time).toLocaleDateString("en-IN", {
                      timeZone: config.timezone,
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h2>
                    {greeting}, {currentUser.name.split(" ")[0]}{" "}
                    <span style={{ color: "#818cf8" }}>✦</span>
                  </h2>
                  <p className="muted">
                    {executive
                      ? "Monitor your entire attendance system, with every check-in in one place."
                      : "Here’s your mess attendance overview for today. Your next check-in is just one scan away."}
                  </p>
                  <div className="actions">
                    <Link
                      className="btn btn-primary"
                      to={`${basePath}/scanner`}
                    >
                      <ScanLine size={15} />
                      Open live scanner
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      className="btn btn-outline"
                      to={`${basePath}/attendance`}
                    >
                      Attendance history
                    </Link>
                  </div>
                  <div className="hero-session">
                    <Badge tone="success">System connected</Badge>
                    <span>
                      {s.total_scans_today} check-ins today ·{" "}
                      {s.attendance_rate}% of students present
                    </span>
                  </div>
                </div>
                <QRArt />
              </section>
              <EnrollmentOverview approvedStudents={s.approved_students} />
              <div className="metrics-grid">
                {(executive
                  ? [
                      ["Total students", s.total_students, Users, "indigo"],
                      [
                        "Present today",
                        s.present_today,
                        CheckCircle2,
                        "success",
                      ],
                      ["Absent today", s.absent_today, UserX, "warning"],
                      [
                        "Attendance rate",
                        s.attendance_rate,
                        Percent,
                        "cyan",
                        "%",
                      ],
                      ["Active hostels", s.active_hostels, Building2, "indigo"],
                      ["Active admins", s.active_admins, ShieldCheck, "cyan"],
                      [
                        "Active scanners",
                        s.active_scanners,
                        ScanLine,
                        "success",
                      ],
                      [
                        "Total scans today",
                        s.total_scans_today,
                        Zap,
                        "warning",
                      ],
                    ]
                  : [
                      ["Total students", s.total_students, Users, "indigo"],
                      [
                        "Present today",
                        s.present_today,
                        CheckCircle2,
                        "success",
                      ],
                      ["Absent today", s.absent_today, UserX, "warning"],
                      [
                        "Attendance rate",
                        s.attendance_rate,
                        Percent,
                        "cyan",
                        "%",
                      ],
                      ["Breakfast check-ins", s.breakfast, Coffee, "warning"],
                      ["Lunch check-ins", s.lunch, Utensils, "indigo"],
                      ["Dinner check-ins", s.dinner, Moon, "cyan"],
                      [
                        "Pending attendance",
                        s.pending_attendance,
                        ClipboardList,
                        "neutral",
                      ],
                    ]
                ).map(([label, value, Icon, tone, suffix]) => (
                  <Metric
                    key={label}
                    label={label}
                    value={value}
                    icon={Icon}
                    tone={tone}
                    suffix={suffix}
                    note="Today"
                  />
                ))}
              </div>
              <div className="grid-main">
                <Panel
                  title="Attendance trend"
                  description="Students present · last 7 days"
                  action={<Badge tone="indigo">This week</Badge>}
                >
                  <TrendChart data={data.weekly} />
                </Panel>
                <Panel
                  title="Meal-wise attendance"
                  description="Check-ins across the selected period"
                >
                  <DonutChart data={data.meals} />
                </Panel>
              </div>
              <div className="grid-main">
                <Panel
                  title="Hostel performance"
                  description="Today’s attendance across your hostels"
                  action={
                    <Link className="panel-link" to={`${basePath}/reports`}>
                      Explore
                      <ArrowUpRight size={13} />
                    </Link>
                  }
                >
                  {data.hostels.length ? (
                    data.hostels.map((h) => (
                      <div key={h.name} style={{ marginBottom: 22 }}>
                        <div
                          className="actions"
                          style={{
                            justifyContent: "space-between",
                            fontSize: 11,
                            marginBottom: 10,
                          }}
                        >
                          <strong>{h.name}</strong>
                          <span className="muted">
                            {h.present} / {h.students} students{" "}
                            <b style={{ color: "#4f46e5", marginLeft: 8 }}>
                              {h.attendance}%
                            </b>
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${h.attendance}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty
                      title="Your hostels will appear here"
                      description="Add a hostel and register its students to get started."
                    />
                  )}
                </Panel>
                <Panel
                  title="Workspace activity"
                  description="Your most recent administrative actions"
                >
                  {data.activity.length ? (
                    data.activity.slice(0, 4).map((a) => (
                      <div className="activity-item" key={a.id}>
                        <span className="icon-tile tone-indigo">
                          <Activity size={15} />
                        </span>
                        <div>
                          <strong>{a.action.replaceAll("_", " ")}</strong>
                          <small>{a.actor}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty title="No recent activity" />
                  )}
                </Panel>
              </div>
              {executive && (
                <>
                  <div className="grid-2">
                    <Panel
                      title="Monthly attendance"
                      description="Meals recorded by month"
                    >
                      <BarsChart data={data.monthly} label="month" />
                    </Panel>
                    <Panel
                      title="Peak scanning hours"
                      description={`Check-in activity · ${config.timezone}`}
                    >
                      <BarsChart
                        data={data.peaks}
                        label="hour"
                        color="#06b6d4"
                      />
                    </Panel>
                  </div>
                  <div className="grid-2">
                    <Panel
                      title="Course distribution"
                      description="Active registered students"
                    >
                      <DonutChart data={data.courses} />
                    </Panel>
                    <Panel
                      title="Academic-year comparison"
                      description="Recorded meals by academic year"
                    >
                      <BarsChart data={data.years} />
                    </Panel>
                  </div>
                  <Panel
                    title="QR security events"
                    description="Real scanner validation outcomes"
                  >
                    {data.security.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Outcome</th>
                              <th>Operator</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.security.slice(0, 6).map((e) => (
                              <tr key={e.id}>
                                <td>
                                  <Badge
                                    tone={
                                      e.outcome === "SUCCESS"
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {e.outcome.replaceAll("_", " ")}
                                  </Badge>
                                </td>
                                <td>{e.operator}</td>
                                <td>
                                  {new Date(e.created_at + "Z").toLocaleString(
                                    "en-IN",
                                    { timeZone: config.timezone },
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty title="No security events" />
                    )}
                  </Panel>
                </>
              )}
              <Panel
                title="Recent attendance"
                description="The latest successful check-ins"
                action={
                  <Link className="panel-link" to={`${basePath}/attendance`}>
                    View all attendance
                    <ArrowUpRight size={13} />
                  </Link>
                }
              >
                <AttendanceTable
                  items={data.recent}
                  timezone={config.timezone}
                />
              </Panel>
              <div>
                <div className="panel-heading">
                  <h2>Make your next move</h2>
                  <p className="muted small">Quick actions</p>
                </div>
                <div className="quick-actions">
                  {(executive
                    ? [
                        ["Add administrator", "admins", ShieldCheck],
                        ["Manage hostels", "hostels", Building2],
                        ["Configure sessions", "sessions", CalendarDays],
                        ["QR security", "qr-management", QrCode],
                      ]
                    : [
                        ["Open scanner", "scanner", ScanLine],
                        ["View students", "students", Users],
                        ["Attendance history", "attendance", ClipboardList],
                        ["Generate report", "reports", Activity],
                      ]
                  ).map(([label, path, Icon]) => (
                    <Link
                      className="quick-action"
                      key={path}
                      to={`${basePath}/${path}`}
                    >
                      <Icon size={19} color="#6366f1" />
                      {label}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
          <RecentNotifications />
        </div>
      )}
    </DataState>
  );
}
