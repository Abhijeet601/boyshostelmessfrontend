import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Clock3, UserCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import { Avatar, Badge, DataState, Empty, Metric, Panel } from "./ui";
import { TrendChart } from "./Charts";
export default function EnrollmentOverview({ approvedStudents = 0 }) {
  const { basePath } = useApp();
  const resource = useData(
      "/registration/requests?status=PENDING&page_size=4",
      15000,
    ),
    data = resource.data;
  return (
    <div className="enrollment-overview">
      <div className="enrollment-section-heading">
        <div>
          <p className="eyebrow">GROWING TOGETHER</p>
          <h2>Your community, in motion.</h2>
        </div>
        <Link
          className="btn btn-outline"
          to={`${basePath}/registration-requests`}
        >
          Review registrations <ArrowUpRight size={15} />
        </Link>
      </div>
      <DataState resource={resource}>
        {data && (
          <>
            <div className="registration-summary">
              <Metric
                label="Pending registrations"
                value={data.summary.PENDING}
                icon={Clock3}
                tone="warning"
                note="Awaiting review"
              />
              <Metric
                label="Approved students"
                value={approvedStudents}
                icon={UserCheck}
                tone="success"
                note="All time"
              />
              <Metric
                label="Rejected applications"
                value={data.summary.REJECTED}
                icon={Check}
                tone="neutral"
                note="All time"
              />
            </div>
            <div className="grid-2">
              <Panel
                title="A warm welcome starts here"
                description="Latest pending applications"
                action={
                  <Badge tone="warning">{data.summary.PENDING} pending</Badge>
                }
              >
                {data.items.length ? (
                  <div className="pending-list">
                    {data.items.map((a) => (
                      <Link key={a.id} to={`${basePath}/registration-requests`}>
                        <Avatar name={a.name} src={a.photo_url} />
                        <div>
                          <strong>{a.name}</strong>
                          <small>
                            {a.hostel} · {a.admission_number}
                          </small>
                        </div>
                        <ArrowUpRight size={16} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="All caught up"
                    description="New student applications will appear here."
                  />
                )}
              </Panel>
              <Panel
                title="Registration approval trends"
                description="Daily approvals · last 30 days"
              >
                {data.trend.length ? (
                  <TrendChart
                    data={data.trend}
                    value="value"
                    label="date"
                    name="Students approved"
                  />
                ) : (
                  <Empty
                    title="Ready for your next student"
                    description="Approvals will build this chart automatically."
                  />
                )}
              </Panel>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
