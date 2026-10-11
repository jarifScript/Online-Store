import { useEffect, useState } from "react";
import { getChatSummaries, type ChatSummary } from "./api";

export function useChatSummaries(tokens: string[]) {
    const tokenKey = tokens.join(",");
    const [summaries, setSummaries] = useState<ChatSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const currentTokens = tokenKey ? tokenKey.split(",") : [];

        const load = async () => {
            try {
                const data = await getChatSummaries(currentTokens);
                if (!active) return;
                setSummaries(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Could not load messages");
            }
        };

        load();
        if (currentTokens.length === 0) {
            setSummaries([]);
            setError(null);
            return () => {
                active = false;
            };
        }

        const timer = window.setInterval(load, 15000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [tokenKey]);

    return { summaries, error };
}
