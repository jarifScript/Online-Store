import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthValue {
    session: Session | null;
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    sendPasswordReset: (email: string) => Promise<string | null>;
    updatePassword: (password: string) => Promise<string | null>;
    signUp: (
        email: string,
        password: string,
        fullName: string
    ) => Promise<{ error: string | null; needsConfirm: boolean }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });
        const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
        return () => data.subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
    };

    const sendPasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login?reset=1`,
        });
        return error ? error.message : null;
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return error ? error.message : null;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) return { error: error.message, needsConfirm: false };
        if (data.user && data.user.identities?.length === 0) {
            return { error: "This email is already registered. Please log in.", needsConfirm: false };
        }
        return { error: null, needsConfirm: !data.session };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const user = session?.user ?? null;
    const isAdmin = user?.app_metadata?.role === "admin";

    return (
        <AuthContext.Provider value={{
            session, user, isAdmin, loading, signIn, signUp,
            sendPasswordReset, updatePassword, signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}