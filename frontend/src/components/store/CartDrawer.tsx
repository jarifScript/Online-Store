import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useProducts } from "../../context/ProductsContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useDrawer } from "../../lib/useDrawer";
import { startCheckout } from "../../lib/api";
import { money } from "../../lib/format";

export default function CartDrawer() {
    const { theme } = useTheme();
    const {
        lines,
        subtotalCents,
        deliveryTotalCents,
        totalCents,
        count,
        isOpen,
        close,
        add,
        setQuantity,
        remove,
    } = useCart();
    const { products } = useProducts();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useDrawer(isOpen, close);

    // Upsells: in-stock products without options that are not already in the cart
    const upsells = products
        .filter(
            (p) =>
                p.inventory > 0 &&
                p.variants.length === 0 &&
                !lines.some((l) => l.product.id === p.id)
        )
        .slice(0, 2);

    const checkout = async () => {
        if (busy || lines.length === 0) return;
        setBusy(true);
        setError(null);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 30_000);
        try {
            await startCheckout(
                lines.map((l) => ({
                    product_id: l.product.id,
                    quantity: l.quantity,
                    variant: l.variant,
                })),
                controller.signal,
            );
        } catch (e) {
            setError(
                e instanceof Error && e.name === "AbortError"
                    ? "Checkout took too long to respond. Please try again."
                    : e instanceof Error ? e.message : "Something went wrong",
            );
            setBusy(false);
        } finally {
            window.clearTimeout(timeout);
        }
    };

    return (
        <div
            aria-hidden={!isOpen}
            className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
        >
            <div
                onClick={close}
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
            />
            <aside
                className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background text-text shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="flex items-center gap-2 font-bold">
                        <ShoppingBag size={20} /> Your cart
                        {count > 0 && (
                            <span className="text-sm font-normal text-muted">
                                ({count} {count === 1 ? "item" : "items"})
                            </span>
                        )}
                    </h2>
                    <button onClick={close} aria-label="Close cart">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {lines.length === 0 && <p className="text-muted">Your cart is empty.</p>}

                    {lines.map((l) => (
                        <div key={l.key} className={`flex gap-3 p-3 ${theme.card}`}>
                            <div className={`h-20 w-20 shrink-0 overflow-hidden bg-border ${theme.media}`}>
                                {l.product.images[0] && (
                                    <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{l.product.name}</p>
                                {l.variant && <p className="text-sm text-muted">{l.variant}</p>}
                                <p className="text-sm">{money(l.product.price_cents, l.product.currency)}</p>
                                {l.product.delivery_cents != null && l.product.delivery_cents > 0 && (
                                    <p className="text-sm text-muted">
                                        Delivery ({l.quantity} {l.quantity === 1 ? "item" : "items"}):{" "}
                                        {money(l.product.delivery_cents * l.quantity, l.product.currency)}
                                    </p>
                                )}
                                <div className="mt-2 flex items-center gap-3">
                                    <div className={`flex items-center border border-border ${theme.chip}`}>
                                        <button
                                            aria-label="Less"
                                            className="p-1.5"
                                            onClick={() => setQuantity(l.key, l.quantity - 1)}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                                        <button
                                            aria-label="More"
                                            className="p-1.5"
                                            onClick={() => setQuantity(l.key, l.quantity + 1)}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        aria-label="Remove"
                                        className="ml-auto text-muted hover:text-primary"
                                        onClick={() => remove(l.key)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {lines.length > 0 && upsells.length > 0 && (
                        <div className="pt-2">
                            <p className="mb-3 text-sm font-semibold">You might also like</p>
                            <div className="space-y-3">
                                {upsells.map((p) => (
                                    <div key={p.id} className={`flex items-center gap-3 p-2 ${theme.card}`}>
                                        <div className={`h-14 w-14 shrink-0 overflow-hidden bg-border ${theme.media}`}>
                                            {p.images[0] && (
                                                <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{p.name}</p>
                                            <p className="text-sm text-muted">{money(p.price_cents, p.currency)}</p>
                                        </div>
                                        <button
                                            onClick={() => add(p, null, 1)}
                                            className={`${theme.button} !px-3 !py-1.5 text-sm`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {lines.length > 0 && (
                    <div className="space-y-3 border-t border-border bg-surface p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{money(subtotalCents)}</span>
                        </div>
                        {deliveryTotalCents > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span>Product delivery</span>
                                <span>{money(deliveryTotalCents)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
                            <span>Total</span>
                            <span>{money(totalCents)}</span>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="button"
                            onClick={checkout}
                            disabled={busy}
                            className={`${theme.button} w-full disabled:opacity-60`}
                        >
                            {busy ? "Preparing checkout..." : "Checkout securely"}
                        </button>
                        <p className="text-center text-xs text-muted">
                            Any additional shipping and taxes are handled at checkout.
                        </p>
                    </div>
                )}
            </aside>
        </div>
    );
}