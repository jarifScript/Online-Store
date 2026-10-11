import { ArrowDown, ArrowUp } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { palettes } from "../../theme/palettes";
import { TextField, Toggle } from "./Field";
import ImageUploader from "./ImageUploader";
import type { HomeSectionId, SiteContent } from "../../types";

export default function ContentEditor() {
    const { config, theme, site, setSite } = useTheme();
    const c = site.content;
    const palette = palettes[config.palette] ?? palettes.earthy;
    const defaultAnnouncementColor = config.customColors?.primary ?? palette.primary;
    const sectionLabels: Record<HomeSectionId, string> = {
        hero: "Hero banner",
        products: "Product collection",
        story: "Brand story",
    };

    const setAnnouncement = (patch: Partial<SiteContent["announcement"]>) =>
        setSite({ ...site, content: { ...c, announcement: { ...c.announcement, ...patch } } });

    const setHero = (patch: Partial<SiteContent["hero"]>) =>
        setSite({ ...site, content: { ...c, hero: { ...c.hero, ...patch } } });

    const setCollection = (patch: Partial<SiteContent["collection"]>) =>
        setSite({ ...site, content: { ...c, collection: { ...c.collection, ...patch } } });

    const setStory = (patch: Partial<SiteContent["story"]>) =>
        setSite({ ...site, content: { ...c, story: { ...c.story, ...patch } } });

    const sectionEnabled = (id: HomeSectionId) => {
        if (id === "hero") return c.hero.enabled;
        if (id === "products") return c.collection.enabled;
        return c.story.enabled;
    };

    const setSectionEnabled = (id: HomeSectionId, enabled: boolean) => {
        if (id === "hero") setHero({ enabled });
        else if (id === "products") setCollection({ enabled });
        else setStory({ enabled });
    };

    const moveSection = (index: number, offset: -1 | 1) => {
        const nextIndex = index + offset;
        if (nextIndex < 0 || nextIndex >= c.homeSections.length) return;
        const homeSections = [...c.homeSections];
        [homeSections[index], homeSections[nextIndex]] = [homeSections[nextIndex], homeSections[index]];
        setSite({ ...site, content: { ...c, homeSections } });
    };

    return (
        <div className="space-y-6">
            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-1 font-bold">Homepage sections</h2>
                <p className="mb-4 text-sm text-muted">
                    Show or hide sections and change their order on the storefront.
                </p>
                <ol className="space-y-2">
                    {c.homeSections.map((id, index) => (
                        <li
                            key={id}
                            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                        >
                            <span className="min-w-0 flex-1 font-medium">{sectionLabels[id]}</span>
                            <Toggle
                                label={`Show ${sectionLabels[id].toLocaleLowerCase()}`}
                                checked={sectionEnabled(id)}
                                onChange={(enabled) => setSectionEnabled(id, enabled)}
                            />
                            <div className="flex shrink-0 gap-1">
                                <button
                                    type="button"
                                    aria-label={`Move ${sectionLabels[id]} up`}
                                    disabled={index === 0}
                                    onClick={() => moveSection(index, -1)}
                                    className="rounded p-2 text-muted hover:bg-border disabled:opacity-40"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Move ${sectionLabels[id]} down`}
                                    disabled={index === c.homeSections.length - 1}
                                    onClick={() => moveSection(index, 1)}
                                    className="rounded p-2 text-muted hover:bg-border disabled:opacity-40"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Announcement bar</h2>
                <Toggle label="Show announcement bar" checked={c.announcement.enabled}
                    onChange={(v) => setAnnouncement({ enabled: v })} />
                <TextField label="Text" value={c.announcement.text}
                    onChange={(v) => setAnnouncement({ text: v })} />
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                        <input
                            type="color"
                            aria-label="Announcement bar background color"
                            value={c.announcement.backgroundColor || defaultAnnouncementColor}
                            onChange={(e) => setAnnouncement({ backgroundColor: e.target.value })}
                            className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0"
                        />
                        Bar background color
                    </label>
                    {c.announcement.backgroundColor && (
                        <button
                            type="button"
                            onClick={() => setAnnouncement({ backgroundColor: "" })}
                            className="text-xs text-primary underline"
                        >
                            Use theme color
                        </button>
                    )}
                </div>
                <p className="text-xs text-muted">Text color adjusts automatically for readability.</p>
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Hero banner</h2>
                <Toggle label="Show hero banner on the home page" checked={c.hero.enabled}
                    onChange={(v) => setHero({ enabled: v })} />
                <TextField label="Headline" value={c.hero.headline} onChange={(v) => setHero({ headline: v })} />
                <TextField label="Sub text" multiline value={c.hero.subtext} onChange={(v) => setHero({ subtext: v })} />
                <TextField label="Button text (leave empty for no button)" value={c.hero.buttonText}
                    onChange={(v) => setHero({ buttonText: v })} />
                <ImageUploader label="Background image (optional)" folder="hero"
                    value={c.hero.image || null} onChange={(url) => setHero({ image: url ?? "" })} />
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Product collection</h2>
                <TextField label="Heading" value={c.collection.heading}
                    onChange={(v) => setCollection({ heading: v })} />
                <TextField label="Description (optional)" multiline value={c.collection.description}
                    onChange={(v) => setCollection({ description: v })} />
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Brand story</h2>
                <TextField label="Heading" value={c.story.heading}
                    onChange={(v) => setStory({ heading: v })} />
                <TextField label="Text" multiline value={c.story.text}
                    onChange={(v) => setStory({ text: v })} />
                <TextField label="Button text (leave empty for no button)" value={c.story.buttonText}
                    onChange={(v) => setStory({ buttonText: v })} />
                <ImageUploader label="Story image (optional)" folder="story"
                    value={c.story.image || null} onChange={(url) => setStory({ image: url ?? "" })} />
            </div>
        </div>
    );
}