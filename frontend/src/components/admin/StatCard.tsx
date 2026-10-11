import type { ReactNode } from "react";
import { useTheme } from "../../theme/ThemeProvider";

export default function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: ReactNode;
}) {
    const { theme } = useTheme();
    return (
        <div className={`p-5 ${theme.card}`}>
            <div className="mb-3 flex items-center justify-between text-muted">
                <span className="text-sm">{label}</span>
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}