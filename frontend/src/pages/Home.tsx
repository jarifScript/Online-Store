import { Fragment, useMemo, useState } from "react";
import { Search } from "lucide-react";
import BrandStory from "../components/store/BrandStory";
import Hero from "../components/store/Hero";
import ProductCard from "../components/store/ProductCard";
import ProductDrawer from "../components/store/ProductDrawer";
import { useProducts } from "../context/ProductsContext";
import { useTheme } from "../theme/ThemeProvider";
import type { HomeSectionId, Product } from "../types";

export default function Home({ preview = false }: { preview?: boolean }) {
    const { theme, site } = useTheme();
    const { products, categories, selectedCategoryId, loading, error } = useProducts();
    const [selected, setSelected] = useState<Product | null>(null);
    const [query, setQuery] = useState("");
    const [priceOrder, setPriceOrder] = useState<"featured" | "low-high" | "high-low">("featured");

    const visibleProducts = useMemo(() => {
        const search = query.trim().toLocaleLowerCase();
        const filtered = products.filter((product) => {
            const matchesSearch =
                `${product.name} ${product.description}`.toLocaleLowerCase().includes(search);
            const matchesCategory =
                selectedCategoryId === null || product.category_id === selectedCategoryId;
            return matchesSearch && matchesCategory;
        });

        if (priceOrder === "low-high") {
            return [...filtered].sort((a, b) => a.price_cents - b.price_cents);
        }
        if (priceOrder === "high-low") {
            return [...filtered].sort((a, b) => b.price_cents - a.price_cents);
        }
        return filtered;
    }, [products, query, priceOrder, selectedCategoryId]);

    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

    return (
        <>
            {site.content.homeSections.map((section: HomeSectionId) => {
                if (section === "hero") return <Hero key={section} />;
                if (section === "story") return <BrandStory key={section} />;
                if (!site.content.collection.enabled) return null;
                return (
                    <Fragment key={section}>
                            <section id="products" className={theme.section}>
                                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h1 className={theme.heading}>
                                            {selectedCategory?.name ?? site.content.collection.heading}
                                        </h1>
                                        {!selectedCategory && site.content.collection.description && (
                                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                                                {site.content.collection.description}
                                            </p>
                                        )}
                                        {!loading && !error && (
                                            <p className="mt-1 text-sm text-muted">
                                                {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
                                        <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
                                            <Search
                                                size={18}
                                                aria-hidden="true"
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                            />
                                            <input
                                                type="search"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Search products..."
                                                aria-label="Search products by title or description"
                                                className={`${theme.input} w-full pl-10`}
                                            />
                                        </label>
                                        <label className="sr-only" htmlFor="product-price-order">Sort products by price</label>
                                        <select
                                            id="product-price-order"
                                            value={priceOrder}
                                            onChange={(e) => setPriceOrder(e.target.value as typeof priceOrder)}
                                            className={`${theme.input} w-full sm:w-auto`}
                                        >
                                            <option value="featured">Featured</option>
                                            <option value="low-high">Price: low to high</option>
                                            <option value="high-low">Price: high to low</option>
                                        </select>
                                    </div>
                                </div>

                                {error && <p className="text-red-600">Could not load products: {error}</p>}
                                {!loading && !error && products.length === 0 && (
                                    <p className="text-muted">No products yet.</p>
                                )}
                                {!loading && !error && visibleProducts.length === 0 && (
                                    <p className="text-muted">
                                        {selectedCategory
                                            ? `No products in ${selectedCategory.name} match your search.`
                                            : "No products match your search. Try a different title or description."}
                                    </p>
                                )}

                                <div className={theme.grid}>
                                    {loading &&
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <div key={i} className={`${theme.card} animate-pulse p-3`}>
                                                <div className={`mb-3 aspect-square bg-border ${theme.media}`} />
                                                <div className="mb-2 h-4 w-2/3 rounded bg-border" />
                                                <div className="h-4 w-1/3 rounded bg-border" />
                                            </div>
                                        ))}

                                    {visibleProducts.map((p) => (
                                        <ProductCard key={p.id} product={p} onOpen={setSelected} />
                                    ))}
                                </div>
                            </section>
                    </Fragment>
                );
            })}
            {!preview && <ProductDrawer product={selected} onClose={() => setSelected(null)} />}
        </>
    );
}