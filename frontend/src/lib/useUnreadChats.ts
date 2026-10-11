import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUnreadChats() {
    const [count, setCount] = useState(0);

    const load = useCallback(async () => {
        const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("sender", "buyer")
            .eq("read_by_admin", false);
        setCount(count ?? 0);
    }, []);

    useEffect(() => {
        load();
        const channel = supabase
            .channel("unread-messages")
            .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
            .subscribe();
        const timer = window.setInterval(load, 30000);
        return () => {
            window.clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [load]);

    return count;
}