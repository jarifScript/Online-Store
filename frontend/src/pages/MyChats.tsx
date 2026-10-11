import { Link } from "react-router-dom";
import { MessageCircle, Trash2 } from "lucide-react";
import { removeChat, useSavedChats } from "../lib/chatStore";
import { useTheme } from "../theme/ThemeProvider";
import { money } from "../lib/format";
import { useChatSummaries } from "../lib/useChatSummaries";
import { useAuth } from "../context/AuthContext";

export default function MyChats() {
    const { theme } = useTheme();
    const { user, loading: authLoading } = useAuth();
    const userId = authLoading ? "__auth_pending__" : user?.id ?? null;
    const chats = useSavedChats(userId);
    const { summaries, error } = useChatSummaries(chats.map((chat) => chat.token));

    return (
        <section className="mx-auto max-w-xl px-4 py-8">
            <h1 className={`${theme.heading} mb-6`}>My messages</h1>

            {error && (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    Could not refresh message notifications: {error}
                </p>
            )}
            {chats.length === 0 && (
                <p className="text-muted">
                    No chats on this device yet. A chat opens after you buy something.
                </p>
            )}

            <div className="space-y-3">
                {chats.map((c) => (
                    <div key={c.token} className={`flex items-start gap-3 p-4 ${theme.card}`}>
                        <MessageCircle size={20} className="mt-1 shrink-0 text-primary" />
                        <Link to={`/chat/${c.token}`} className="min-w-0 flex-1">
                            {(() => {
                                const summary = summaries.find((item) => item.token === c.token);
                                return (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold">
                                                {summary?.items.map((item) => item.name).join(", ")
                                                    || `Order from ${new Date(summary?.created_at ?? c.savedAt).toLocaleDateString()}`}
                                            </span>
                                            {summary && (
                                                <span className="text-xs text-muted">
                                                    {money(summary.total_cents)}
                                                </span>
                                            )}
                                            {!!summary?.unread && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-text">
                                                    {summary.unread} new
                                                </span>
                                            )}
                                        </div>
                                        <span className="mt-1 block truncate text-sm text-muted">
                                            {summary?.last_message || "Open your conversation with the store"}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted">
                                            Order {new Date(summary?.created_at ?? c.savedAt).toLocaleDateString()}
                                        </span>
                                    </>
                                );
                            })()}
                        </Link>
                        <button
                            aria-label="Remove from this device"
                            onClick={() => removeChat(c.token, userId)}
                            className="shrink-0 p-1 text-muted hover:text-primary"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}