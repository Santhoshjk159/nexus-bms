import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr } from "@/lib/format";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, formatter: (v: number) => inr(v) };
const short = (v: number) => inr(v, true).replace("₹", "₹");

export function TrendChart({ data, keys, height = 260, money = true }: { data: Record<string, number | string>[]; keys: { key: string; label: string }[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>{keys.map((k, i) => (<linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.25} /><stop offset="100%" stopColor={CHART_COLORS[i]} stopOpacity={0} /></linearGradient>))}</defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={60} tickFormatter={money ? short : undefined} />
        <Tooltip {...tip} formatter={money ? tip.formatter : undefined} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => <Area key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={CHART_COLORS[i]} strokeWidth={2} fill={`url(#g-${k.key})`} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function BarsChart({ data, keys, height = 260, money = true, stacked }: { data: Record<string, number | string>[]; keys: { key: string; label: string }[]; height?: number; money?: boolean; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={60} tickFormatter={money ? short : undefined} />
        <Tooltip {...tip} formatter={money ? tip.formatter : undefined} cursor={{ fill: "var(--muted)" }} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => <Bar key={k.key} dataKey={k.key} name={k.label} fill={CHART_COLORS[i]} radius={stacked ? 0 : [4, 4, 0, 0]} stackId={stacked ? "s" : undefined} maxBarSize={36} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
export function DonutChart({ data, height = 240, money = true }: { data: { name: string; value: number }[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tip} formatter={money ? tip.formatter : undefined} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Groups items into the last N months for charting. */
export function byMonth<T>(items: T[], date: (x: T) => string, months = 6, reducers: Record<string, (x: T) => number>) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const row: Record<string, number | string> = { label: d.toLocaleDateString("en-IN", { month: "short" }) };
    const inMonth = items.filter((x) => { const t = new Date(date(x)); return t.getMonth() === d.getMonth() && t.getFullYear() === d.getFullYear(); });
    Object.entries(reducers).forEach(([k, f]) => (row[k] = Math.round(inMonth.reduce((s, x) => s + f(x), 0))));
    return row;
  });
}
