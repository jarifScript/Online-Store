import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ChartPoint {
    label: string;
    revenue: number;
    orders: number;
}

export default function SalesChart({ data }: { data: ChartPoint[] }) {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                    />
                    <YAxis
                        tick={{ fill: "var(--muted)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: "var(--border)", opacity: 0.4 }}
                        contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            color: "var(--text)",
                        }}
                        formatter={(value, _name, item) => [
                            `$${value} · ${item.payload.orders} order${item.payload.orders === 1 ? "" : "s"}`,
                            "Revenue",
                        ]}
                    />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}