import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";

export default function SaveBar() {
    const { dirty, saving, save, discard } = useTheme();
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        if (!message?.ok) return;
        const t = window.setTimeout(() => setMessage(null), 2500);
        return () => window.clearTimeout(t);
    }, [message]);

    if (!dirty && !message) return null;

    const onSave = async () => {
        const err = await save();
        setMessage(err ? { text: err, ok: false } : { text: "Saved", ok: true });
    };

    return (
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full bg-text px-5 py-3 text-background shadow-2xl">
            {message ? (
                <span className="flex items-center gap-2 text-sm">
                    {message.ok && <Check size={16} />}
                    {message.text}
                </span>
            ) : (
                <span className="text-sm">You have unsaved changes</span>
            )}
            {dirty && (
                <>
                    <button
                        onClick={() => {
                            discard();
                            setMessage(null);
                        }}
                        className="text-sm underline opacity-80"
                    >
                        Discard
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-text disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </>
            )}
        </div>
    );
}