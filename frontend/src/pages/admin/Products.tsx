import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/format";
import { useProducts } from "../../context/ProductsContext";
import { useTheme } from "../../theme/ThemeProvider";
import ProductForm from "../../components/admin/ProductForm";
import CategoryManager from "../../components/admin/CategoryManager";
import type { Product } from "../../types";

export default function Products() {
    const { theme } = useTheme();
    const { categories, reload } = useProducts();
    const [rows, setRows] = useState<Product[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Product | "new" | null>(null);

    const load = useCallback(async () => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) setError(error.message);
        else setRows((data ?? []) as Product[]);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = async () => {
        await load();
        await reload(); // update the public store too
    };

    const toggle = async (p: Product) => {
        const { error } = await supabase
            .from("products")
            .update({ is_active: !p.is_active })
            .eq("id", p.id);
        if (error) setError(error.message);
        await refresh();
    };

    const remove = async (p: Product) => {
        if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
        const { error } = await supabase.from("products").delete().eq("id", p.id);
        if (error) setError(error.message);
        await refresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Products</h1>
                <button onClick={() => setEditing("new")} className={`${theme.button} flex items-center gap-2`}>
                    <Plus size={18} /> Add product
                </button>
            </div>

            {error && <p className="text-red-600">{error}</p>}
            <CategoryManager />
            {!rows && !error && <p className="text-muted">Loading...</p>}
            {rows && rows.length === 0 && <p className="text-muted">No products yet. Add your first one.</p>}

            <div className="space-y-3">
                {rows?.map((p) => (
                    <div key={p.id} className={`flex items-center gap-4 p-3 ${theme.card}`}>
                        <div className={`h-16 w-16 shrink-0 overflow-hidden bg-border ${theme.media}`}>
                            {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{p.name}</p>
                            <p className="text-sm text-muted">
                                {categories.find((category) => category.id === p.category_id)?.name ?? "Uncategorized"}
                                {" · "}
                                {money(p.price_cents, p.currency)} ·{" "}
                                {p.inventory === 0 ? (
                                    <span className="font-semibold text-red-600">Sold out</span>
                                ) : (
                                    `${p.inventory} in stock`
                                )}
                            </p>
                        </div>
                        <label className="hidden cursor-pointer items-center gap-2 text-sm sm:flex">
                            <input type="checkbox" checked={p.is_active} onChange={() => toggle(p)} />
                            Visible
                        </label>
                        <button aria-label="Edit" onClick={() => setEditing(p)} className="p-2 text-muted hover:text-primary">
                            <Pencil size={18} />
                        </button>
                        <button aria-label="Delete" onClick={() => remove(p)} className="p-2 text-muted hover:text-primary">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {editing && (
                <ProductForm
                    product={editing === "new" ? null : editing}
                    categories={categories}
                    onCancel={() => setEditing(null)}
                    onSaved={async () => {
                        setEditing(null);
                        await refresh();
                    }}
                />
            )}
        </div>
    );
}