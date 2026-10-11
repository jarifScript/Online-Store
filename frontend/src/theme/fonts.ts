export interface FontPair {
    label: string;
    heading: string;
    body: string;
    query: string; // the Google Fonts part of the link
}

export const fonts: Record<string, FontPair> = {
    modern: {
        label: "Modern",
        heading: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
        query: "family=Inter:wght@400;500;700;900",
    },
    classic: {
        label: "Classic",
        heading: "'Playfair Display', serif",
        body: "'Lora', serif",
        query: "family=Playfair+Display:wght@400;700&family=Lora:wght@400;600",
    },
    playful: {
        label: "Playful",
        heading: "'Fredoka', sans-serif",
        body: "'Nunito', sans-serif",
        query: "family=Fredoka:wght@400;600&family=Nunito:wght@400;700",
    },
    elegant: {
        label: "Elegant",
        heading: "'Cormorant Garamond', serif",
        body: "'Montserrat', sans-serif",
        query: "family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;600",
    },
    tech: {
        label: "Tech",
        heading: "'Space Grotesk', sans-serif",
        body: "'JetBrains Mono', monospace",
        query: "family=Space+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;600",
    },
    condensed: {
        label: "Condensed",
        heading: "'Oswald', sans-serif",
        body: "'Roboto', sans-serif",
        query: "family=Oswald:wght@400;600&family=Roboto:wght@400;500;700",
    },
};

export const fontKeys = Object.keys(fonts);

export const fontLabels: Record<string, string> = {
    auto: "Layout default",
    ...Object.fromEntries(Object.entries(fonts).map(([key, f]) => [key, f.label])),
};

export const fontUrl = (f: FontPair) =>
    `https://fonts.googleapis.com/css2?${f.query}&display=swap`;