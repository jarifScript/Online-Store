import type { HomeSectionId, ThemeConfig } from "../types";

type DesignConfig = Pick<
    ThemeConfig,
    | "layout"
    | "productStyle"
    | "header"
    | "sidebar"
    | "sidebarPosition"
    | "categoryDisplay"
    | "palette"
    | "radius"
    | "customColors"
    | "font"
    | "buttonStyle"
    | "spacing"
    | "columns"
    | "hover"
>;

export interface StoreDesign {
    id: string;
    name: string;
    description: string;
    palette: string;
    sections: HomeSectionId[];
    config: DesignConfig;
}

export const storeDesigns: StoreDesign[] = [
    {
        id: "classic",
        name: "Classic",
        description: "A familiar, balanced storefront with a clear product grid.",
        palette: "earthy",
        sections: ["hero", "products", "story"],
        config: {
            layout: "minimalist",
            productStyle: "standard",
            header: "centered",
            sidebar: false,
            sidebarPosition: "left",
            categoryDisplay: "horizontal",
            palette: "earthy",
            radius: "xl",
            customColors: {},
            font: "auto",
            buttonStyle: "solid",
            spacing: "comfortable",
            columns: "3",
            hover: "zoom",
        },
    },
    {
        id: "modern",
        name: "Modern",
        description: "A clean monochrome look with compact product cards.",
        palette: "monochrome",
        sections: ["hero", "products"],
        config: {
            layout: "minimalist",
            productStyle: "compact",
            header: "centered",
            sidebar: false,
            sidebarPosition: "left",
            categoryDisplay: "horizontal",
            palette: "monochrome",
            radius: "xl",
            customColors: {},
            font: "modern",
            buttonStyle: "outline",
            spacing: "compact",
            columns: "4",
            hover: "none",
        },
    },
    {
        id: "showcase",
        name: "Showcase",
        description: "A spacious, photo-forward design that gives featured products room.",
        palette: "ocean",
        sections: ["hero", "story", "products"],
        config: {
            layout: "luxury",
            productStyle: "feature",
            header: "menu-left",
            sidebar: false,
            sidebarPosition: "left",
            categoryDisplay: "horizontal",
            palette: "ocean",
            radius: "xl",
            customColors: {},
            font: "classic",
            buttonStyle: "solid",
            spacing: "spacious",
            columns: "2",
            hover: "zoom",
        },
    },
];
