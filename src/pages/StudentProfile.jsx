import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Percent,
  QrCode,
  Utensils,
  UserX,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import {
  AttendanceTable,
  Avatar,
  Badge,
  DataState,
  Metric,
  Panel,
} from "../components/ui";
import { TrendChart } from "../components/Charts";
import AttendanceCalendar from "../components/AttendanceCalendar";
export default function StudentProfile() {
  const { id } = useParams();
  const { basePath, config } = useApp();
  const resource = useData(`/overview?student_id=${id}`);
  const studentResource = useData(`/students/${id}`);
  const data = resource.data;
  const student = studentResource.data || data?.student;
  return (
    <div className="page-stack">
      <Link className="panel-link" to={`${basePath}/students`}>
        <ArrowLeft size={14} />
        Back to students
      </Link>
      <DataState resource={studentResource}>
        <DataState resource={resource}>
          {data && student && (
            <>
              <Panel>
                <div className="profile-header">
                  <Avatar
                    name={student.name}
                    src={student.photo_url}
                    size={78}
                  />
                  <div>
                    <p className="eyebrow">Student profile</p>
                    <h1>{student.name}</h1>
                    <div className="actions">
                      <Badge tone={student.active ? "success" : "neutral"}>
                        {student.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge tone={student.qr_enabled ? "indigo" : "warning"}>
                        {student.qr_enabled ? "QR enabled" : "QR disabled"}
                      </Badge>
                      <Badge
                        tone={
                          student.approval_status === "APPROVED"
                            ? "success"
                            : "warning"
                        }
                      >
                        {student.approval_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <dl className="detail-grid">
                  {[
                    ["Roll number", student.admission_number],
                    ["Registration", student.registration_number],
                    [
                      "Hostel / room",
                      `${student.hostel} · ${student.room_number}`,
                    ],
                    [
                      "Course / department",
                      [student.course, student.department]
                        .filter(Boolean)
                        .join(" · "),
                    ],
                    [
                      "Year / semester",
                      [student.academic_year, student.semester]
                        .filter(Boolean)
                        .join(" · "),
                    ],
                    ["Email", student.email],
                    ["Mobile", student.mobile],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
                <div className="notice">
                  <QrCode size={17} />
                  Live QR tokens are available only in this student’s
                  authenticated session.
                </div>
              </Panel>
              {student.approval_history?.length > 0 && (
                <Panel title="Approval history">
                  <ol className="approval-timeline">
                    {student.approval_history.map((h, i) => (
                      <li key={i}>
                        <span className="timeline-dot" />
                        <div>
                          <strong>{h.action.replaceAll("_", " ")}</strong>
                          <small>
                            {new Date(h.created_at + "Z").toLocaleString()}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}
              <div className="metrics-grid">
                <Metric
                  label="Attendance this period"
                  value={data.summary.period_attendance_rate}
                  suffix="%"
                  icon={Percent}
                />
                <Metric
                  label="Meals attended"
                  value={data.summary.total_meals}
                  icon={Utensils}
                  tone="success"
                />
                <Metric
                  label="Missed meals"
                  value={data.summary.missed_meals}
                  icon={UserX}
                  tone="warning"
                />
                <Metric
                  label="Check-ins today"
                  value={data.summary.total_scans_today}
                  icon={CheckCircle2}
                  tone="cyan"
                />
              </div>
              <div className="grid-2">
                <Panel title="Attendance calendar" description="Last 30 days">
                  <AttendanceCalendar days={data.calendar} />
                </Panel>
                <Panel
                  title="Meal attendance trend"
                  description="Meals attended each day"
                >
                  <TrendChart data={data.daily} value="meals" />
                </Panel>
              </div>
              <Panel
                title="Recent attendance"
                action={
                  <Link
                    className="panel-link"
                    to={`${basePath}/attendance?student_id=${id}`}
                  >
                    View attendance history
                  </Link>
                }
              >
                <AttendanceTable
                  items={data.recent}
                  timezone={config.timezone}
                />
              </Panel>
            </>
          )}
        </DataState>
      </DataState>
    </div>
  );
}
