import { Check, Image as ImageIcon, Sparkles } from "lucide-react";
import { useProducts } from "../../context/ProductsContext";
import { useTheme } from "../../theme/ThemeProvider";
import { storeTemplates } from "../../theme/storeTemplates";
import type { Product, ProductStyle, ThemeConfig } from "../../types";

function matchesTemplate(config: ThemeConfig, style: ProductStyle, columns: ThemeConfig["columns"]) {
    return config.productStyle === style && config.columns === columns;
}

function LayoutPreview({ style, products }: { style: ProductStyle; products: Product[] }) {
    const examples = products.slice(0, style === "horizontal" ? 2 : 4);
    const horizontal = style === "horizontal";
    const carousel = style === "carousel";
    const wide = style === "feature";
    const editorial = style === "editorial";
    const minimal = style === "minimal";
    const compact = style === "compact";
    const marketplace = style === "marketplace";
    const gridClass: Partial<Record<ProductStyle, string>> = {
        standard: "grid grid-cols-2 gap-1.5",
        marketplace: "grid grid-cols-4 gap-1",
        editorial: "grid grid-cols-2 gap-1.5",
        minimal: "grid grid-cols-3 gap-1",
        feature: "grid grid-cols-2 gap-1.5",
        compact: "grid grid-cols-4 gap-1",
    };

    return (
        <div className={`mt-3 h-28 overflow-hidden rounded-md bg-background p-2 ${
            carousel ? "flex gap-2" : horizontal ? "space-y-1.5" : gridClass[style]
        }`}>
            {examples.map((product, index) => (
                <div
                    key={product.id}
                    className={
                        horizontal
                            ? "flex min-w-0 items-center gap-2 rounded border border-border bg-surface p-1"
                            : `${carousel ? "w-16 shrink-0" : ""} min-w-0 overflow-hidden ${
                                minimal ? "bg-transparent" : "rounded border border-border bg-surface"
                            }`
                    }
                >
                    <div
                        className={`relative grid shrink-0 place-items-center overflow-hidden bg-border ${
                            horizontal
                                ? "h-9 w-9 rounded"
                                : `${editorial || wide ? "h-20" : compact || marketplace ? "h-9" : "h-12"} w-full ${minimal ? "" : "rounded-sm"}`
                        }`}
                    >
                        {product.images[0] ? (
                            <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon size={14} className="text-muted" />
                        )}
                        {editorial && (
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-3 text-left text-[7px] text-white">
                                {product.name}
                            </span>
                        )}
                    </div>
                    <div className={`min-w-0 ${horizontal ? "flex-1" : editorial ? "hidden" : "p-1"}`}>
                        <span className="block truncate text-[8px] font-medium">
                            {product.name || `Product ${index + 1}`}
                        </span>
                        <span className="mt-1 block h-1 w-1/2 rounded bg-primary/60" />
                        {marketplace && (
                            <span className="mt-1 block h-2 w-4 rounded-sm bg-primary" />
                        )}
                    </div>
                </div>
            ))}
            {examples.length === 0 && (
                <div className="col-span-full flex items-center justify-center text-xs text-muted">
                    Product layout preview
                </div>
            )}
        </div>
    );
}

export default function StoreTemplatePicker() {
    const { config, setConfig, theme } = useTheme();
    const { products } = useProducts();

    return (
        <section className={`p-5 ${theme.card}`}>
            <div className="mb-4 flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-primary" />
                <div>
                    <h2 className="font-bold">Product display templates</h2>
                    <p className="mt-1 text-sm text-muted">
                        Choose how products are arranged and presented. The live preview updates immediately;
                        save changes to publish the selected layout to every visitor.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {storeTemplates.map((item) => {
                    const selected = matchesTemplate(config, item.productStyle, item.columns);
                    return (
                        <button
                            key={item.name}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setConfig({
                                ...config,
                                productStyle: item.productStyle,
                                columns: item.columns,
                            })}
                            className={`min-w-0 rounded-xl border p-3 text-left transition hover:border-primary ${
                                selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                            }`}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{item.name}</span>
                                {selected && <Check size={16} className="shrink-0 text-primary" />}
                            </span>
                            <span className="mt-1 block min-h-10 break-words text-sm text-muted">{item.description}</span>
                            <LayoutPreview style={item.productStyle} products={products} />
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
