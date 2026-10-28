import { Link } from "react-router-dom";
import { ArrowUpRight, Bell } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../lib/hooks";
import { DataState, Empty, Panel } from "./ui";
export default function RecentNotifications() {
  const { basePath, config } = useApp(),
    resource = useData("/notifications", 30000);
  return (
    <Panel
      title="In the loop"
      description="The latest updates from your community"
      action={
        <Link className="panel-link" to={`${basePath}/notifications`}>
          All notifications <ArrowUpRight size={14} />
        </Link>
      }
    >
      <DataState resource={resource}>
        {resource.data?.items.length ? (
          resource.data.items.slice(0, 3).map((item) => (
            <Link
              className="activity-item"
              to={`${basePath}/notifications`}
              key={item.id}
            >
              <span
                className={`icon-tile tone-${item.kind === "attendance" ? "success" : "indigo"}`}
              >
                <Bell size={17} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.body}</small>
              </div>
              <time className="muted small">
                {new Date(item.created_at + "Z").toLocaleDateString("en-IN", {
                  timeZone: config.timezone,
                  day: "numeric",
                  month: "short",
                })}
              </time>
            </Link>
          ))
        ) : (
          <Empty
            title="A quiet moment"
            description="New attendance and community updates will appear here."
          />
        )}
      </DataState>
    </Panel>
  );
}
