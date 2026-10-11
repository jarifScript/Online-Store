import { useRef, useState, type ChangeEvent } from "react";
import { Check, Download, FileUp, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { palettes } from "../../theme/palettes";
import {
    builtInThemeTemplates,
    createThemeTemplate,
    parseThemeTemplate,
    type StoreThemeTemplate,
} from "../../theme/themeTemplates";

function matchesTemplate(
    config: ReturnType<typeof useTheme>["config"],
    content: ReturnType<typeof useTheme>["site"]["content"],
    template: StoreThemeTemplate,
) {
    return (
        Object.entries(template.config).every(([key, value]) =>
            JSON.stringify(config[key as keyof typeof config]) === JSON.stringify(value)
        ) &&
        JSON.stringify(content.homeSections) === JSON.stringify(template.homepage.sections) &&
        content.hero.enabled === template.homepage.heroEnabled &&
        content.collection.enabled === template.homepage.collectionEnabled &&
        content.story.enabled === template.homepage.storyEnabled
    );
}

export default function StoreDesignPicker() {
    const { config, setConfig, site, setSite, theme } = useTheme();
    const fileInput = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const applyTemplate = (template: StoreThemeTemplate) => {
        setConfig({ ...template.config });
        setSite({
            ...site,
            content: {
                ...site.content,
                homeSections: [...template.homepage.sections],
                hero: { ...site.content.hero, enabled: template.homepage.heroEnabled },
                collection: { ...site.content.collection, enabled: template.homepage.collectionEnabled },
                story: { ...site.content.story, enabled: template.homepage.storyEnabled },
            },
        });
        setMessage({ text: `"${template.name}" applied. Save changes to publish it.`, error: false });
    };

    const exportTemplate = () => {
        const template = createThemeTemplate(
            `${site.storeName} theme`,
            "Exported storefront appearance and homepage layout.",
            config,
            {
                sections: site.content.homeSections.includes("products")
                    ? site.content.homeSections
                    : [...site.content.homeSections, "products"],
                heroEnabled: site.content.hero.enabled,
                collectionEnabled: true,
                storyEnabled: site.content.story.enabled,
            },
        );
        const fileName = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "store"}-theme.json`;
        const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        setMessage({ text: "Theme template exported.", error: false });
    };

    const importTemplate = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.size > 1024 * 1024) {
            setMessage({ text: "Theme files must be smaller than 1 MB.", error: true });
            return;
        }

        try {
            const template = parseThemeTemplate(JSON.parse(await file.text()) as unknown);
            applyTemplate(template);
        } catch (error) {
            setMessage({
                text: error instanceof Error ? error.message : "Could not read this theme file.",
                error: true,
            });
        }
    };

    return (
        <section className={`p-5 ${theme.card}`}>
            <div className="mb-5 flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-primary" />
                <div>
                    <h2 className="font-bold">Store themes</h2>
                    <p className="mt-1 text-sm text-muted">
                        Choose a complete storefront look or import a theme file. Themes change presentation,
                        never your products, prices, images, or store copy.
                    </p>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className={`${theme.button} inline-flex items-center gap-2 text-sm`}
                >
                    <FileUp size={16} />
                    Import theme JSON
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".json,application/json"
                    onChange={importTemplate}
                    className="hidden"
                    aria-label="Choose a My Store theme JSON file"
                />
                <button
                    type="button"
                    onClick={exportTemplate}
                    className={`${theme.button} inline-flex items-center gap-2 text-sm`}
                >
                    <Download size={16} />
                    Export current theme
                </button>
            </div>
            <p className="mb-3 text-xs text-muted">
                Templates are versioned JSON settings files, not Shopify Liquid or executable code.
                Export a theme to get an editable example format.
            </p>
            {message && (
                <p className={`mb-4 text-sm ${message.error ? "text-red-600" : "text-primary"}`} role="status">
                    {message.text}
                </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {builtInThemeTemplates.map((template) => {
                    const selected = matchesTemplate(config, site.content, template);
                    const palette = palettes[template.config.palette];

                    return (
                        <button
                            key={template.name}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => applyTemplate(template)}
                            className={`min-w-0 rounded-xl border p-3 text-left transition hover:border-primary ${
                                selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                            }`}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{template.name}</span>
                                {selected && <Check size={16} className="shrink-0 text-primary" />}
                            </span>
                            <span className="mt-1 block min-h-10 break-words text-sm text-muted">
                                {template.description}
                            </span>
                            <span
                                aria-hidden="true"
                                className="mt-3 flex h-24 overflow-hidden rounded-md border border-border"
                                style={{ backgroundColor: palette?.background }}
                            >
                                <span className="flex w-1/3 flex-col gap-2 p-2">
                                    <span className="h-2 w-full" style={{ backgroundColor: palette?.text }} />
                                    <span
                                        className="h-14 w-full rounded-sm"
                                        style={{ backgroundColor: palette?.primary }}
                                    />
                                </span>
                                <span className="flex flex-1 flex-col gap-2 p-2">
                                    <span className="h-2 w-2/3" style={{ backgroundColor: palette?.text }} />
                                    <span className="grid flex-1 grid-cols-2 gap-1">
                                        <span style={{ backgroundColor: palette?.surface }} />
                                        <span style={{ backgroundColor: palette?.border }} />
                                    </span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
