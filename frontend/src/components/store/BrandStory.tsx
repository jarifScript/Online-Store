import { useTheme } from "../../theme/ThemeProvider";

export default function BrandStory() {
    const { theme, site } = useTheme();
    const story = site.content.story;
    if (!story.enabled) return null;

    return (
        <section className={`${theme.section} border-t border-border`}>
            <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-12">
                {story.image && (
                    <div className={`min-h-64 overflow-hidden bg-border ${theme.media}`}>
                        <img
                            src={story.image}
                            alt=""
                            loading="lazy"
                            className="h-full min-h-64 w-full object-cover"
                        />
                    </div>
                )}
                <div className={story.image ? "" : "mx-auto max-w-2xl text-center"}>
                    <h2 className={`${theme.heading} mb-4`}>{story.heading}</h2>
                    <p className="whitespace-pre-line leading-relaxed text-muted">{story.text}</p>
                    {story.buttonText && site.content.collection.enabled && (
                        <a href="#products" className={`${theme.button} mt-6 inline-block`}>
                            {story.buttonText}
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}
