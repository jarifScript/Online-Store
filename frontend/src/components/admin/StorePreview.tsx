import AnnouncementBar from "../layout/AnnouncementBar";
import Header from "../layout/Header";
import Sidebar from "../layout/Sidebar";
import Footer from "../layout/Footer";
import Home from "../../pages/Home";
import { useProducts } from "../../context/ProductsContext";
import { useTheme } from "../../theme/ThemeProvider";

export default function StorePreview() {
    const { theme, site } = useTheme();
    const { categories } = useProducts();

    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <div className={`${theme.page} pointer-events-none select-none !min-h-0`}>
                <AnnouncementBar />
                <Header preview />
                {site.content.collection.enabled &&
                    (theme.showSidebar || categories.length > 0) &&
                    theme.categoryDisplay === "horizontal" && <Sidebar />}
                <div className={theme.body}>
                    {site.content.collection.enabled &&
                        (theme.showSidebar || categories.length > 0) &&
                        theme.categoryDisplay !== "horizontal" && <Sidebar />}
                    <div className="min-w-0 flex-1">
                        <Home preview />
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}