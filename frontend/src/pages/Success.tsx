import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, MessageCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { addChat } from "../lib/chatStore";
import { confirmOrder } from "../lib/api";

export default function Success() {
    const { clear } = useCart();
    const { session, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const [params] = useSearchParams();
    const chat = params.get("chat");
    const sessionId = params.get("session_id");

    useEffect(() => {
        clear(); // payment finished, empty the cart
        if (!authLoading && chat) addChat(chat, session?.user.id ?? null);
    }, [clear, chat, authLoading, session?.user.id]);

    // Double-check the payment with Stripe, so the order is counted right away
    useEffect(() => {
        if (sessionId) confirmOrder(sessionId).catch(() => { });
    }, [sessionId]);

    return (
        <section className={`${theme.section} mx-auto max-w-lg text-center`}>
            <CheckCircle size={64} className="mx-auto mb-6 text-primary" />
            <h1 className={`${theme.heading} mb-4`}>Thank you!</h1>
            <p className="mb-8 text-muted">
                Your payment was received. Questions about your order? You can message the store directly.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                {chat && (
                    <Link to={`/chat/${chat}`} className={`${theme.button} inline-flex items-center justify-center gap-2`}>
                        <MessageCircle size={18} /> Message the store
                    </Link>
                )}
                {session && (
                    <Link
                        to="/account/orders"
                        className={`${theme.button} inline-block !bg-transparent !text-text`}
                    >
                        View my orders
                    </Link>
                )}
                <Link to="/" className={`${theme.button} inline-block !bg-transparent !text-text`}>
                    Continue shopping
                </Link>
            </div>
            {chat && !session && (
                <p className="mt-6 text-xs text-muted">
                    Your chat is private. Bookmark this page, or use the message icon at the top of the store
                    on this device to find it again. Log in next time and it will always be under My orders.
                </p>
            )}
        </section>
    );
}