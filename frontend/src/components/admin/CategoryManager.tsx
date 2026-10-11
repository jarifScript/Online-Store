import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { useTheme } from "../../theme/ThemeProvider";

export default function CategoryManager() {
    const { theme } = useTheme();
    const { categories, categoriesError, products, reload } = useProducts();
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addCategory = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        const normalizedName = trimmed.replace(/^./u, (first) => first.toLocaleUpperCase());
        if (normalizedName.length > 60) {
            setError("Category names must be 60 characters or fewer.");
            return;
        }

        setBusy(true);
        setError(null);
        const { error: insertError } = await supabase
            .from("product_categories")
            .insert({ name: normalizedName });
        if (insertError) {
            setError(insertError.code === "23505"
                ? "A category with that name already exists."
                : insertError.message);
        } else {
            setName("");
            await reload();
        }
        setBusy(false);
    };

    const removeCategory = async (id: string, categoryName: string) => {
        const assignedCount = products.filter((product) => product.category_id === id).length;
        const warning = assignedCount
            ? `Delete "${categoryName}"? ${assignedCount} product(s) will become uncategorized.`
            : `Delete "${categoryName}"?`;
        if (!window.confirm(warning)) return;

        setBusy(true);
        setError(null);
        const { error: deleteError } = await supabase
            .from("product_categories")
            .delete()
            .eq("id", id);
        if (deleteError) setError(deleteError.message);
        else await reload();
        setBusy(false);
    };

    return (
        <section className={`p-5 ${theme.card}`}>
            <div className="mb-4">
                <h2 className="font-bold">Product categories</h2>
                <p className="mt-1 text-sm text-muted">
                    Create the categories customers can browse from the store sidebar.
                </p>
            </div>

            <form onSubmit={addCategory} className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={60}
                    required
                    placeholder="Category name"
                    aria-label="New category name"
                    disabled={Boolean(categoriesError)}
                    className={`${theme.input} min-w-0 flex-1`}
                />
                <button type="submit" disabled={busy || Boolean(categoriesError)} className={`${theme.button} flex items-center justify-center gap-2 disabled:opacity-60`}>
                    <Plus size={17} /> Add category
                </button>
            </form>

            {categoriesError && (
                <p role="alert" className="mb-3 text-sm text-red-600">
                    Categories are unavailable because the database migration has not been applied.
                    Run <code>database/migrations/001_product_categories.sql</code> in the Supabase SQL Editor,
                    then reload this page.
                </p>
            )}
            {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

            {categories.length === 0 ? (
                <p className="text-sm text-muted">No categories yet. Add one to start organizing products.</p>
            ) : (
                <ul className="space-y-2">
                    {categories.map((category) => {
                        const count = products.filter((product) => product.category_id === category.id).length;
                        return (
                            <li
                                key={category.id}
                                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                            >
                                <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                                <span className="text-xs text-muted">{count} products</span>
                                <button
                                    type="button"
                                    disabled={busy}
                                    aria-label={`Delete ${category.name}`}
                                    onClick={() => removeCategory(category.id, category.name)}
                                    className="p-2 text-muted hover:text-primary disabled:opacity-50"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
