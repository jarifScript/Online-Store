import { useEffect, useState } from "react";

const KEY_PREFIX = "store-chats-v2:";
const EVENT = "store-chats-changed";

const storageKey = (userId: string | null) => `${KEY_PREFIX}${userId ?? "guest"}`;

export interface SavedChat {
    token: string;
    savedAt: string;
}

export function getSavedChats(userId: string | null = null): SavedChat[] {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        return raw ? (JSON.parse(raw) as SavedChat[]) : [];
    } catch {
        return [];
    }
}

function write(list: SavedChat[], userId: string | null) {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, 30)));
    } catch {
        /* storage blocked: ignore */
    }
    window.dispatchEvent(new Event(EVENT));
}

export function addChat(token: string, userId: string | null = null) {
    const list = getSavedChats(userId);
    if (list.some((c) => c.token === token)) return;
    write([{ token, savedAt: new Date().toISOString() }, ...list], userId);
}

export function removeChat(token: string, userId: string | null = null) {
    write(getSavedChats(userId).filter((c) => c.token !== token), userId);
}

export function useSavedChats(userId: string | null = null) {
    const [chats, setChats] = useState<SavedChat[]>(() => getSavedChats(userId));
    useEffect(() => {
        const sync = () => setChats(getSavedChats(userId));
        window.addEventListener(EVENT, sync);
        return () => window.removeEventListener(EVENT, sync);
    }, [userId]);
    return chats;
}