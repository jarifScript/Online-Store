import type {
    CornerStyle,
    HeaderLayout,
    HomeSectionId,
    LayoutStyle,
    ProductStyle,
    ThemeConfig,
} from "../types";
import { fontKeys } from "./fonts";
import { paletteNames } from "./palettes";
import { storeDesigns } from "./storeDesigns";

export interface StoreThemeTemplate {
    format: "my-store-theme";
    version: 1;
    name: string;
    description: string;
    config: ThemeConfig;
    homepage: {
        sections: HomeSectionId[];
        heroEnabled: boolean;
        collectionEnabled: boolean;
        storyEnabled: boolean;
    };
}

const layoutStyles: readonly LayoutStyle[] = ["minimalist", "luxury", "bold", "tech"];
const productStyles: readonly ProductStyle[] = [
    "standard", "marketplace", "horizontal", "carousel", "editorial", "minimal", "feature", "compact",
];
const headerLayouts: readonly HeaderLayout[] = ["menu-left", "menu-right", "centered"];
const cornerStyles: readonly CornerStyle[] = ["none", "xl", "full"];
const sectionIds: readonly HomeSectionId[] = ["hero", "products", "story"];
const buttonStyles: readonly ThemeConfig["buttonStyle"][] = ["solid", "outline", "soft"];
const spacingStyles: readonly ThemeConfig["spacing"][] = ["auto", "compact", "comfortable", "spacious"];
const columnOptions: readonly ThemeConfig["columns"][] = ["auto", "2", "3", "4"];
const hoverStyles: readonly ThemeConfig["hover"][] = ["none", "lift", "zoom"];
const colorKeys = ["background", "surface", "primary", "primaryText", "text", "muted", "border"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
    return typeof value === "string" && options.includes(value as T);
}

function isHomeSectionId(value: unknown): value is HomeSectionId {
    return isOneOf(value, sectionIds);
}

function isThemeConfig(value: unknown): value is ThemeConfig {
    if (!isRecord(value) || !isRecord(value.customColors)) return false;

    const customColors = value.customColors;
    return isOneOf(value.layout, layoutStyles)
        && isOneOf(value.productStyle, productStyles)
        && isOneOf(value.header, headerLayouts)
        && typeof value.sidebar === "boolean"
        && (value.sidebarPosition === "left" || value.sidebarPosition === "right")
        && (value.categoryDisplay === "sidebar" || value.categoryDisplay === "horizontal")
        && isOneOf(value.palette, paletteNames)
        && isOneOf(value.radius, cornerStyles)
        && colorKeys.every((key) =>
            customColors[key] === undefined
            || (typeof customColors[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(customColors[key]))
        )
        && (value.font === "auto" || isOneOf(value.font, fontKeys))
        && isOneOf(value.buttonStyle, buttonStyles)
        && isOneOf(value.spacing, spacingStyles)
        && isOneOf(value.columns, columnOptions)
        && isOneOf(value.hover, hoverStyles);
}

export function createThemeTemplate(
    name: string,
    description: string,
    config: ThemeConfig,
    homepage: StoreThemeTemplate["homepage"],
): StoreThemeTemplate {
    return {
        format: "my-store-theme",
        version: 1,
        name,
        description,
        config,
        homepage,
    };
}

export function parseThemeTemplate(value: unknown): StoreThemeTemplate {
    if (!isRecord(value) || value.format !== "my-store-theme" || value.version !== 1) {
        throw new Error("This file is not a supported My Store theme template (format version 1).");
    }
    if (
        typeof value.name !== "string"
        || !value.name.trim()
        || value.name.length > 100
        || typeof value.description !== "string"
        || value.description.length > 500
    ) {
        throw new Error("The template needs a name (up to 100 characters) and description (up to 500 characters).");
    }
    if (!isThemeConfig(value.config)) {
        throw new Error("The template appearance settings are invalid. Export a template first to see the supported settings.");
    }

    const homepage = value.homepage;
    if (!isRecord(homepage) || !Array.isArray(homepage.sections)) {
        throw new Error("The template needs homepage sections and visibility settings.");
    }
    const sections = homepage.sections;
    if (
        !sections.every(isHomeSectionId)
        || new Set(sections).size !== sections.length
        || !sections.includes("products")
        || typeof homepage.heroEnabled !== "boolean"
        || homepage.collectionEnabled !== true
        || typeof homepage.storyEnabled !== "boolean"
    ) {
        throw new Error("Homepage settings must include the products section and keep the product collection enabled.");
    }

    return {
        format: "my-store-theme",
        version: 1,
        name: value.name,
        description: value.description,
        config: value.config,
        homepage: {
            sections,
            heroEnabled: homepage.heroEnabled,
            collectionEnabled: homepage.collectionEnabled,
            storyEnabled: homepage.storyEnabled,
        },
    };
}

export const builtInThemeTemplates: StoreThemeTemplate[] = storeDesigns.map((design) =>
    createThemeTemplate(
        design.name,
        design.description,
        { ...design.config },
        {
            sections: [...design.sections],
            heroEnabled: true,
            collectionEnabled: true,
            storyEnabled: true,
        },
    )
);
