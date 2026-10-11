import {
    createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { useProducts } from "./ProductsContext";
import type { Product } from "../types";

export interface CartLine {
    key: string; // product id + chosen variant
    product: Product;
    quantity: number;
    variant: string | null;
}

interface CartValue {
    lines: CartLine[];
    count: number;
    subtotalCents: number;
    deliveryTotalCents: number;
    totalCents: number;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    add: (product: Product, variant: string | null, quantity?: number) => void;
    setQuantity: (key: string, quantity: number) => void;
    remove: (key: string) => void;
    clear: () => void;
}

const STORAGE_KEY = "store-cart-v1";
const CartContext = createContext<CartValue | null>(null);

function cartLineKey(productId: string, variant: string | null) {
    return JSON.stringify([productId, variant]);
}

function isProduct(value: unknown): value is Product {
    if (typeof value !== "object" || value === null) return false;
    const product = value as Partial<Product>;
    return typeof product.id === "string"
        && typeof product.name === "string"
        && typeof product.description === "string"
        && typeof product.price_cents === "number"
        && Number.isSafeInteger(product.price_cents)
        && (product.delivery_cents == null
            || (typeof product.delivery_cents === "number"
                && Number.isSafeInteger(product.delivery_cents)
                && product.delivery_cents >= 0))
        && typeof product.currency === "string"
        && Array.isArray(product.images)
        && Array.isArray(product.variants)
        && typeof product.inventory === "number"
        && Number.isFinite(product.inventory)
        && typeof product.is_active === "boolean";
}

function loadCart(): CartLine[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];

        const lines = new Map<string, CartLine>();
        for (const value of parsed) {
            if (typeof value !== "object" || value === null) continue;
            const line = value as Partial<CartLine>;
            const quantity = line.quantity;
            if (
                !isProduct(line.product)
                || typeof quantity !== "number"
                || !Number.isInteger(quantity)
                || quantity < 1
                || (line.variant !== undefined && line.variant !== null && typeof line.variant !== "string")
            ) {
                continue;
            }
            const variant = typeof line.variant === "string" ? line.variant : null;
            const key = cartLineKey(line.product.id, variant);
            const existing = lines.get(key);
            const max = Math.max(1, Math.min(20, line.product.inventory));
            const mergedQuantity = Math.min(max, (existing?.quantity ?? 0) + quantity);
            lines.set(key, {
                key,
                product: line.product,
                variant,
                quantity: mergedQuantity,
            });
        }
        return [...lines.values()];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { products, loading: productsLoading } = useProducts();
    const [lines, setLines] = useState<CartLine[]>(loadCart);
    const [isOpen, setIsOpen] = useState(false);
    const currentProducts = useMemo(
        () => new Map(products.map((product) => [product.id, product])),
        [products],
    );
    const displayLines = useMemo(
        () => productsLoading
            ? lines
            : lines.map((line) => {
                const current = currentProducts.get(line.product.id);
                return current ? { ...line, product: current } : line;
            }),
        [currentProducts, lines, productsLoading],
    );

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(displayLines));
        } catch {
            /* storage full or blocked: ignore */
        }
    }, [displayLines]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    const add = useCallback((product: Product, variant: string | null, quantity = 1) => {
        const key = cartLineKey(product.id, variant);
        const max = Math.max(1, Math.min(20, product.inventory));
        setLines((prev) => {
            const existing = prev.find((l) => l.key === key);
            if (existing) {
                return prev.map((l) =>
                    l.key === key ? { ...l, quantity: Math.min(max, l.quantity + quantity) } : l
                );
            }
            return [...prev, { key, product, variant, quantity: Math.min(max, quantity) }];
        });
    }, []);

    const setQuantity = useCallback((key: string, quantity: number) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l.key !== key) return l;
                const product = currentProducts.get(l.product.id) ?? l.product;
                const max = Math.max(1, Math.min(20, product.inventory));
                return { ...l, quantity: Math.max(1, Math.min(max, quantity)) };
            })
        );
    }, [currentProducts]);

    const remove = useCallback((key: string) => {
        setLines((prev) => prev.filter((l) => l.key !== key));
    }, []);

    const clear = useCallback(() => setLines([]), []);

    const count = useMemo(() => displayLines.reduce((n, l) => n + l.quantity, 0), [displayLines]);
    const subtotalCents = useMemo(
        () => displayLines.reduce((sum, l) => sum + l.product.price_cents * l.quantity, 0),
        [displayLines]
    );
    const deliveryTotalCents = useMemo(
        () => displayLines.reduce((sum, l) => sum + (l.product.delivery_cents ?? 0) * l.quantity, 0),
        [displayLines]
    );
    const totalCents = subtotalCents + deliveryTotalCents;

    return (
        <CartContext.Provider
            value={{
                lines: displayLines,
                count,
                subtotalCents,
                deliveryTotalCents,
                totalCents,
                isOpen,
                open,
                close,
                add,
                setQuantity,
                remove,
                clear,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
  }