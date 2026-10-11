import type { ProductStyle } from "../types";

export interface StoreTemplate {
    name: string;
    description: string;
    productStyle: ProductStyle;
    columns: "auto" | "2" | "3" | "4";
}

export const storeTemplates: StoreTemplate[] = [
    {
        name: "Classic storefront",
        description: "Familiar product cards with image, name, price, and a clear options button.",
        productStyle: "standard",
        columns: "3",
    },
    {
        name: "Marketplace grid",
        description: "Compact square product boxes designed to show more items at a glance.",
        productStyle: "marketplace",
        columns: "4",
    },
    {
        name: "Horizontal product rows",
        description: "Wide rows with the product image beside its details and action.",
        productStyle: "horizontal",
        columns: "auto",
    },
    {
        name: "Swipeable product carousel",
        description: "A single side-scrolling row of cards, useful for featured collections.",
        productStyle: "carousel",
        columns: "auto",
    },
    {
        name: "Editorial image tiles",
        description: "Large photo-led cards with product names and prices over the image.",
        productStyle: "editorial",
        columns: "3",
    },
    {
        name: "Featured product tiles",
        description: "Large, spacious cards that give each product more room to stand out.",
        productStyle: "feature",
        columns: "2",
    },
];
