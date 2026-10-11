import { useTheme } from "../../theme/ThemeProvider";

export default function Hero() {
    const { theme, site } = useTheme();
    const h = site.content.hero;
    if (!h.enabled) return null;
    const hasImage = !!h.image;

    return (
        <section className="relative overflow-hidden border-b border-border">
            {hasImage && (
                <>
                    <img src={h.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/45" />
                </>
            )}
            <div
                className={`relative mx-auto max-w-3xl px-6 py-20 text-center ${hasImage ? "text-white" : ""}`}
            >
                <h1 className={`${theme.heading} mb-4 md:text-5xl`}>{h.headline}</h1>
                <p className={`mx-auto mb-8 max-w-xl ${hasImage ? "text-white/90" : "text-muted"}`}>
                    {h.subtext}
                </p>
                {h.buttonText && site.content.collection.enabled && (
                    <a href="#products" className={`${theme.button} inline-block`}>
                        {h.buttonText}
                    </a>
                )}
            </div>
        </section>
    );
}