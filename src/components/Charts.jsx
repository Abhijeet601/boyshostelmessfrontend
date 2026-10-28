import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty } from "./ui";
import { useReducedMotion } from "framer-motion";
const colors = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#a78bfa",
  "#f472b6",
];
const axis = { fontSize: 10, fill: "#64748b" };
const tooltip = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 11,
  boxShadow: "0 5px 20px #0f172a08",
};
export function TrendChart({ data, value = "present", label = "label", name }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: -23, right: 8, top: 15, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`trend-${value}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#f1f5f9"
            vertical={false}
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey={label}
            tick={axis}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltip} />
          <Area
            isAnimationActive={!reducedMotion}
            type="monotone"
            dataKey={value}
            name={name || (value === "present" ? "Students present" : "Meals attended")}
            stroke="#6366f1"
            strokeWidth={2.5}
            fill={`url(#trend-${value})`}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DonutChart({ data }) {
  const reducedMotion = useReducedMotion();
  if (!data?.some((d) => d.value > 0))
    return (
      <Empty
        title="Awaiting check-ins"
        description="Meal attendance will appear after the first scan."
      />
    );
  return (
    <>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={!reducedMotion}
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={5}
              stroke="none"
              animationDuration={300}
            >
              {data.map((item, i) => (
                <Cell key={item.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {data.map((d, i) => (
          <span key={d.name}>
            <i style={{ background: colors[i % colors.length] }} />
            {d.name}
            <b>{d.value}</b>
          </span>
        ))}
      </div>
    </>
  );
}
export function BarsChart({
  data,
  value = "value",
  label = "name",
  color = "#6366f1",
}) {
  const reducedMotion = useReducedMotion();
  return !data?.length ? (
    <Empty title="No data for this period" />
  ) : (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ left: -23, right: 8, top: 15, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#f1f5f9"
            vertical={false}
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey={label}
            tick={axis}
            axisLine={false}
            tickLine={false}
            minTickGap={10}
          />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltip} cursor={{ fill: "#f8fafc" }} />
          <Bar
            isAnimationActive={!reducedMotion}
            dataKey={value}
            fill={color}
            radius={[5, 5, 0, 0]}
            barSize={28}
            animationDuration={300}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
