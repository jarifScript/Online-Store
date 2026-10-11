import { Outlet, useLocation } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import CartDrawer from "../store/CartDrawer";
import { useTheme } from "../../theme/ThemeProvider";
import { useProducts } from "../../context/ProductsContext";

export default function StoreLayout() {
    const { theme, site } = useTheme();
    const { categories } = useProducts();
    const { pathname } = useLocation();
    const isChatPage = pathname.startsWith("/chat/");
    const showSidebar =
        (theme.showSidebar || categories.length > 0) &&
        pathname === "/" &&
        site.content.collection.enabled;
    const showHorizontalCategories = showSidebar && theme.categoryDisplay === "horizontal";
    const showCategorySidebar = showSidebar && !showHorizontalCategories;

    return (
        <div className={`${theme.page} flex min-h-screen flex-col ${isChatPage ? "h-dvh overflow-hidden" : ""}`}>
            <AnnouncementBar />
            <Header />
            {showHorizontalCategories && <Sidebar />}
            <div className={`${theme.body} flex-1 ${isChatPage ? "min-h-0 overflow-hidden" : ""}`}>
                {showCategorySidebar && <Sidebar />}
                <main className={`min-w-0 flex-1 ${isChatPage ? "flex min-h-0 flex-col overflow-hidden" : ""}`}>
                    <div className={`mx-auto w-full max-w-[1400px] ${isChatPage ? "flex min-h-0 flex-1 flex-col" : ""}`}>
                        <Outlet />
                    </div>
                </main>
            </div>
            {!isChatPage && <Footer />}
            <CartDrawer />
        </div>
    );
}