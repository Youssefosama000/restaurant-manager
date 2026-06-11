import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  day: string;
  orders: number;
}

interface Props {
  data?: DataPoint[];
}

const fallback: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  day: String(i + 1),
  orders: 0,
}));

export default function RevenueBarChart({ data }: Props) {
  const chartData = data && data.length > 0 ? data : fallback;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} barSize={10} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#EDE5D5" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "#9A9A9A" }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9A9A9A" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            border: "1px solid #DDD6CC",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(61,191,82,0.08)" }}
        />
        <Bar dataKey="orders" fill="#3DBF52" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
