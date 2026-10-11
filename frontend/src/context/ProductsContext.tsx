import {
    createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Product, ProductCategory } from "../types";

interface ProductsValue {
    products: Product[];
    categories: ProductCategory[];
    selectedCategoryId: string | null;
    setSelectedCategoryId: (id: string | null) => void;
    loading: boolean;
    error: string | null;
    categoriesError: string | null;
    reload: () => Promise<void>;
}

const ProductsContext = createContext<ProductsValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const [productResult, categoryResult] = await Promise.all([
            supabase
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false }),
            supabase.from("product_categories").select("id,name").order("name"),
        ]);
        if (productResult.error) setError(productResult.error.message);
        else {
            setError(null);
            setProducts((productResult.data ?? []) as Product[]);
        }
        if (categoryResult.error) {
            setCategoriesError(categoryResult.error.message);
        } else {
            setCategoriesError(null);
            setCategories((categoryResult.data ?? []) as ProductCategory[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <ProductsContext.Provider value={{
            products,
            categories,
            selectedCategoryId,
            setSelectedCategoryId,
            loading,
            error,
            categoriesError,
            reload: load,
        }}>
            {children}
        </ProductsContext.Provider>
    );
}

export function useProducts() {
    const ctx = useContext(ProductsContext);
    if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
    return ctx;
  }