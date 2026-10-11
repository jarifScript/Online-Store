export interface Palette {
    background: string;
    surface: string;
    primary: string;
    primaryText: string;
    text: string;
    muted: string;
    border: string;
}

export const palettes: Record<string, Palette> = {
    earthy: { background: "#f5efe6", surface: "#fffaf2", primary: "#8b5e3c", primaryText: "#ffffff", text: "#3b2f2a", muted: "#8a7a6d", border: "#dccfbf" },
    pastel: { background: "#fdf6fb", surface: "#ffffff", primary: "#f4a6c0", primaryText: "#4a2b3a", text: "#4a3f4f", muted: "#9a8fa3", border: "#f0dbe8" },
    cyberpunk: { background: "#0d0221", surface: "#1a0b3b", primary: "#ff2a6d", primaryText: "#ffffff", text: "#05d9e8", muted: "#8a7fb5", border: "#3b1f7a" },
    monochrome: { background: "#ffffff", surface: "#f4f4f5", primary: "#111111", primaryText: "#ffffff", text: "#111111", muted: "#71717a", border: "#e4e4e7" },
    ocean: { background: "#f0f8ff", surface: "#ffffff", primary: "#0077b6", primaryText: "#ffffff", text: "#03243a", muted: "#5c7a8f", border: "#cde4f2" },
    sunset: { background: "#fff4ec", surface: "#ffffff", primary: "#f4511e", primaryText: "#ffffff", text: "#4a1c0e", muted: "#a0705f", border: "#fbd9c6" },
    forest: { background: "#f1f6f0", surface: "#ffffff", primary: "#2d6a4f", primaryText: "#ffffff", text: "#1b2e24", muted: "#5f7a6b", border: "#d0e0d4" },
    rose: { background: "#fff5f6", surface: "#ffffff", primary: "#e11d48", primaryText: "#ffffff", text: "#3f0d1a", muted: "#9f6372", border: "#fbd5dc" },
    midnight: { background: "#0f172a", surface: "#1e293b", primary: "#6366f1", primaryText: "#ffffff", text: "#e2e8f0", muted: "#94a3b8", border: "#334155" },
    mint: { background: "#f0fdf9", surface: "#ffffff", primary: "#14b8a6", primaryText: "#ffffff", text: "#123c37", muted: "#5b8a84", border: "#c7efe8" },
    lavender: { background: "#f7f5ff", surface: "#ffffff", primary: "#7c3aed", primaryText: "#ffffff", text: "#2e1f4d", muted: "#8379a6", border: "#e0d9f7" },
    noirGold: { background: "#111111", surface: "#1b1b1b", primary: "#c9a227", primaryText: "#111111", text: "#f5f0e1", muted: "#a69f8a", border: "#333333" },
};

export const paletteNames = Object.keys(palettes);