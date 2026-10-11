import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { money } from "../lib/format";
import { withCurrentProfileNames } from "../lib/orderProfiles";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import AddressBlock from "../components/admin/AddressBlock";
import type { OrderRow } from "../types";

export default function AccountOrders() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const userId = user?.id;
    const [orders, setOrders] = useState<OrderRow[] | null>(null);
    const [names, setNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        supabase
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "paid")
            .order("created_at", { ascending: false })
            .limit(50)
            .then(async ({ data, error }) => {
                if (error) setError(error.message);
                else {
                    try {
                        setOrders(await withCurrentProfileNames((data ?? []) as OrderRow[]));
                    } catch (e) {
                        setError(e instanceof Error ? e.message : "Could not load account name");
                    }
                }
            });
        supabase
            .from("products")
            .select("id,name")
            .then(({ data }) =>
                setNames(Object.fromEntries((data ?? []).map((p: { id: string; name: string }) => [p.id, p.name])))
            );
    }, [userId]);

    return (
        <section className="mx-auto w-full max-w-2xl px-4 py-8">
            <h1 className={`${theme.heading} mb-6`}>My orders</h1>

            {error && <p className="text-red-600">{error}</p>}
            {!orders && !error && <p className="text-muted">Loading...</p>}
            {orders && orders.length === 0 && (
                <p className="text-muted">
                    No orders yet. Orders you place while logged in show up here, with a button to message
                    the store.
                </p>
            )}

            <div className="space-y-4">
                {orders?.map((o) => (
                    <div key={o.id} className={`p-4 ${theme.card}`}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-muted">{new Date(o.created_at).toLocaleString()}</p>
                            <span className="font-bold">{money(o.total_cents)}</span>
                        </div>
                        <ul className="mb-3 space-y-0.5 text-sm">
                            {o.items.map((it, i) => (
                                <li key={i}>
                                    {it.quantity}× {names[it.product_id] ?? "Product"}
                                    {it.variant ? ` (${it.variant})` : ""}
                                    {it.delivery_cents != null && it.delivery_cents > 0 && (
                                        <span className="block pl-4 text-muted">
                                            Delivery: {money(it.delivery_cents * it.quantity)}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="mb-3">
                            <AddressBlock order={o} />
                        </div>
                        <Link
                            to={`/chat/${o.chat_token}`}
                            className={`${theme.button} inline-flex items-center gap-2 text-sm`}
                        >
                            <MessageCircle size={16} /> Message the store
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}