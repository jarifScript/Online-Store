import { supabase } from "./supabase";
import type { ChatMessage } from "../types";

const API_URL = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
    : "";

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function readError(res: Response): Promise<ApiError> {
    const err = await res.json().catch(() => ({}));
    const message = typeof err.detail === "string" ? err.detail : `Request failed (${res.status})`;
    return new ApiError(message, res.status);
}

async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CheckoutItem {
    product_id: string;
    quantity: number;
    variant?: string | null;
}

// Works for guests and logged-in buyers (the token is sent if there is one)
export async function startCheckout(items: CheckoutItem[], signal?: AbortSignal) {
    const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ items }),
        signal,
    });
    if (!res.ok) throw await readError(res);
    const data: unknown = await res.json();
    if (
        typeof data !== "object"
        || data === null
        || !("url" in data)
        || typeof data.url !== "string"
    ) {
        throw new ApiError("Checkout did not return a payment link. Please try again.", res.status);
    }
    let checkoutUrl: URL;
    try {
        checkoutUrl = new URL(data.url);
    } catch {
        throw new ApiError("Checkout returned an invalid payment link. Please try again.", res.status);
    }
    if (checkoutUrl.protocol !== "https:" && checkoutUrl.protocol !== "http:") {
        throw new ApiError("Checkout returned an invalid payment link. Please try again.", res.status);
    }
    window.location.assign(checkoutUrl.href);
}

// Asks the backend to double-check a payment with Stripe
export async function confirmOrder(sessionId: string): Promise<{ status: string }> {
    const res = await fetch(`${API_URL}/api/orders/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
    });
    if (!res.ok) throw await readError(res);
    return res.json();
}

// Calls a protected admin endpoint, sending the login token
export async function adminGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { headers: await authHeaders() });
    if (res.status === 401) {
        await supabase.auth.signOut(); // dead login: clear it so the app goes to the login page
    }
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<T>;
}

// Logged-in user actions
export async function authPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<T>;
}

// ---------- Buyer chat ----------
export interface ChatData {
    order: {
        created_at: string;
        total_cents: number;
        items: { name: string; quantity: number; variant: string | null }[];
    };
    messages: ChatMessage[];
}

export interface ChatSummary {
    token: string;
    created_at: string;
    total_cents: number;
    items: { name: string; quantity: number; variant: string | null }[];
    unread: number;
    last_message: string | null;
    last_message_at: string | null;
}

export async function getChatSummaries(tokens: string[]): Promise<ChatSummary[]> {
    if (tokens.length === 0) return [];
    const params = new URLSearchParams();
    tokens.slice(0, 30).forEach((token) => params.append("tokens", token));
    const res = await fetch(`${API_URL}/api/chat/summaries/?${params.toString()}`, {
        headers: await authHeaders(),
    });
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<ChatSummary[]>;
}

export async function getChat(token: string): Promise<ChatData> {
    const res = await fetch(`${API_URL}/api/chat/${encodeURIComponent(token)}`, {
        headers: await authHeaders(),
    });
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<ChatData>;
}

export async function sendChat(token: string, body: string): Promise<ChatMessage> {
    const res = await fetch(`${API_URL}/api/chat/${encodeURIComponent(token)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ body }),
    });
    if (!res.ok) throw await readError(res);
    return res.json() as Promise<ChatMessage>;
}