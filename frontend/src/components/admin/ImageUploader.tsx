import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { uploadImage } from "../../lib/upload";
import { useTheme } from "../../theme/ThemeProvider";

export default function ImageUploader({
    label, value, onChange, folder,
}: {
    label: string;
    value: string | null;
    onChange: (url: string | null) => void;
    folder: string;
}) {
    const { theme } = useTheme();
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pick = async (file?: File) => {
        if (!file) return;
        setBusy(true);
        setError(null);
        try {
            onChange(await uploadImage(file, folder));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
        }
        setBusy(false);
        if (input.current) input.current.value = "";
    };

    return (
        <div className="mb-3">
            <p className="mb-1 text-xs uppercase tracking-wider text-muted">{label}</p>
            <div className="flex items-center gap-3">
                <div
                    className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-border bg-background ${theme.media}`}
                >
                    {value ? (
                        <img src={value} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <ImagePlus size={22} className="text-muted" />
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => input.current?.click()}
                        className={`${theme.button} !px-4 !py-2 text-sm disabled:opacity-60`}
                    >
                        {busy ? "Uploading..." : value ? "Replace" : "Upload"}
                    </button>
                    {value && (
                        <button type="button" onClick={() => onChange(null)} className="text-sm text-muted underline">
                            Remove
                        </button>
                    )}
                </div>
                <input
                    ref={input}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => pick(e.target.files?.[0])}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}