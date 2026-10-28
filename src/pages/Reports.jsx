import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Percent,
  Printer,
  TrendingUp,
  Users,
  UserX,
  Utensils,
} from "lucide-react";
import toast from "react-hot-toast";
import { useData } from "../lib/hooks";
import { useAttendanceFilters } from "../lib/filters";
import { download } from "../lib/api";
import { Button, DataState, Heading, Metric, Panel } from "../components/ui";
import { BarsChart, DonutChart, TrendChart } from "../components/Charts";
import AttendanceFilters from "../components/AttendanceFilters";
export default function Reports({ analytics = false }) {
  const filter = useAttendanceFilters();
  const resource = useData(`/overview?${filter.query}`);
  const d = resource.data;
  const [busy, setBusy] = useState("");
  const exportAs = async (format) => {
    setBusy(format);
    try {
      await download(
        `/attendance/export?${filter.query}&format=${format}`,
        `attendance-report.${format}`,
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Turn check-ins into insight"
        title={analytics ? "Attendance analytics" : "Reports & insights"}
        description="Understand participation, spot patterns, and keep your team informed."
        actions={
          <>
            <Button
              variant="outline"
              loading={busy === "csv"}
              onClick={() => exportAs("csv")}
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              loading={busy === "xlsx"}
              onClick={() => exportAs("xlsx")}
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={14} />
              Print / PDF
            </Button>
          </>
        }
      />
      <Panel>
        <AttendanceFilters filter={filter} reports />
      </Panel>
      <DataState resource={resource}>
        {d && (
          <>
            <div className="metrics-grid">
              {[
                ["Active students", d.summary.total_students, Users, "indigo"],
                [
                  "Present today",
                  d.summary.present_today,
                  CheckCircle2,
                  "success",
                ],
                ["Absent today", d.summary.absent_today, UserX, "warning"],
                [
                  "Attendance today",
                  `${d.summary.attendance_rate}%`,
                  Percent,
                  "cyan",
                ],
                ["Meals in period", d.summary.total_meals, Utensils, "indigo"],
                [
                  "Average daily present",
                  d.summary.average_daily,
                  TrendingUp,
                  "success",
                ],
              ].map(([label, value, Icon, tone]) => (
                <Metric
                  key={label}
                  label={label}
                  value={value}
                  icon={Icon}
                  tone={tone}
                />
              ))}
            </div>
            <div className="grid-2">
              <Panel
                title="Weekly attendance"
                description="Unique students present each day"
              >
                <TrendChart data={d.weekly} />
              </Panel>
              <Panel
                title="Meal comparison"
                description="Verified check-ins by meal"
              >
                <DonutChart data={d.meals} />
              </Panel>
              <Panel
                title="Daily attendance trend"
                description="Meals attended over your selected period"
              >
                <TrendChart data={d.daily} value="meals" />
              </Panel>
              <Panel
                title="Monthly attendance"
                description="Total recorded meals by month"
              >
                <BarsChart data={d.monthly} label="month" />
              </Panel>
              <Panel
                title="Hostel comparison"
                description="Total attendance records in the selected period"
              >
                <BarsChart data={d.hostels} value="meals" />
              </Panel>
              <Panel
                title="Course distribution"
                description="Active students by course"
              >
                <DonutChart data={d.courses} />
              </Panel>
              <Panel
                title="Academic-year comparison"
                description="Meals attended by academic year"
              >
                <BarsChart data={d.years} />
              </Panel>
              <Panel
                title="Peak scanning times"
                description="Check-in activity in your configured timezone"
              >
                <BarsChart data={d.peaks} label="hour" color="#06b6d4" />
              </Panel>
            </div>
            <p className="muted small">
              Summary cards labelled “today” use today’s attendance. Charts and
              exports use the selected date range. An absent student has no
              recorded check-in today.
            </p>
          </>
        )}
      </DataState>
    </div>
  );
}
