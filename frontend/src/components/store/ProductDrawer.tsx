import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, Truck, X } from "lucide-react";
import ImageSlider from "./ImageSlider";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useDrawer } from "../../lib/useDrawer";
import { money } from "../../lib/format";
import type { Product } from "../../types";

function DrawerBody({ product, onClose }: { product: Product; onClose: () => void }) {
    const { theme } = useTheme();
    const { add, open: openCart } = useCart();
    const [shown, setShown] = useState(false);
    const [added, setAdded] = useState(false);
    const [qty, setQty] = useState(1);
    const [selected, setSelected] = useState<Record<string, string>>(() =>
        Object.fromEntries(product.variants.map((g) => [g.name, g.options[0]?.label ?? ""]))
    );
    const timer = useRef<number | undefined>(undefined);

    useDrawer(true, onClose);

    useEffect(() => {
        const id = requestAnimationFrame(() => setShown(true));
        return () => {
            cancelAnimationFrame(id);
            window.clearTimeout(timer.current);
        };
    }, []);

    const soldOut = product.inventory <= 0;
    const maxQty = Math.max(1, Math.min(10, product.inventory));
    const variantLabel = product.variants.length
        ? product.variants.map((g) => selected[g.name]).join(" / ")
        : null;

    const handleAdd = () => {
        add(product, variantLabel, qty);
        setAdded(true);
        timer.current = window.setTimeout(() => {
            onClose();
            openCart();
        }, 450);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"
                    }`}
            />
            <aside
                className={`absolute right-0 top-0 h-full w-full max-w-md overflow-x-hidden overflow-y-auto bg-background text-text shadow-2xl transition-transform duration-300 ${shown ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="min-w-0 flex-1 break-words font-bold">{product.name}</h2>
                    <button onClick={onClose} aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-5 p-4">
                    <ImageSlider images={product.images} alt={product.name} />

                    <div>
                        <p className="text-2xl font-bold">{money(product.price_cents, product.currency)}</p>
                        {product.delivery_cents != null && product.delivery_cents > 0 && (
                            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                                <Truck size={17} aria-hidden="true" />
                                <span>
                                    Delivery: {money(product.delivery_cents, product.currency)} per item
                                </span>
                            </p>
                        )}
                        <p className="mt-2 break-words text-muted">{product.description}</p>
                    </div>

                    {product.variants.map((group) => (
                        <div key={group.name}>
                            <p className="mb-2 text-sm font-semibold">
                                {group.name}: <span className="font-normal text-muted">{selected[group.name]}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {group.options.map((opt) => {
                                    const active = selected[group.name] === opt.label;
                                    const pick = () => setSelected({ ...selected, [group.name]: opt.label });
                                    return opt.hex ? (
                                        <button
                                            key={opt.label}
                                            title={opt.label}
                                            aria-label={opt.label}
                                            onClick={pick}
                                            style={{
                                                background: opt.hex,
                                                outline: active ? "3px solid var(--primary)" : "1px solid var(--border)",
                                                outlineOffset: "2px",
                                            }}
                                            className="h-9 w-9 rounded-full"
                                        />
                                    ) : (
                                        <button
                                            key={opt.label}
                                            onClick={pick}
                                            className={`border border-border px-4 py-2 text-sm ${theme.chip} ${active ? "bg-primary text-primary-text" : "bg-surface"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center border border-border bg-surface ${theme.chip}`}>
                            <button
                                aria-label="Less"
                                className="p-3"
                                onClick={() => setQty(Math.max(1, qty - 1))}
                            >
                                <Minus size={16} />
                            </button>
                            <span className="w-6 text-center">{qty}</span>
                            <button
                                aria-label="More"
                                className="p-3"
                                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <button
                            disabled={soldOut || added}
                            onClick={handleAdd}
                            className={`${theme.button} flex flex-1 items-center justify-center gap-2 disabled:opacity-70`}
                        >
                            {added ? (
                                <>
                                    <Check size={18} /> Added
                                </>
                            ) : soldOut ? (
                                "Sold out"
                            ) : (
                                "Add to cart"
                            )}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default function ProductDrawer({
    product,
    onClose,
}: {
    product: Product | null;
    onClose: () => void;
}) {
    if (!product) return null;
    return <DrawerBody key={product.id} product={product} onClose={onClose} />;
}