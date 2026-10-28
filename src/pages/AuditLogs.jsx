import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useData, useDebounced } from "../lib/hooks";
import { useApp } from "../context/AppContext";
import {
  DataState,
  Empty,
  Heading,
  Pager,
  Panel,
  SearchInput,
} from "../components/ui";
export default function AuditLogs() {
  const { config } = useApp();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const search = useDebounced(q);
  const [page, setPage] = useState(1);
  const resource = useData(
    `/audit-logs?q=${encodeURIComponent(search)}&page=${page}${params.get("actor") ? `&actor=${params.get("actor")}` : ""}`,
  );
  return (
    <div className="page-stack">
      <Heading
        eyebrow="Accountability, built in"
        title="Audit trail"
        description="A persistent record of the actions that keep your workspace running."
      />
      <Panel>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Search action or administrator…"
          />
        </div>
        <DataState resource={resource}>
          {resource.data?.items.length ? (
            <>
              <div className="timeline">
                {resource.data.items.map((r) => (
                  <article className="timeline-item" key={r.id}>
                    <p style={{ fontWeight: 600, textTransform: "capitalize" }}>
                      {r.action.replaceAll("_", " ")}
                    </p>
                    <small>
                      {r.actor || "System"} ·{" "}
                      {new Date(r.created_at + "Z").toLocaleString("en-IN", {
                        timeZone: config.timezone,
                      })}{" "}
                      · {r.entity_type} #{r.entity_id}
                    </small>
                    {r.details && r.details !== '{"message": ""}' && (
                      <code>{r.details}</code>
                    )}
                  </article>
                ))}
              </div>
              <Pager
                page={page}
                total={resource.data.total}
                size={30}
                onChange={setPage}
              />
            </>
          ) : (
            <Empty
              icon={ShieldCheck}
              title="No matching audit events"
              description="Try a different search or perform an administrative action."
            />
          )}
        </DataState>
      </Panel>
    </div>
  );
}
