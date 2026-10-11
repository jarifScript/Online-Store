import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard, LogOut, Menu, MessageCircle, ShoppingBag, User, X,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useSavedChats } from "../../lib/chatStore";
import { useChatSummaries } from "../../lib/useChatSummaries";

export default function Header({ preview = false }: { preview?: boolean }) {
    const { theme, site } = useTheme();
    const { count, open } = useCart();
    const { isAdmin, session, user, loading: authLoading, signOut } = useAuth();
    const chatOwnerId = authLoading ? "__auth_pending__" : user?.id ?? null;
    const chats = useSavedChats(chatOwnerId);
    const { summaries } = useChatSummaries(preview ? [] : chats.map((chat) => chat.token));
    const unreadMessages = summaries.reduce((total, summary) => total + summary.unread, 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const close = () => setMenuOpen(false);

    // Escape closes the menu
    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    const mobileLink = "flex items-center gap-3 px-5 py-3.5 text-base hover:bg-border";

    return (
        <header
            className={`${preview ? "relative" : "sticky top-0 z-40"} border-b border-border bg-surface px-3 py-3 sm:px-6 sm:py-4 ${theme.header.wrapper}`}
        >
            {/* Menu: hamburger on small screens, links on wide screens */}
            <div className={`flex min-w-0 items-center gap-6 ${theme.header.menu}`}>
                <button
                    type="button"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="-ml-1 p-2 md:hidden"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <nav className="hidden items-center gap-6 md:flex">
                    <Link to="/">Shop</Link>
                    {session && <Link to="/account/orders">My orders</Link>}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`flex items-center gap-1.5 bg-primary px-3 py-1.5 text-sm text-primary-text ${theme.chip}`}
                        >
                            <LayoutDashboard size={16} /> Admin
                        </Link>
                    )}
                </nav>
            </div>

            {/* Logo + store name */}
            <Link
                to="/"
                className={`flex min-w-0 items-center gap-2 text-base font-bold tracking-wide sm:text-xl ${theme.header.logo}`}
            >
                {site.logoUrl && (
                    <img
                        src={site.logoUrl}
                        alt=""
                        className="h-8 w-auto max-w-[5rem] shrink-0 object-contain sm:h-9 sm:max-w-[10rem]"
                    />
                )}
                <span className="truncate">{site.storeName}</span>
            </Link>

            {/* Account, messages, cart */}
            <div className={`flex items-center justify-end gap-0.5 sm:gap-1 ${theme.header.cart}`}>
                {chats.length > 0 && (
                    <Link
                        to="/my-chats"
                        aria-label={unreadMessages ? `My messages, ${unreadMessages} unread` : "My messages"}
                        title={unreadMessages ? `${unreadMessages} unread message(s)` : "My messages"}
                        className="relative p-2"
                    >
                        <MessageCircle size={22} />
                        {unreadMessages > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                                {unreadMessages > 99 ? "99+" : unreadMessages}
                            </span>
                        )}
                    </Link>
                )}
                {session ? (
                    <Link to="/account" aria-label="My account" title="My account" className="p-2">
                        <User size={22} />
                    </Link>
                ) : (
                    <Link
                        to="/login"
                        aria-label="Log in"
                        className="flex items-center gap-1.5 p-2 text-sm sm:px-3"
                    >
                        <User size={22} />
                        <span className="hidden sm:inline">Log in</span>
                    </Link>
                )}
                <button onClick={open} aria-label="Open cart" className="relative p-2">
                    <ShoppingBag size={22} />
                    {count > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-text">
                            {count}
                        </span>
                    )}
                </button>
            </div>

            {/* Mobile menu panel */}
            {menuOpen && (
                <div className="absolute inset-x-0 top-full z-50 max-h-[80vh] overflow-y-auto border-b border-border bg-surface shadow-lg md:hidden">
                    <Link to="/" onClick={close} className={mobileLink}>
                        Shop
                    </Link>
                    {session && (
                        <>
                            <Link to="/account/orders" onClick={close} className={mobileLink}>
                                My orders
                            </Link>
                            <Link to="/account" onClick={close} className={mobileLink}>
                                My account
                            </Link>
                        </>
                    )}
                    {chats.length > 0 && (
                        <Link to="/my-chats" onClick={close} className={mobileLink}>
                            <MessageCircle size={18} /> Messages
                            {unreadMessages > 0 && (
                                <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                                    {unreadMessages > 99 ? "99+" : unreadMessages}
                                </span>
                            )}
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" onClick={close} className={mobileLink}>
                            <LayoutDashboard size={18} /> Admin dashboard
                        </Link>
                    )}
                    {session ? (
                        <button
                            type="button"
                            onClick={() => {
                                close();
                                signOut();
                            }}
                            className={`${mobileLink} w-full border-t border-border text-left`}
                        >
                            <LogOut size={18} /> Log out
                        </button>
                    ) : (
                        <Link to="/login" onClick={close} className={`${mobileLink} border-t border-border`}>
                            <User size={18} /> Log in / Sign up
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}