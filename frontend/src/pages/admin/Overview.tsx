import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, DollarSign, RefreshCw, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { adminGet } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/format";
import { useTheme } from "../../theme/ThemeProvider";
import StatCard from "../../components/admin/StatCard";
import SalesChart, { type ChartPoint } from "../../components/admin/SalesChart";

type PeriodKey = "today" | "week" | "month" | "all";

interface Period {
    revenue_cents: number;
    orders: number;
    customers: number;
}

interface Stats {
    periods: Record<PeriodKey, Period>;
    charts: Record<PeriodKey, ChartPoint[]>;
    top_products: { name: string; quantity: number; revenue_cents: number }[];
    low_stock: { name: string; inventory: number }[];
}

const tabs: { key: PeriodKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "Last 7 days" },
    { key: "month", label: "Last 30 days" },
    { key: "all", label: "All time" },
];

const chartTitles: Record<PeriodKey, string> = {
    today: "Revenue today, by hour",
    week: "Revenue, last 7 days",
    month: "Revenue, last 30 days",
    all: "Revenue, all time (by month)",
};

export default function Overview() {
    const { theme } = useTheme();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<PeriodKey>("week");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            // Send the browser's time zone so "today" matches the admin's own day
            const tz = -new Date().getTimezoneOffset();
            setStats(await adminGet<Stats>(`/api/admin/stats?tz=${tz}`));
            setError(null);
            setUpdatedAt(new Date());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
        setRefreshing(false);
    }, []);

    // Live updates: instant on any order/product change, plus a 30 s backup refresh
    useEffect(() => {
        load();

        let timeout: number | undefined;
        const refreshSoon = () => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(load, 800);
        };

        const channel = supabase
            .channel("overview-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refreshSoon)
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refreshSoon)
            .subscribe();

        const timer = window.setInterval(load, 10000);
        window.addEventListener("focus", load);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(timer);
            window.removeEventListener("focus", load);
            supabase.removeChannel(channel);
        };
    }, [load]);

    if (error && !stats) {
        return (
            <p className="text-red-600">
                Could not load stats: {error}. Is the backend running?
            </p>
        );
    }
    if (!stats) return <p className="text-muted">Loading dashboard...</p>;

    const p = stats.periods[period];
    const avg = p.orders ? Math.round(p.revenue_cents / p.orders) : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Overview</h1>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        Live
                        {updatedAt && <span>· updated {updatedAt.toLocaleTimeString()}</span>}
                        <button
                            onClick={load}
                            disabled={refreshing}
                            aria-label="Refresh"
                            className="ml-1 text-muted hover:text-primary disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        </button>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setPeriod(t.key)}
                            className={`border border-border px-3 py-1.5 text-sm ${theme.chip} ${period === t.key ? "bg-primary text-primary-text" : "bg-surface"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {stats.periods.all.orders === 0 && (
                <p className={`p-4 text-sm text-muted ${theme.card}`}>
                    No paid orders yet. Make a test purchase on your store (card 4242 4242 4242 4242) with
                    the Stripe listener running, and it will show up here.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Revenue" value={money(p.revenue_cents)} icon={<DollarSign size={18} />} />
                <StatCard label="Orders" value={String(p.orders)} icon={<ShoppingCart size={18} />} />
                <StatCard label="Buyers" value={String(p.customers)} icon={<Users size={18} />} />
                <StatCard label="Avg. order" value={money(avg)} icon={<TrendingUp size={18} />} />
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-semibold">{chartTitles[period]}</h2>
                <SalesChart data={stats.charts[period]} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className={`p-5 ${theme.card}`}>
                    <h2 className="mb-4 font-semibold">Top selling products</h2>
                    {stats.top_products.length === 0 && <p className="text-sm text-muted">No sales yet.</p>}
                    <ul className="space-y-3">
                        {stats.top_products.map((t) => (
                            <li key={t.name} className="flex items-center justify-between text-sm">
                                <span>{t.name}</span>
                                <span className="text-muted">
                                    {t.quantity} sold · {money(t.revenue_cents)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`p-5 ${theme.card}`}>
                    <h2 className="mb-4 flex items-center gap-2 font-semibold">
                        <AlertTriangle size={18} /> Low stock
                    </h2>
                    {stats.low_stock.length === 0 && (
                        <p className="text-sm text-muted">All products are well stocked.</p>
                    )}
                    <ul className="space-y-3">
                        {stats.low_stock.map((s) => (
                            <li key={s.name} className="flex items-center justify-between text-sm">
                                <span>{s.name}</span>
                                <span className={s.inventory === 0 ? "font-semibold text-red-600" : "text-muted"}>
                                    {s.inventory === 0 ? "Sold out" : `${s.inventory} left`}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}