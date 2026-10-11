import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { ApiError, getChat, sendChat, type ChatData } from "../lib/api";
import { money } from "../lib/format";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { addChat } from "../lib/chatStore";

type Status = "loading" | "ready" | "waiting" | "missing" | "error";

export default function Chat() {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<ChatData | null>(null);
    const [status, setStatus] = useState<Status>("loading");
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const lastCount = useRef(0);
    const goBack = () => {
        const historyIndex = window.history.state?.idx;
        if (typeof historyIndex === "number" && historyIndex > 0) navigate(-1);
        else navigate("/my-chats");
    };
    const backButton = (
        <button
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-text"
        >
            <ArrowLeft size={16} /> Go back
        </button>
    );

    const load = useCallback(async () => {
        try {
            const chatData = await getChat(token);
            setData(chatData);
            setStatus("ready");
            if (!authLoading) addChat(token, user?.id ?? null);
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) setStatus("missing");
            else if (e instanceof ApiError && e.status === 403) setStatus("waiting");
            else setStatus((prev) => (prev === "ready" ? prev : "error"));
        }
    }, [authLoading, token, user?.id]);

    // Check for new messages every 5 seconds
    useEffect(() => {
        load();
        const timer = window.setInterval(load, 5000);
        return () => window.clearInterval(timer);
    }, [load]);

    // Scroll to the newest message
    useEffect(() => {
        const n = data?.messages.length ?? 0;
        if (n !== lastCount.current && box.current) {
            lastCount.current = n;
            box.current.scrollTop = box.current.scrollHeight;
        }
    }, [data]);

    const send = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        setError(null);
        try {
            await sendChat(token, body);
            setText("");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not send");
        }
        setSending(false);
    };

    if (status === "loading") {
        return (
            <section className={`${theme.section} text-center text-muted`}>
                {backButton}
                Loading chat...
            </section>
        );
    }

    if (status === "missing") {
        return (
            <section className={`${theme.section} mx-auto max-w-md text-center`}>
                {backButton}
                <h1 className={`${theme.heading} mb-3`}>Chat not found</h1>
                <p className="mb-6 text-muted">This chat link is not valid. Chats open after you buy something.</p>
                <Link to="/" className={`${theme.button} inline-block`}>Back to store</Link>
            </section>
        );
    }

    if (status === "waiting") {
        return (
            <section className={`${theme.section} mx-auto max-w-md text-center`}>
                {backButton}
                <h1 className={`${theme.heading} mb-3`}>Almost there</h1>
                <p className="text-muted">
                    Your payment is still being confirmed. This page will open your chat automatically.
                </p>
            </section>
        );
    }

    if (status === "error" || !data) {
        return (
            <section className={`${theme.section} text-center text-red-600`}>
                {backButton}
                Could not load the chat. Please try again in a moment.
            </section>
        );
    }

    return (
        <section className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col overflow-hidden px-4 py-2 sm:py-3">
            <div className="shrink-0">{backButton}</div>
            <h1 className={`${theme.heading} mb-2 shrink-0`}>Chat with the store</h1>

            <div className={`mb-2 max-h-[18vh] shrink-0 overflow-y-auto p-3 text-sm sm:max-h-[20vh] sm:p-4 ${theme.card}`}>
                <p className="mb-1 font-semibold">
                    Your order · {new Date(data.order.created_at).toLocaleDateString()} ·{" "}
                    {money(data.order.total_cents)}
                </p>
                <ul className="text-muted">
                    {data.order.items.map((it, i) => (
                        <li key={i}>
                            {it.quantity}× {it.name}
                            {it.variant ? ` (${it.variant})` : ""}
                        </li>
                    ))}
                </ul>
            </div>

            <div ref={box} className={`mb-2 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4 ${theme.card}`}>
                {data.messages.length === 0 && (
                    <p className="text-center text-sm text-muted">
                        No messages yet. Ask anything about your order, like delivery or sizing.
                    </p>
                )}
                {data.messages.map((m) => {
                    const mine = m.sender === "buyer";
                    return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] px-4 py-2 text-sm ${theme.chip} ${mine ? "bg-primary text-primary-text" : "border border-border bg-background"
                                    }`}
                            >
                                {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">Store</p>}
                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
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

            <form onSubmit={send} className="flex shrink-0 items-end gap-2">
                <textarea
                    rows={2}
                    value={text}
                    maxLength={2000}
                    placeholder="Write a message..."
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    className={`${theme.input} flex-1 resize-none`}
                />
                <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    aria-label="Send"
                    className={`${theme.button} !px-4 disabled:opacity-60`}
                >
                    <Send size={18} />
                </button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
    );
}