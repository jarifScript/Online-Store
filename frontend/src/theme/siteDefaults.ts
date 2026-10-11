import type { HomeSectionId, SiteContent, SiteSettings } from "../types";

const homeSectionIds: HomeSectionId[] = ["hero", "products", "story"];

export const defaultContent: SiteContent = {
    announcement: { enabled: false, text: "Free shipping on orders over $50", backgroundColor: "" },
    hero: {
        enabled: false,
        headline: "Welcome to our store",
        subtext: "Discover products made with care.",
        image: "",
        buttonText: "Shop now",
    },
    homeSections: homeSectionIds,
    collection: { enabled: true, heading: "New Arrivals", description: "" },
    story: {
        enabled: false,
        heading: "Made with care",
        text: "Tell customers what makes your store special.",
        image: "",
        buttonText: "Explore the collection",
    },
    footerText: "",
    socials: { instagram: "", facebook: "", tiktok: "", youtube: "" },
};

export const defaultSite: SiteSettings = {
    storeName: "My Store",
    logoUrl: null,
    content: defaultContent,
};

// Fills in anything missing from what is saved in the database
export function mergeContent(raw?: Partial<SiteContent> | null): SiteContent {
    const homeSections = Array.isArray(raw?.homeSections)
        ? raw.homeSections.filter(
            (section): section is HomeSectionId =>
                section === "hero" || section === "products" || section === "story"
        )
        : homeSectionIds;
    const orderedHomeSections = [
        ...new Set([...homeSections, ...homeSectionIds]),
    ];

    return {
        announcement: { ...defaultContent.announcement, ...(raw?.announcement ?? {}) },
        hero: { ...defaultContent.hero, ...(raw?.hero ?? {}) },
        homeSections: orderedHomeSections,
        collection: { ...defaultContent.collection, ...(raw?.collection ?? {}) },
        story: { ...defaultContent.story, ...(raw?.story ?? {}) },
        footerText: raw?.footerText ?? defaultContent.footerText,
        socials: { ...defaultContent.socials, ...(raw?.socials ?? {}) },
    };
}