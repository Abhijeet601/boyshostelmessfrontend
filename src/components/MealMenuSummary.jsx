import { Link } from "react-router-dom";
import { ArrowUpRight, Coffee, Cookie, Moon, Utensils } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData, localDate } from "../lib/hooks";
import { DataState, Panel } from "./ui";
export default function MealMenuSummary() {
  const { config, basePath } = useApp();
  const resource = useData("/meal-menus");
  const today = resource.data?.menus?.find(
    (m) => m.menu_date === localDate(config.timezone),
  );
  return (
    <Panel
      title="On the menu today"
      description="A little something to look forward to"
      action={
        <Link className="panel-link" to={`${basePath}/meals`}>
          Weekly menu
          <ArrowUpRight size={13} />
        </Link>
      }
    >
      <DataState resource={resource}>
        <div className="grid-4">
          {[
            ["breakfast", "Breakfast", Coffee],
            ["lunch", "Lunch", Utensils],
            ["snacks", "Snacks", Cookie],
            ["dinner", "Dinner", Moon],
          ].map(([key, label, Icon]) => (
            <div key={key} className="menu-meal">
              <Icon size={18} color="#818cf8" />
              <h3>{label}</h3>
              <p className="muted">
                {today?.[key] || "Menu not published yet"}
              </p>
            </div>
          ))}
        </div>
      </DataState>
    </Panel>
  );
}
