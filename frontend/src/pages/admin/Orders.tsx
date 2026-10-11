import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { adminGet } from "../../lib/api";
import { withCurrentProfileNames } from "../../lib/orderProfiles";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/format";
import { useTheme } from "../../theme/ThemeProvider";
import AddressBlock from "../../components/admin/AddressBlock";
import type { OrderRow } from "../../types";

type Filter = "all" | "paid" | "pending";

const badge: Record<string, string> = {
    paid: "bg-primary text-primary-text",
    pending: "bg-border text-text",
    failed: "bg-red-600 text-white",
};

export default function Orders() {
    const { theme } = useTheme();
    const [orders, setOrders] = useState<OrderRow[] | null>(null);
    const [names, setNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>("all");

    const load = useCallback(async () => {
        try {
            const rows = await adminGet<OrderRow[]>("/api/admin/orders");
            setOrders(await withCurrentProfileNames(rows));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
    }, []);

    useEffect(() => {
        load();
        supabase
            .from("products")
            .select("id,name")
            .then(({ data }) =>
                setNames(Object.fromEntries((data ?? []).map((p: { id: string; name: string }) => [p.id, p.name])))
            );

        const channel = supabase
            .channel("orders-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
            .subscribe();
        const timer = window.setInterval(load, 30000);

        return () => {
            window.clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [load]);

    if (error && !orders) return <p className="text-red-600">Could not load orders: {error}</p>;
    if (!orders) return <p className="text-muted">Loading orders...</p>;

    const shown = orders.filter((o) => filter === "all" || o.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Orders</h1>
                <div className="flex gap-2">
                    {(["all", "paid", "pending"] as Filter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`border border-border px-3 py-1.5 text-sm capitalize ${theme.chip} ${filter === f ? "bg-primary text-primary-text" : "bg-surface"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {shown.length === 0 && <p className="text-muted">No orders here yet.</p>}

            <div className="space-y-3">
                {shown.map((o) => (
                    <div key={o.id} className={`p-4 ${theme.card}`}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-muted">{new Date(o.created_at).toLocaleString()}</p>
                            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${badge[o.status]}`}>
                                {o.status}
                            </span>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                                <p className="mb-1 text-xs uppercase tracking-wider text-muted">Items</p>
                                <ul className="space-y-0.5 text-sm">
                                    {o.items.map((it, i) => (
                                        <li key={i}>
                                            {it.quantity}× {names[it.product_id] ?? "Deleted product"}
                                            {it.variant ? ` (${it.variant})` : ""}
                                            {it.delivery_cents != null && it.delivery_cents > 0 && (
                                                <span className="block pl-4 text-muted">
                                                    Delivery: {money(it.delivery_cents * it.quantity)}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="mb-1 text-xs uppercase tracking-wider text-muted">Ship to</p>
                                <AddressBlock order={o} />
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                            <span className="text-muted">{o.customer_email ?? "No email yet"}</span>
                            <div className="flex items-center gap-4">
                                {o.status === "paid" && (
                                    <Link
                                        to={`/admin/chats/${o.id}`}
                                        className="flex items-center gap-1.5 text-primary underline"
                                    >
                                        <MessageCircle size={16} /> Message customer
                                    </Link>
                                )}
                                <span className="font-bold">{money(o.total_cents)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}