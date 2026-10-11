import { Link, NavLink, Outlet } from "react-router-dom";
import {
    ExternalLink, LayoutDashboard, LogOut, MessageSquare, Package, Palette, Receipt, Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useUnreadChats } from "../../lib/useUnreadChats";
import SaveBar from "../../components/admin/SaveBar";

const menu = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/products", label: "Products", icon: Package, end: false },
    { to: "/admin/orders", label: "Orders", icon: Receipt, end: false },
    { to: "/admin/chats", label: "Chats", icon: MessageSquare, end: false },
    { to: "/admin/customize", label: "Customize", icon: Palette, end: false },
    { to: "/admin/settings", label: "Store settings", icon: Settings, end: false },
];

export default function AdminLayout() {
    const { theme } = useTheme();
    const { signOut } = useAuth();
    const unread = useUnreadChats();

    return (
        <div className={`${theme.page} flex flex-col md:flex-row`}>
            <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-surface p-3 md:sticky md:top-0 md:h-screen md:w-60 md:self-start md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:p-4">
                <p className="hidden px-3 pb-3 text-lg font-bold md:block">Admin</p>

                {menu.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm ${theme.chip} ${isActive ? "bg-primary text-primary-text" : "hover:bg-border"
                            }`
                        }
                    >
                        <Icon size={18} /> {label}
                        {to === "/admin/chats" && unread > 0 && (
                            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                                {unread}
                            </span>
                        )}
                    </NavLink>
                ))}

                <div className="flex shrink-0 gap-2 md:mt-auto md:flex-col">
                    <Link
                        to="/"
                        className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm hover:bg-border ${theme.chip}`}
                    >
                        <ExternalLink size={18} /> View store
                    </Link>
                    <button
                        onClick={signOut}
                        className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm hover:bg-border ${theme.chip}`}
                    >
                        <LogOut size={18} /> Log out
                    </button>
                </div>
            </aside>

            <main className="min-w-0 flex-1 p-4 md:p-8">
                <Outlet />
            </main>
            <SaveBar />
        </div>
    );
}