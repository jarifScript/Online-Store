import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { SiteSettings, ThemeConfig } from "../types";
import { palettes } from "./palettes";
import { fonts, fontUrl } from "./fonts";
import { compileTheme, defaultTheme, type CompiledTheme } from "./themeCompiler";
import { defaultSite, mergeContent } from "./siteDefaults";

interface Snapshot {
    config: ThemeConfig;
    site: SiteSettings;
}

interface ThemeContextValue {
    config: ThemeConfig;
    theme: CompiledTheme;
    setConfig: (config: ThemeConfig) => void;
    site: SiteSettings;
    setSite: (site: SiteSettings) => void;
    dirty: boolean;
    saving: boolean;
    save: () => Promise<string | null>;
    discard: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<ThemeConfig>(defaultTheme);
    const [site, setSite] = useState<SiteSettings>(defaultSite);
    const [saved, setSaved] = useState<Snapshot>({ config: defaultTheme, site: defaultSite });
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);

    // 1. Load everything saved in Supabase
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await supabase
                    .from("store_settings")
                    .select("store_name, logo_url, content, theme_config")
                    .eq("id", 1)
                    .single();
                if (data && !cancelled) {
                    const cfg: ThemeConfig = { ...defaultTheme, ...(data.theme_config ?? {}) };
                    const s: SiteSettings = {
                        storeName: data.store_name || defaultSite.storeName,
                        logoUrl: data.logo_url ?? null,
                        content: mergeContent(data.content),
                    };
                    setConfig(cfg);
                    setSite(s);
                    setSaved({ config: cfg, site: s });
                }
            } catch {
                /* keep the defaults */
            }
            if (!cancelled) setLoaded(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // 2. Palette colors + custom colors -> CSS variables
    useEffect(() => {
        const base = palettes[config.palette] ?? palettes[defaultTheme.palette];
        const p = { ...base, ...(config.customColors ?? {}) };
        const vars: Record<string, string> = {
            "--background": p.background,
            "--surface": p.surface,
            "--primary": p.primary,
            "--primary-text": p.primaryText,
            "--text": p.text,
            "--muted": p.muted,
            "--border": p.border,
        };
        Object.entries(vars).forEach(([name, value]) =>
            document.documentElement.style.setProperty(name, value)
        );
    }, [config.palette, config.customColors]);

    // 3. Fonts: load from Google Fonts and set CSS variables
    useEffect(() => {
        const pair = fonts[config.font];
        if (!pair) return;
        const id = "store-font-link";
        let link = document.getElementById(id) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
        link.href = fontUrl(pair);
        document.documentElement.style.setProperty("--font-heading", pair.heading);
        document.documentElement.style.setProperty("--font-body", pair.body);
    }, [config.font]);

    // 4. Browser tab title = store name
    useEffect(() => {
        document.title = site.storeName;
    }, [site.storeName]);

    const theme = useMemo(() => compileTheme(config), [config]);

    const dirty = useMemo(
        () => JSON.stringify({ config, site }) !== JSON.stringify(saved),
        [config, site, saved]
    );

    const save = async (): Promise<string | null> => {
        setSaving(true);
        const { data, error } = await supabase
            .from("store_settings")
            .update({
                store_name: site.storeName,
                logo_url: site.logoUrl,
                content: site.content,
                theme_config: config,
                updated_at: new Date().toISOString(),
            })
            .eq("id", 1)
            .select();
        setSaving(false);
        if (error) return error.message;
        if (!data || data.length === 0) {
            return "Not allowed to save. Log out and log in again as admin.";
        }
        setSaved({ config, site });
        return null;
    };

    const discard = () => {
        setConfig(saved.config);
        setSite(saved.site);
    };

    return (
        <ThemeContext.Provider
            value={{ config, theme, setConfig, site, setSite, dirty, saving, save, discard }}
        >
            {loaded ? children : <div style={{ minHeight: "100vh" }} />}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
    return ctx;
}