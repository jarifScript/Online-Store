import type { ThemeConfig } from "../types";
import { fonts } from "./fonts";

export const defaultTheme: ThemeConfig = {
    layout: "minimalist",
    productStyle: "standard",
    header: "centered",
    sidebar: false,
    sidebarPosition: "left",
    categoryDisplay: "sidebar",
    palette: "earthy",
    radius: "xl",
    customColors: {},
    font: "auto",
    buttonStyle: "solid",
    spacing: "auto",
    columns: "auto",
    hover: "zoom",
};

// ---------- Layout styles ----------
interface LayoutParts {
    page: string;
    section: string;
    heading: string;
    grid: string;
    card: string;
    button: string;
    buttonBorder: string;
    borderColor: string;
}

const layouts: Record<string, LayoutParts> = {
    minimalist: {
        page: "font-sans",
        section: "py-10 px-4 sm:py-16 sm:px-8",
        heading: "text-2xl sm:text-3xl font-light tracking-wide",
        grid: "grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8",
        card: "border border-border",
        button: "font-medium",
        buttonBorder: "border-2",
        borderColor: "border-primary",
    },
    luxury: {
        page: "font-serif",
        section: "py-10 px-4 sm:py-14 sm:px-8",
        heading: "text-3xl sm:text-4xl font-normal italic tracking-wider",
        grid: "grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-10",
        card: "border-4 border-double border-primary",
        button: "uppercase tracking-widest text-sm",
        buttonBorder: "border-2",
        borderColor: "border-primary",
    },
    bold: {
        page: "font-sans",
        section: "py-8 px-4 sm:py-10 sm:px-5",
        heading: "text-3xl sm:text-4xl font-black uppercase",
        grid: "grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6",
        card: "border-4 border-text shadow-[6px_6px_0_0_var(--text)]",
        button: "font-black uppercase",
        buttonBorder: "border-4 shadow-[4px_4px_0_0_var(--text)]",
        borderColor: "border-text",
    },
    tech: {
        page: "font-mono",
        section: "py-6 px-3 sm:px-4",
        heading: "text-lg sm:text-xl font-semibold uppercase tracking-tight",
        grid: "grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3",
        card: "border border-border",
        button: "font-mono text-sm",
        buttonBorder: "border-2",
        borderColor: "border-primary",
    },
};

// ---------- Button styles ----------
const buttonStyles: Record<string, string> = {
    solid: "bg-primary text-primary-text",
    outline: "bg-transparent text-primary",
    soft: "bg-border text-text",
};

// ---------- Spacing / columns / hover ----------
const spacings: Record<string, string> = {
    compact: "py-5 px-3 sm:py-6 sm:px-4",
    comfortable: "py-8 px-4 sm:py-12 sm:px-6",
    spacious: "py-12 px-5 sm:py-20 sm:px-10",
};

const columnsMap: Record<string, string> = {
    "2": "grid-cols-2 gap-3 sm:gap-6",
    "3": "grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6",
    "4": "grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6",
};

const hovers: Record<string, { card: string; image: string }> = {
    none: { card: "", image: "" },
    lift: { card: "transition hover:-translate-y-1 hover:shadow-xl", image: "" },
    zoom: { card: "", image: "transition-transform duration-300 group-hover:scale-105" },
};

// ---------- Corner shapes ----------
interface CornerParts {
    button: string;
    input: string;
    card: string;
    media: string;
    chip: string;
}

const corners: Record<string, CornerParts> = {
    none: { button: "rounded-none", input: "rounded-none", card: "rounded-none", media: "rounded-none", chip: "rounded-none" },
    xl: { button: "rounded-xl", input: "rounded-xl", card: "rounded-xl", media: "rounded-lg", chip: "rounded-xl" },
    full: { button: "rounded-full", input: "rounded-full", card: "rounded-[2rem]", media: "rounded-3xl", chip: "rounded-full" },
};

// ---------- Header layouts ----------
interface HeaderParts {
    wrapper: string;
    menu: string;
    logo: string;
    cart: string;
}

const headers: Record<string, HeaderParts> = {
    centered: {
        wrapper: "grid grid-cols-[1fr_auto_1fr] items-center gap-2",
        menu: "justify-self-start",
        logo: "justify-self-center",
        cart: "justify-self-end",
    },
    "menu-left": {
        wrapper: "flex items-center gap-3 sm:gap-8",
        menu: "order-1",
        logo: "order-2",
        cart: "order-3 ml-auto",
    },
    "menu-right": {
        wrapper: "flex items-center gap-3 sm:gap-8",
        logo: "order-1",
        menu: "order-2 ml-auto",
        cart: "order-3",
    },
};

// ---------- The compiler ----------
export interface CompiledTheme {
    page: string;
    section: string;
    heading: string;
    grid: string;
    productStyle: ThemeConfig["productStyle"];
    card: string;
    cardHover: string;
    imageHover: string;
    button: string;
    input: string;
    media: string;
    chip: string;
    header: HeaderParts;
    body: string;
    showSidebar: boolean;
    sidebarBorder: string;
    categoryDisplay: ThemeConfig["categoryDisplay"];
}

export function compileTheme(raw?: Partial<ThemeConfig> | null): CompiledTheme {
    const c: ThemeConfig = { ...defaultTheme, ...raw };
    const layout = layouts[c.layout] ?? layouts.minimalist;
    const corner = corners[c.radius] ?? corners.xl;
    const header = headers[c.header] ?? headers.centered;
    const hover = hovers[c.hover] ?? hovers.zoom;
    const right = c.sidebarPosition === "right";
    const customFont = c.font !== "auto" && !!fonts[c.font];

    const buttonColor = buttonStyles[c.buttonStyle] ?? buttonStyles.solid;
    const buttonBorderColor = c.buttonStyle === "soft" ? "border-transparent" : layout.borderColor;
    const productGrid: Partial<Record<ThemeConfig["productStyle"], string>> = {
        horizontal: "grid-cols-1 gap-3 sm:gap-4",
        carousel: "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
        feature: "grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8",
        compact: c.columns === "auto"
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            : columnsMap[c.columns],
    };
    const selectedProductGrid = productGrid[c.productStyle];

    return {
        page: `min-h-screen bg-background text-text ${customFont ? "font-body" : layout.page}`,
        section: spacings[c.spacing] ?? layout.section,
        heading: `${layout.heading} ${customFont ? "font-heading" : ""}`,
        grid: selectedProductGrid
            ? `${c.productStyle === "carousel" ? "" : "grid "}${selectedProductGrid}`
            : `grid ${columnsMap[c.columns] ?? layout.grid}`,
        productStyle: c.productStyle,
        card: `bg-surface ${layout.card} ${corner.card}`,
        cardHover: hover.card,
        imageHover: hover.image,
        button: `${buttonColor} ${buttonBorderColor} ${layout.buttonBorder} px-4 py-2.5 sm:px-5 transition active:scale-95 hover:opacity-90 ${layout.button} ${corner.button}`,
        input: `bg-surface text-text border border-border px-4 py-2.5 outline-none focus:border-primary ${corner.input}`,
        media: corner.media,
        chip: corner.chip,
        header,
        body: right ? "flex flex-col md:flex-row-reverse" : "flex flex-col md:flex-row",
        showSidebar: c.sidebar,
        categoryDisplay: c.categoryDisplay ?? "sidebar",
        sidebarBorder: right
            ? "border-b md:border-b-0 md:border-l"
            : "border-b md:border-b-0 md:border-r",
    };
}