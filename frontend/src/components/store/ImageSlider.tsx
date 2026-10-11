import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";

export default function ImageSlider({ images, alt }: { images: string[]; alt: string }) {
    const { theme } = useTheme();
    const track = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    const goTo = (i: number) => {
        const el = track.current;
        if (!el) return;
        el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    };

    const onScroll = () => {
        const el = track.current;
        if (!el) return;
        setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    return (
        <div className={`relative aspect-square w-full overflow-hidden bg-border ${theme.media}`}>
            <div
                ref={track}
                onScroll={onScroll}
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {images.map((src, i) => (
                    <img
                        key={src}
                        src={src}
                        alt={`${alt} ${i + 1}`}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="h-full w-full shrink-0 snap-center object-cover"
                    />
                ))}
            </div>

            {images.length > 1 && (
                <>
                    <button
                        aria-label="Previous image"
                        onClick={() => goTo(Math.max(0, index - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        aria-label="Next image"
                        onClick={() => goTo(Math.min(images.length - 1, index + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}