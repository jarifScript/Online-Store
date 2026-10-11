import { useTheme } from "../../theme/ThemeProvider";

export function TextField({
    label, value, onChange, placeholder, multiline,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const { theme } = useTheme();
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">{label}</span>
            {multiline ? (
                <textarea
                    rows={3}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none focus:border-primary"
                />
            ) : (
                <input
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${theme.input} w-full`}
                />
            )}
        </label>
    );
}

export function Toggle({
    label, checked, onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            {label}
        </label>
    );
}