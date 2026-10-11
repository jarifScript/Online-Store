import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useSavedChats } from "../../lib/chatStore";

export default function Footer() {
    const { site } = useTheme();
    const { session, user, loading: authLoading } = useAuth();
    const chatOwnerId = authLoading ? "__auth_pending__" : user?.id ?? null;
    const chats = useSavedChats(chatOwnerId);
    const s = site.content.socials;

    const links = [
        ["Instagram", s.instagram],
        ["Facebook", s.facebook],
        ["TikTok", s.tiktok],
        ["YouTube", s.youtube],
    ].filter(([, url]) => /^https?:\/\//i.test(url.trim()));

    return (
        <footer className="border-t border-border bg-surface px-5 py-10 text-sm text-muted sm:px-8">
            <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <Link to="/" className="text-base font-bold text-text">{site.storeName}</Link>
                    <p className="mt-3 max-w-xs leading-relaxed">
                        {site.content.footerText || "Discover products chosen for your everyday life."}
                    </p>
                    <p className="mt-3 text-xs">Secure payment at checkout.</p>
                </div>

                <nav aria-label="Shop">
                    <h2 className="mb-3 font-semibold text-text">Shop</h2>
                    <ul className="space-y-2">
                        <li><Link to="/#products" className="hover:text-text">All products</Link></li>
                        <li><Link to="/" className="hover:text-text">Home</Link></li>
                    </ul>
                </nav>

                <nav aria-label="Customer care">
                    <h2 className="mb-3 font-semibold text-text">Customer care</h2>
                    <ul className="space-y-2">
                        <li>
                            <Link to={session ? "/account/orders" : "/login"} className="hover:text-text">
                                My orders
                            </Link>
                        </li>
                        <li>
                            <Link to={session ? "/account" : "/login"} className="hover:text-text">
                                {session ? "My account" : "Sign in"}
                            </Link>
                        </li>
                        {chats.length > 0 && (
                            <li><Link to="/my-chats" className="hover:text-text">Order messages</Link></li>
                        )}
                    </ul>
                </nav>

                {links.length > 0 && (
                    <nav aria-label="Follow us">
                        <h2 className="mb-3 font-semibold text-text">Follow us</h2>
                        <ul className="space-y-2">
                            {links.map(([label, url]) => (
                                <li key={label}>
                                    <a
                                        href={url.trim()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-text"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>

            <div className="mx-auto mt-8 max-w-6xl border-t border-border pt-5 text-center text-xs">
                © {new Date().getFullYear()} {site.storeName}. All rights reserved.
            </div>
        </footer>
    );
}