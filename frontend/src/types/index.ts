import type { Palette } from "../theme/palettes";

export type LayoutStyle = "minimalist" | "luxury" | "bold" | "tech";
export type HeaderLayout = "menu-left" | "menu-right" | "centered";
export type CornerStyle = "none" | "xl" | "full";
export type ProductStyle =
    | "standard"
    | "marketplace"
    | "horizontal"
    | "carousel"
    | "editorial"
    | "minimal"
    | "feature"
    | "compact";
export type HomeSectionId = "hero" | "products" | "story";
export type ColorKey = keyof Palette;

export interface ThemeConfig {
    layout: LayoutStyle;
    productStyle: ProductStyle;
    header: HeaderLayout;
    sidebar: boolean;
    sidebarPosition: "left" | "right";
    categoryDisplay: "sidebar" | "horizontal";
    palette: string;
    radius: CornerStyle;
    customColors: Partial<Record<ColorKey, string>>;
    font: string; // "auto" or a key from theme/fonts.ts
    buttonStyle: "solid" | "outline" | "soft";
    spacing: "auto" | "compact" | "comfortable" | "spacious";
    columns: "auto" | "2" | "3" | "4";
    hover: "none" | "lift" | "zoom";
}

export interface SiteContent {
    announcement: { enabled: boolean; text: string; backgroundColor: string };
    hero: { enabled: boolean; headline: string; subtext: string; image: string; buttonText: string };
    homeSections: HomeSectionId[];
    collection: { enabled: boolean; heading: string; description: string };
    story: { enabled: boolean; heading: string; text: string; image: string; buttonText: string };
    footerText: string;
    socials: { instagram: string; facebook: string; tiktok: string; youtube: string };
}

export interface SiteSettings {
    storeName: string;
    logoUrl: string | null;
    content: SiteContent;
}

export interface VariantOption {
    label: string;
    hex?: string; // if present, shown as a color swatch
}

export interface VariantGroup {
    name: string;
    options: VariantOption[];
}

export interface Product {
    id: string;
    category_id: string | null;
    name: string;
    description: string;
    price_cents: number;
    delivery_cents?: number | null;
    currency: string;
    images: string[];
    variants: VariantGroup[];
    inventory: number;
    is_active: boolean;
}

export interface ProductCategory {
    id: string;
    name: string;
}

export interface ShippingAddress {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

export interface OrderRow {
    id: string;
    user_id?: string | null;
    created_at: string;
    customer_email: string | null;
    items: {
        product_id: string;
        quantity: number;
        variant: string | null;
        delivery_cents?: number | null;
    }[];
    total_cents: number;
    status: "pending" | "paid" | "failed";
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_address: ShippingAddress | null;
    chat_token: string;
}

export interface ChatMessage {
    id: string;
    sender: "buyer" | "admin";
    body: string;
    created_at: string;
  }