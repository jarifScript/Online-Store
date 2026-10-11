import { useTheme } from "../../theme/ThemeProvider";

export default function AnnouncementBar() {
    const { site } = useTheme();
    const a = site.content.announcement;
    if (!a.enabled || !a.text.trim()) return null;
    const hasCustomColor = /^#[0-9a-fA-F]{6}$/.test(a.backgroundColor);
    return (
        <div
            className={`px-4 py-2 text-center text-sm ${hasCustomColor ? "" : "bg-primary text-primary-text"}`}
            style={hasCustomColor
                ? { backgroundColor: a.backgroundColor, color: getContrastText(a.backgroundColor) }
                : undefined}
        >
            {a.text}
        </div>
    );
}

function getContrastText(hex: string) {
    const channels = [1, 3, 5].map((index) => {
        const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return luminance > 0.179 ? "#111111" : "#ffffff";
}