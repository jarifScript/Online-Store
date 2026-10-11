import { useTheme } from "../../theme/ThemeProvider";
import { money } from "../../lib/format";
import type { Product } from "../../types";

export default function ProductCard({
    product,
    onOpen,
}: {
    product: Product;
    onOpen: (p: Product) => void;
}) {
    const { theme } = useTheme();
    const soldOut = product.inventory <= 0;
    const style = theme.productStyle;
    const cardClass = {
        standard: `${theme.card} flex flex-col p-3`,
        marketplace: `${theme.card} flex flex-col p-2 sm:p-3`,
        horizontal: `${theme.card} flex min-w-0 items-center gap-3 p-3 sm:gap-5`,
        carousel: `${theme.card} flex w-[72vw] max-w-[240px] shrink-0 snap-start flex-col p-3`,
        editorial: `${theme.card} flex flex-col overflow-hidden p-0`,
        minimal: "flex flex-col",
        feature: `${theme.card} flex flex-col p-3 sm:p-4`,
        compact: `${theme.card} flex flex-col p-2`,
    }[style];
    const mediaClass = {
        standard: "mb-3 aspect-square",
        marketplace: "mb-2 aspect-square",
        horizontal: "h-24 w-24 shrink-0 sm:h-32 sm:w-32",
        carousel: "mb-3 aspect-square",
        editorial: "aspect-[4/5]",
        minimal: "mb-2 aspect-[4/5]",
        feature: "mb-4 aspect-[4/3]",
        compact: "mb-2 aspect-square",
    }[style];
    const isEditorial = style === "editorial";
    const isHorizontal = style === "horizontal";

    return (
        <div
            onClick={() => onOpen(product)}
            className={`${cardClass} ${theme.cardHover} group min-w-0 cursor-pointer`}
        >
            <div className={`${mediaClass} relative overflow-hidden bg-border ${theme.media}`}>
                {product.images[0] && (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className={`h-full w-full object-cover ${theme.imageHover}`}
                    />
                )}
                {isEditorial && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                            <p className="line-clamp-2 font-semibold">{product.name}</p>
                            <p className="mt-1 text-sm">{money(product.price_cents, product.currency)}</p>
                        </div>
                    </>
                )}
            </div>
            <div className={`flex min-w-0 flex-1 flex-col ${isEditorial ? "p-3 pt-2" : ""}`}>
                {!isEditorial && (
                    <>
                        <p className={`font-semibold ${style === "marketplace" || style === "compact" ? "text-sm" : ""} ${isHorizontal ? "line-clamp-2" : "truncate"}`}>
                            {product.name}
                        </p>
                        <p className={`mb-3 text-muted ${style === "compact" ? "text-sm" : ""}`}>
                            {money(product.price_cents, product.currency)}
                        </p>
                    </>
                )}
                {soldOut && (
                    <span className="mb-2 w-fit rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                        Sold out
                    </span>
                )}
            <button
                type="button"
                disabled={soldOut}
                className={`${theme.button} mt-auto w-full disabled:opacity-50 ${isHorizontal ? "sm:max-w-48" : ""} ${style === "minimal" ? "text-sm" : ""}`}
            >
                {soldOut ? "Sold out" : "Choose options"}
            </button>
            </div>
        </div>
    );
}