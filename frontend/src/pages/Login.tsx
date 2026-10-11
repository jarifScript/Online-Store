import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";

export default function Login() {
    const { theme } = useTheme();
    const { session, isAdmin, loading, signIn, signUp, sendPasswordReset, updatePassword, signOut } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isReset = searchParams.get("reset") === "1";
    const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isReset) setMode("login");
    }, [isReset]);

    if (!loading && session && !isReset) {
        const from = (location.state as { from?: string } | null)?.from;
        return <Navigate to={isAdmin ? "/admin" : from ?? "/"} replace />;
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setInfo(null);

        if (isReset) {
            const message = await updatePassword(password);
            if (message) setError(message);
            else {
                await signOut();
                setPassword("");
                setSearchParams({}, { replace: true });
                setInfo("Password updated. You can now log in with your new password.");
            }
        } else if (mode === "forgot") {
            const message = await sendPasswordReset(email);
            if (message) setError(message);
            else setInfo("If an account exists for that email, a password reset link has been sent.");
        } else if (mode === "login") {
            const message = await signIn(email, password);
            if (message) setError(message);
        } else {
            const result = await signUp(email, password, fullName.trim());
            if (result.error) setError(result.error);
            else if (result.needsConfirm) {
                setInfo("Account created! Check your email and click the confirmation link, then log in.");
                setMode("login");
            }
        }
        setBusy(false);
    };

    const tab = (m: "login" | "signup", label: string) => (
        <button
            type="button"
            onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
                if (isReset) setSearchParams({}, { replace: true });
            }}
            className={`flex-1 border border-border py-2 text-sm font-semibold ${theme.chip} ${mode === m ? "bg-primary text-primary-text" : "bg-background"
                }`}
        >
            {label}
        </button>
    );

    return (
        <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
            <div className={`p-6 sm:p-8 ${theme.card}`}>
                <h1 className={`${theme.heading} mb-6 text-center`}>
                    {isReset
                        ? "Choose a new password"
                        : mode === "forgot"
                            ? "Reset your password"
                            : mode === "login" ? "Welcome back" : "Create your account"}
                </h1>

                {!isReset && mode !== "forgot" && (
                    <div className="mb-5 flex gap-2">
                        {tab("login", "Log in")}
                        {tab("signup", "Sign up")}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    {!isReset && mode === "signup" && (
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full name"
                            autoComplete="name"
                            className={`${theme.input} w-full`}
                        />
                    )}
                    {!isReset && (
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        className={`${theme.input} w-full`}
                    />
                    )}
                    {(mode !== "forgot") && (
                    <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isReset ? "New password (at least 6 characters)" : "Password (at least 6 characters)"}
                        autoComplete={mode === "login" && !isReset ? "current-password" : "new-password"}
                        className={`${theme.input} w-full`}
                    />
                    )}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {info && <p className="text-sm text-primary">{info}</p>}
                    <button type="submit" disabled={busy} className={`${theme.button} w-full disabled:opacity-60`}>
                        {busy
                            ? "Please wait..."
                            : isReset ? "Update password"
                                : mode === "forgot" ? "Send reset link"
                                    : mode === "login" ? "Log in" : "Create account"}
                    </button>
                </form>

                {!isReset && mode === "login" && (
                    <button
                        type="button"
                        onClick={() => {
                            setMode("forgot");
                            setError(null);
                            setInfo(null);
                        }}
                        className="mt-4 block w-full text-center text-sm text-primary underline"
                    >
                        Forgot password?
                    </button>
                )}
                {!isReset && mode === "forgot" && (
                    <button
                        type="button"
                        onClick={() => {
                            setMode("login");
                            setError(null);
                            setInfo(null);
                        }}
                        className="mt-4 block w-full text-center text-sm text-primary underline"
                    >
                        Back to log in
                    </button>
                )}
                {!isReset && mode !== "forgot" && (
                    <p className="mt-5 text-center text-xs text-muted">
                        You don't need an account to buy. Sign up to save your address and see your orders.
                    </p>
                )}
            </div>
        </section>
    );
}