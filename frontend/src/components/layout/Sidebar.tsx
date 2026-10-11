import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { useProducts } from "../../context/ProductsContext";

export default function Sidebar() {
    const { theme } = useTheme();
    const { categories, selectedCategoryId, setSelectedCategoryId } = useProducts();
    const [mobileOpen, setMobileOpen] = useState(false);
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

    const selectCategory = (id: string | null) => {
        setSelectedCategoryId(id);
        setMobileOpen(false);
    };

    const categoryList = (
        <ul className={theme.categoryDisplay === "horizontal" ? "flex w-max min-w-full gap-2" : "space-y-1"}>
            <li>
                <button
                    type="button"
                    aria-pressed={selectedCategoryId === null}
                    onClick={() => selectCategory(null)}
                    className={`${theme.categoryDisplay === "horizontal" ? "whitespace-nowrap px-3" : "w-full px-2 text-left"} rounded py-1.5 text-sm ${
                        selectedCategoryId === null ? "bg-primary text-primary-text" : "text-muted hover:bg-border"
                    }`}
                >
                    All products
                </button>
            </li>
            {categories.map((category) => (
                <li key={category.id}>
                    <button
                        type="button"
                        aria-pressed={selectedCategoryId === category.id}
                        onClick={() => selectCategory(category.id)}
                        className={`${theme.categoryDisplay === "horizontal" ? "whitespace-nowrap px-3" : "w-full px-2 text-left"} rounded py-1.5 text-sm ${
                            selectedCategoryId === category.id
                                ? "bg-primary text-primary-text"
                                : "text-muted hover:bg-border"
                        }`}
                    >
                        {category.name}
                    </button>
                </li>
            ))}
        </ul>
    );

    if (theme.categoryDisplay === "horizontal") {
        return (
            <nav
                aria-label="Product categories"
                className="w-full min-w-0 border-b border-border bg-surface px-3 py-2 sm:px-6"
            >
                <div className="overflow-x-auto overscroll-x-contain">
                    {categoryList}
                </div>
            </nav>
        );
    }

    return (
        <aside className={`w-full shrink-0 border-border bg-surface p-3 sm:p-4 md:w-56 md:p-6 ${theme.sidebarBorder}`}>
            <h2 className="mb-4 hidden font-bold md:block">Categories</h2>

            <button
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-store-categories"
                onClick={() => setMobileOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-left md:hidden"
            >
                <span className="min-w-0">
                    <span className="block font-semibold">Categories</span>
                    <span className="block truncate text-sm text-muted">
                        {selectedCategory?.name ?? "All products"}
                        {categories.length > 0 && ` · ${categories.length} categories`}
                    </span>
                </span>
                <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
                />
            </button>

            <div className="hidden md:block">
                <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain">
                    {categoryList}
                </div>
            </div>
            {mobileOpen && (
                <div
                    id="mobile-store-categories"
                    className="mt-3 max-h-[45dvh] overflow-y-auto overscroll-contain border-t border-border pt-2 md:hidden"
                >
                    {categoryList}
                </div>
            )}
        </aside>
    );
}