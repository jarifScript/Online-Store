import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/format";
import { withCurrentProfileNames } from "../../lib/orderProfiles";
import { useTheme } from "../../theme/ThemeProvider";
import AddressBlock from "../../components/admin/AddressBlock";
import type { ChatMessage, OrderRow } from "../../types";

interface AdminMessage extends ChatMessage {
    order_id: string;
    read_by_admin: boolean;
}

interface ThreadSummary {
    order: OrderRow;
    last: AdminMessage | null;
    unread: number;
}

const who = (o: OrderRow) => o.shipping_name || o.customer_email || "Customer";

function Thread({
    order, names, onRead,
}: {
    order: OrderRow;
    names: Record<string, string>;
    onRead: () => void;
}) {
    const { theme } = useTheme();
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const box = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("order_id", order.id)
            .order("created_at", { ascending: true });
        const rows = (data ?? []) as AdminMessage[];
        setMessages(rows);

        // Opening the chat marks the customer's messages as read
        if (rows.some((m) => m.sender === "buyer" && !m.read_by_admin)) {
            const { error } = await supabase
                .from("messages")
                .update({ read_by_admin: true })
                .eq("order_id", order.id)
                .eq("sender", "buyer")
                .eq("read_by_admin", false);
            if (!error) onRead();
        }
    }, [order.id, onRead]);

    useEffect(() => {
        load();
        const channel = supabase
            .channel(`thread-${order.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "messages", filter: `order_id=eq.${order.id}` },
                () => load()
            )
            .subscribe();
        const timer = window.setInterval(load, 15000);
        return () => {
            window.clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [load, order.id]);

    useEffect(() => {
        if (box.current) box.current.scrollTop = box.current.scrollHeight;
    }, [messages.length]);

    const send = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        setError(null);
        const { error } = await supabase
            .from("messages")
            .insert({ order_id: order.id, sender: "admin", body });
        if (error) setError(error.message);
        else {
            setText("");
            await load();
        }
        setSending(false);
    };

    return (
        <div className="flex min-w-0 flex-col gap-4 pb-2 pr-2">
            {/* Order + shipping info: stacked on small widths, side by side on wide ones */}
            <div className={`grid gap-4 p-4 lg:grid-cols-2 ${theme.card}`}>
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted">
                        Order · {new Date(order.created_at).toLocaleDateString()} · {money(order.total_cents)}
                    </p>
                    <ul className="mb-2 text-sm">
                        {order.items.map((it, i) => (
                            <li key={i}>
                                {it.quantity}× {names[it.product_id] ?? "Product"}
                                {it.variant ? ` (${it.variant})` : ""}
                            </li>
                        ))}
                    </ul>
                    {order.customer_email && (
                        <p className="break-all text-sm text-muted">{order.customer_email}</p>
                    )}
                </div>
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted">Ship to</p>
                    <AddressBlock order={order} />
                </div>
            </div>

            {/* Messages */}
            <div
                ref={box}
                className={`h-[50vh] max-h-[34rem] min-h-[18rem] space-y-3 overflow-y-auto p-4 ${theme.card}`}
            >
                {messages.length === 0 && (
                    <p className="text-center text-sm text-muted">
                        No messages yet. Send the first one, for example to confirm the order.
                    </p>
                )}
                {messages.map((m) => {
                    const mine = m.sender === "admin";
                    return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[85%] px-4 py-2 text-sm ${theme.chip} ${mine ? "bg-primary text-primary-text" : "border border-border bg-background"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p>
                                <p className="mt-1 text-right text-[10px] opacity-60">
                                    {new Date(m.created_at).toLocaleString([], {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply box: full width and taller */}
            <form onSubmit={send} className="flex items-end gap-2">
                <textarea
                    rows={3}
                    value={text}
                    maxLength={2000}
                    placeholder="Reply to the customer..."
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    className={`${theme.input} min-h-[3.5rem] w-full min-w-0 flex-1 resize-y`}
                />
                <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    aria-label="Send"
                    className={`${theme.button} shrink-0 !px-4 disabled:opacity-60`}
                >
                    <Send size={18} />
                </button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default function Chats() {
    const { orderId } = useParams();
    const { theme } = useTheme();
    const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
    const [names, setNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const loadList = useCallback(async () => {
        const [o, m] = await Promise.all([
            supabase
                .from("orders")
                .select("*")
                .eq("status", "paid")
                .order("created_at", { ascending: false })
                .limit(200),
            supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(1000),
        ]);
        if (o.error) {
            setError(o.error.message);
            return;
        }
        let orders: OrderRow[];
        try {
            orders = await withCurrentProfileNames((o.data ?? []) as OrderRow[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load customer names");
            return;
        }
        setError(null);

        // Messages come newest first, so the first one we meet per order is the latest
        const byOrder = new Map<string, { last: AdminMessage; unread: number }>();
        for (const msg of (m.data ?? []) as AdminMessage[]) {
            const cur = byOrder.get(msg.order_id) ?? { last: msg, unread: 0 };
            if (msg.sender === "buyer" && !msg.read_by_admin) cur.unread += 1;
            byOrder.set(msg.order_id, cur);
        }

        const list: ThreadSummary[] = orders.map((order) => ({
            order,
            last: byOrder.get(order.id)?.last ?? null,
            unread: byOrder.get(order.id)?.unread ?? 0,
        }));
        list.sort((a, b) =>
            (b.last?.created_at ?? b.order.created_at).localeCompare(a.last?.created_at ?? a.order.created_at)
        );
        setThreads(list);
    }, []);

    useEffect(() => {
        loadList();
        supabase
            .from("products")
            .select("id,name")
            .then(({ data }) =>
                setNames(Object.fromEntries((data ?? []).map((p: { id: string; name: string }) => [p.id, p.name])))
            );

        const channel = supabase
            .channel("chats-list")
            .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadList())
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadList())
            .subscribe();
        const timer = window.setInterval(loadList, 30000);

        return () => {
            window.clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [loadList]);

    if (error && !threads) return <p className="text-red-600">Could not load chats: {error}</p>;
    if (!threads) return <p className="text-muted">Loading chats...</p>;

    const selected = threads.find((t) => t.order.id === orderId)?.order ?? null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Chats</h1>

            {/* One panel at a time until there is room for two (xl); then list + conversation */}
            <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
                {/* Customer list */}
                <div className={`min-w-0 space-y-3 pb-2 pr-2 ${orderId ? "hidden xl:block" : ""}`}>
                    {threads.length === 0 && (
                        <p className="text-sm text-muted">
                            No paid orders yet. When someone buys, you can chat with them here.
                        </p>
                    )}
                    {threads.map(({ order, last, unread }) => (
                        <Link
                            key={order.id}
                            to={`/admin/chats/${order.id}`}
                            className={`block min-w-0 p-3 ${theme.card} ${order.id === orderId ? "!border-primary" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold">{who(order)}</p>
                                {unread > 0 && (
                                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-text">
                                        {unread}
                                    </span>
                                )}
                            </div>
                            <p className="truncate text-xs text-muted">
                                {last
                                    ? `${last.sender === "admin" ? "You: " : ""}${last.body}`
                                    : `Order ${new Date(order.created_at).toLocaleDateString()} · ${money(order.total_cents)}`}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Conversation */}
                <div className={`min-w-0 ${orderId ? "" : "hidden xl:block"}`}>
                    {orderId && (
                        <Link to="/admin/chats" className="mb-3 inline-flex items-center gap-1 text-sm underline xl:hidden">
                            <ArrowLeft size={16} /> All chats
                        </Link>
                    )}
                    {selected ? (
                        <Thread order={selected} names={names} onRead={loadList} />
                    ) : (
                        <p className="text-muted">
                            {orderId ? "This order was not found, or it is not paid yet." : "Pick a customer on the left."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}