import { useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import { useAttendanceFilters } from "../lib/filters";
import { download } from "../lib/api";
import AttendanceFilters from "../components/AttendanceFilters";
import AttendanceCalendar from "../components/AttendanceCalendar";
import {
  AttendanceTable,
  Badge,
  Button,
  DataState,
  Heading,
  Metric,
  Pager,
  Panel,
} from "../components/ui";
import { CalendarDays, CheckCircle2, Percent, UserX } from "lucide-react";
export default function AttendanceHistory() {
  const { role, config } = useApp();
  const filter = useAttendanceFilters();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const resource = useData(
    `/attendance?${filter.query}&page=${page}&sort=${sort}`,
    15000,
  );
  const summary = useData(`/overview?${filter.query}`);
  const [exporting, setExporting] = useState("");
  const exportAs = async (format) => {
    setExporting(format);
    try {
      await download(
        `/attendance/export?${filter.query}&format=${format}`,
        `attendance.${format}`,
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting("");
    }
  };
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Every check-in matters"
        title={role === "student" ? "My attendance" : "Attendance history"}
        description={
          role === "student"
            ? "Your meals, your history, your consistency."
            : "Search and review verified meal attendance from your hostels."
        }
        actions={
          <>
            <Button
              variant="outline"
              loading={exporting === "csv"}
              onClick={() => exportAs("csv")}
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              loading={exporting === "xlsx"}
              onClick={() => exportAs("xlsx")}
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={14} />
              Print / PDF
            </Button>
          </>
        }
      />
      {role === "student" && summary.data && (
        <div className="metrics-grid">
          <Metric
            label="Meals attended"
            value={summary.data.summary.total_meals}
            icon={CheckCircle2}
            tone="success"
          />
          <Metric
            label="Attendance rate"
            value={summary.data.summary.period_attendance_rate}
            suffix="%"
            icon={Percent}
          />
          <Metric
            label="Missed meals"
            value={summary.data.summary.missed_meals}
            icon={UserX}
            tone="warning"
          />
          <Metric
            label="Days in period"
            value={summary.data.daily.length}
            icon={CalendarDays}
            tone="cyan"
          />
        </div>
      )}
      <Panel>
        <AttendanceFilters filter={filter} onChange={() => setPage(1)} />
        <div className="panel-heading">
          <div className="actions">
            <h2>
              {filter.values.status === "Missed"
                ? "Missed meal sessions"
                : "Verified check-ins"}
            </h2>
            <Badge tone="indigo">{resource.data?.total ?? 0} records</Badge>
          </div>
          <select
            aria-label="Sort attendance"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{
              border: 0,
              fontSize: 11,
              color: "#64748b",
              background: "transparent",
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <DataState resource={resource}>
          <AttendanceTable
            items={resource.data?.items}
            timezone={config.timezone}
          />
          <Pager
            page={page}
            total={resource.data?.total || 0}
            size={12}
            onChange={setPage}
          />
        </DataState>
      </Panel>
      {role === "student" && (
        <Panel
          title="Attendance calendar"
          description="Meal status for your selected period"
        >
          <DataState resource={summary}>
            <AttendanceCalendar days={summary.data?.calendar} />
          </DataState>
        </Panel>
      )}
    </div>
  );
}
