import { useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/upload";
import { useDrawer } from "../../lib/useDrawer";
import { useTheme } from "../../theme/ThemeProvider";
import type { Product, ProductCategory } from "../../types";
import { TextField } from "./Field";

interface OptionState {
    label: string;
    hex: string;
}
interface GroupState {
    name: string;
    kind: "text" | "color";
    options: OptionState[];
}

function toGroups(p: Product | null): GroupState[] {
    return (p?.variants ?? []).map((g) => ({
        name: g.name,
        kind: g.options.some((o) => o.hex) ? "color" : "text",
        options: g.options.map((o) => ({ label: o.label, hex: o.hex ?? "#888888" })),
    }));
}

export default function ProductForm({
    product, categories, onSaved, onCancel,
}: {
    product: Product | null;
    categories: ProductCategory[];
    onSaved: () => void;
    onCancel: () => void;
}) {
    const { theme } = useTheme();
    useDrawer(true, onCancel);

    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
    const [price, setPrice] = useState(product ? (product.price_cents / 100).toFixed(2) : "");
    const [deliveryCost, setDeliveryCost] = useState(
        product?.delivery_cents != null ? (product.delivery_cents / 100).toFixed(2) : "",
    );
    const [inventory, setInventory] = useState(String(product?.inventory ?? 10));
    const [isActive, setIsActive] = useState(product?.is_active ?? true);
    const [images, setImages] = useState<string[]>(product?.images ?? []);
    const [groups, setGroups] = useState<GroupState[]>(() => toGroups(product));
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateGroup = (gi: number, patch: Partial<GroupState>) =>
        setGroups(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

    const updateOption = (gi: number, oi: number, patch: Partial<OptionState>) =>
        updateGroup(gi, {
            options: groups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)),
        });

    const onFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError(null);
        try {
            const urls: string[] = [];
            for (const f of Array.from(files)) urls.push(await uploadImage(f, "products"));
            setImages((prev) => [...prev, ...urls]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
        }
        setUploading(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const priceCents = Math.round(parseFloat(price) * 100);
        const deliveryCents = deliveryCost.trim() ? Math.round(parseFloat(deliveryCost) * 100) : null;
        const stock = parseInt(inventory, 10);
        if (!name.trim()) return setError("Please enter a product name");
        if (!categories.some((category) => category.id === categoryId)) {
            return setError("Please select an available product category");
        }
        if (!Number.isFinite(priceCents) || priceCents < 0) return setError("Enter a valid price, like 19.99");
        if (deliveryCost.trim()) {
            if (
                !/^\d+(\.\d{1,2})?$/.test(deliveryCost.trim())
                || deliveryCents === null
                || !Number.isSafeInteger(deliveryCents)
                || deliveryCents < 0
            ) {
                return setError("Enter a valid delivery cost, like 4.99, or leave it blank");
            }
        }
        if (!Number.isFinite(stock) || stock < 0) return setError("Stock must be 0 or more");

        const variants = groups
            .filter((g) => g.name.trim() && g.options.some((o) => o.label.trim()))
            .map((g) => ({
                name: g.name.trim(),
                options: g.options
                    .filter((o) => o.label.trim())
                    .map((o) =>
                        g.kind === "color" ? { label: o.label.trim(), hex: o.hex } : { label: o.label.trim() }
                    ),
            }));

        const row = {
            name: name.trim(),
            category_id: categoryId,
            description,
            price_cents: priceCents,
            delivery_cents: deliveryCents,
            inventory: stock,
            is_active: isActive,
            images,
            variants,
        };

        setBusy(true);
        const { error: err } = product
            ? await supabase.from("products").update(row).eq("id", product.id)
            : await supabase.from("products").insert(row);
        setBusy(false);

        if (err) return setError(err.message);
        onSaved();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
            <form
                onSubmit={submit}
                className="my-8 w-full max-w-2xl rounded-xl border border-border bg-background p-6 text-text"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{product ? "Edit product" : "Add product"}</h2>
                    <button type="button" onClick={onCancel} aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                <TextField label="Name" value={name} onChange={setName} />
                <TextField label="Description" multiline value={description} onChange={setDescription} />

                <label className="mb-5 block text-sm font-medium">
                    Category
                    <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={`${theme.input} mt-1 block w-full`}
                    >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                        <span className="mt-1 block text-xs text-muted">
                            Create a category above before adding products.
                        </span>
                    )}
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <TextField label="Price (e.g. 19.99)" value={price} onChange={setPrice} />
                    <TextField label="Stock" value={inventory} onChange={setInventory} />
                </div>
                <label className="mb-5 block text-sm font-medium">
                    Delivery cost per item (optional)
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={deliveryCost}
                        onChange={(e) => setDeliveryCost(e.target.value)}
                        placeholder="Leave blank for no product delivery fee"
                        className={`${theme.input} mt-1 block w-full`}
                    />
                    <span className="mt-1 block text-xs font-normal text-muted">
                        Charged for each item and shown to buyers only when set.
                    </span>
                </label>

                <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Visible in the store
                </label>

                {/* Images */}
                <p className="mb-2 text-xs uppercase tracking-wider text-muted">Images (the first one is the main image)</p>
                <div className="mb-5 flex flex-wrap gap-3">
                    {images.map((src, i) => (
                        <div key={src} className={`relative h-20 w-20 overflow-hidden border border-border ${theme.media}`}>
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                aria-label="Remove image"
                                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <label
                        className={`grid h-20 w-20 cursor-pointer place-items-center border border-dashed border-border text-muted ${theme.media}`}
                    >
                        {uploading ? <span className="text-xs">...</span> : <ImagePlus size={22} />}
                        <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
                    </label>
                </div>

                {/* Variants */}
                <p className="mb-2 text-xs uppercase tracking-wider text-muted">Options (colors, sizes...)</p>
                {groups.map((g, gi) => (
                    <div key={gi} className={`mb-3 border border-border p-3 ${theme.card}`}>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <input
                                value={g.name}
                                placeholder="Name, e.g. Color"
                                onChange={(e) => updateGroup(gi, { name: e.target.value })}
                                className={`${theme.input} flex-1`}
                            />
                            <select
                                value={g.kind}
                                onChange={(e) => updateGroup(gi, { kind: e.target.value as "text" | "color" })}
                                className={`${theme.input}`}
                            >
                                <option value="text">Text (sizes)</option>
                                <option value="color">Color swatches</option>
                            </select>
                            <button
                                type="button"
                                aria-label="Remove option group"
                                onClick={() => setGroups(groups.filter((_, i) => i !== gi))}
                                className="text-muted hover:text-primary"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {g.options.map((o, oi) => (
                            <div key={oi} className="mb-2 flex items-center gap-2">
                                {g.kind === "color" && (
                                    <input
                                        type="color"
                                        value={o.hex}
                                        onChange={(e) => updateOption(gi, oi, { hex: e.target.value })}
                                        className="h-9 w-10 cursor-pointer border-0 bg-transparent p-0"
                                    />
                                )}
                                <input
                                    value={o.label}
                                    placeholder={g.kind === "color" ? "Color name" : "e.g. Small"}
                                    onChange={(e) => updateOption(gi, oi, { label: e.target.value })}
                                    className={`${theme.input} flex-1`}
                                />
                                <button
                                    type="button"
                                    aria-label="Remove"
                                    onClick={() =>
                                        updateGroup(gi, { options: g.options.filter((_, i) => i !== oi) })
                                    }
                                    className="text-muted hover:text-primary"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                updateGroup(gi, { options: [...g.options, { label: "", hex: "#888888" }] })
                            }
                            className="flex items-center gap-1 text-sm text-primary"
                        >
                            <Plus size={16} /> Add choice
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() =>
                        setGroups([...groups, { name: "", kind: "text", options: [{ label: "", hex: "#888888" }] }])
                    }
                    className="mb-6 flex items-center gap-1 text-sm text-primary"
                >
                    <Plus size={16} /> Add option group
                </button>

                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm underline">
                        Cancel
                    </button>
                    <button type="submit" disabled={busy || uploading} className={`${theme.button} disabled:opacity-60`}>
                        {busy ? "Saving..." : "Save product"}
                    </button>
                </div>
            </form>
        </div>
    );
}