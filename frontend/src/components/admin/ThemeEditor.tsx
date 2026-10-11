import { useEffect, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { paletteNames, palettes } from "../../theme/palettes";
import { fontKeys, fontLabels } from "../../theme/fonts";
import type { ColorKey, ThemeConfig } from "../../types";

const colorFields: { key: ColorKey; label: string }[] = [
    { key: "background", label: "Page background" },
    { key: "surface", label: "Cards & header" },
    { key: "primary", label: "Main / button color" },
    { key: "primaryText", label: "Text on buttons" },
    { key: "text", label: "Main text" },
    { key: "muted", label: "Soft text" },
    { key: "border", label: "Borders" },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function ColorRow({
    label, value, isCustom, onChange,
}: {
    label: string;
    value: string;
    isCustom: boolean;
    onChange: (hex: string) => void;
}) {
    const [text, setText] = useState(value);
    useEffect(() => {
        setText(value);
    }, [value]);

    return (
        <div className="mb-2 flex items-center gap-3">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0"
            />
            <input
                value={text}
                maxLength={7}
                onChange={(e) => {
                    let v = e.target.value.trim();
                    if (v && !v.startsWith("#")) v = "#" + v;
                    setText(v);
                    if (isHex(v)) onChange(v.toLowerCase());
                }}
                className="w-24 rounded-md border border-border bg-background px-2 py-1 font-mono text-sm text-text"
                placeholder="#000000"
            />
            <span className="flex-1 text-sm">{label}</span>
            {isCustom && <span className="text-xs text-primary">custom</span>}
        </div>
    );
}

function Group<T extends string>({
    label, options, value, onChange, labels,
}: {
    label: string;
    options: readonly T[];
    value: T;
    onChange: (v: T) => void;
    labels?: Record<string, string>;
}) {
    const { theme } = useTheme();
    return (
        <div className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">{label}</p>
            <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => onChange(o)}
                        className={`border border-border px-3 py-1.5 text-sm capitalize ${theme.chip} ${value === o ? "bg-primary text-primary-text" : "bg-background text-text"
                            }`}
                    >
                        {labels?.[o] ?? o.replace("-", " ")}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function ThemeEditor() {
    const { config, theme, setConfig } = useTheme();

    const custom = config.customColors ?? {};
    const base = palettes[config.palette] ?? palettes.earthy;
    const colors = { ...base, ...custom };
    const hasCustom = Object.keys(custom).length > 0;

    const update = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) =>
        setConfig({ ...config, [key]: value });

    const setColor = (key: ColorKey, hex: string) =>
        setConfig({ ...config, customColors: { ...custom, [key]: hex } });

    return (
        <div className={`p-5 text-text ${theme.card}`}>
            <h2 className="mb-4 font-bold">Appearance</h2>

            <Group label="Layout style" options={["minimalist", "luxury", "bold", "tech"] as const}
                value={config.layout} onChange={(v) => update("layout", v)} />
            <Group label="Font" options={["auto", ...fontKeys]} labels={fontLabels}
                value={config.font} onChange={(v) => update("font", v)} />
            <Group label="Header" options={["menu-left", "menu-right", "centered"] as const}
                value={config.header} onChange={(v) => update("header", v)} />
            <Group label="Corners" options={["none", "xl", "full"] as const}
                value={config.radius} onChange={(v) => update("radius", v)} />
            <Group label="Button style" options={["solid", "outline", "soft"] as const}
                value={config.buttonStyle} onChange={(v) => update("buttonStyle", v)} />
            <Group label="Spacing" options={["auto", "compact", "comfortable", "spacious"] as const}
                labels={{ auto: "Layout default" }}
                value={config.spacing} onChange={(v) => update("spacing", v)} />
            <Group label="Product grid" options={["auto", "2", "3", "4"] as const}
                labels={{ auto: "Layout default", "2": "2 columns", "3": "3 columns", "4": "4 columns" }}
                value={config.columns} onChange={(v) => update("columns", v)} />
            <Group label="Card hover effect" options={["none", "lift", "zoom"] as const}
                value={config.hover} onChange={(v) => update("hover", v)} />
            <Group label="Sidebar position" options={["left", "right"] as const}
                value={config.sidebarPosition} onChange={(v) => update("sidebarPosition", v)} />
            <Group
                label="Category navigation"
                options={["sidebar", "horizontal"] as const}
                labels={{ sidebar: "Side menu", horizontal: "Scrollable row" }}
                value={config.categoryDisplay ?? "sidebar"}
                onChange={(v) => update("categoryDisplay", v)}
            />

            <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={config.sidebar}
                    onChange={(e) => update("sidebar", e.target.checked)}
                />
                Show sidebar
            </label>

            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Quick palettes</p>
            <div className="mb-6 grid grid-cols-6 gap-2">
                {paletteNames.map((name) => (
                    <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => setConfig({ ...config, palette: name, customColors: {} })}
                        style={{
                            background: palettes[name].primary,
                            outline: config.palette === name && !hasCustom ? "3px solid var(--text)" : "none",
                            outlineOffset: "2px",
                        }}
                        className="h-8 rounded-full"
                    />
                ))}
            </div>

            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted">Custom colors (hex code)</p>
                {hasCustom && (
                    <button type="button" onClick={() => update("customColors", {})} className="text-xs text-primary underline">
                        Reset to palette colors
                    </button>
                )}
            </div>
            {colorFields.map((f) => (
                <ColorRow
                    key={f.key}
                    label={f.label}
                    value={colors[f.key]}
                    isCustom={f.key in custom}
                    onChange={(hex) => setColor(f.key, hex)}
                />
            ))}
        </div>
    );
}