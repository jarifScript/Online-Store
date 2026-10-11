import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, LogOut, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import { authPost } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { TextField } from "../components/admin/Field";

interface Form {
    full_name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

const empty: Form = {
    full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "",
};

export default function Account() {
    const { theme } = useTheme();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const userId = user?.id;

    const [form, setForm] = useState<Form>(empty);
    const [exists, setExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [portalBusy, setPortalBusy] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        if (!userId) return;
        supabase
            .from("profiles")
            .select("full_name, phone, address")
            .eq("id", userId)
            .limit(1)
            .then(({ data, error }) => {
                if (error) setMsg({ text: error.message, ok: false });
                else if (data && data.length > 0) {
                    const p = data[0];
                    const a = (p.address ?? {}) as Record<string, string>;
                    setExists(true);
                    setForm({
                        full_name: p.full_name ?? "",
                        phone: p.phone ?? "",
                        line1: a.line1 ?? "",
                        line2: a.line2 ?? "",
                        city: a.city ?? "",
                        state: a.state ?? "",
                        postal_code: a.postal_code ?? "",
                        country: a.country ?? "",
                    });
                }
                setLoading(false);
            });
    }, [userId]);

    const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const country = form.country.trim().toUpperCase();
        if (country && !/^[A-Z]{2}$/.test(country)) {
            setMsg({ text: "Country must be a 2-letter code, like US, GB or BD", ok: false });
            return;
        }

        const row = {
            full_name: form.full_name.trim() || null,
            phone: form.phone.trim() || null,
            address: {
                line1: form.line1.trim(),
                line2: form.line2.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                postal_code: form.postal_code.trim(),
                country,
            },
        };

        setSaving(true);
        setMsg(null);
        const { error } = exists
            ? await supabase.from("profiles").update(row).eq("id", user.id)
            : await supabase.from("profiles").insert({ id: user.id, email: user.email, ...row });
        setSaving(false);

        if (error) setMsg({ text: error.message, ok: false });
        else {
            setExists(true);
            setMsg({ text: "Saved. Your address will be prefilled at checkout.", ok: true });
        }
    };

    const openPortal = async () => {
        setPortalBusy(true);
        setMsg(null);
        try {
            const { url } = await authPost<{ url: string }>("/api/account/billing-portal");
            window.location.href = url;
        } catch (e) {
            setMsg({ text: e instanceof Error ? e.message : "Could not open Stripe", ok: false });
            setPortalBusy(false);
        }
    };

    if (loading) return <section className="p-10 text-center text-muted">Loading...</section>;

    return (
        <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className={theme.heading}>My account</h1>
                <Link to="/account/orders" className={`${theme.button} inline-flex items-center gap-2`}>
                    <Package size={18} /> My orders
                </Link>
            </div>
            <p className="break-all text-sm text-muted">{user?.email}</p>

            <form onSubmit={save} className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Details and shipping address</h2>
                <TextField label="Full name" value={form.full_name} onChange={set("full_name")} />
                <TextField label="Phone" value={form.phone} onChange={set("phone")} />
                <TextField label="Address line 1" value={form.line1} onChange={set("line1")} />
                <TextField label="Address line 2 (optional)" value={form.line2} onChange={set("line2")} />
                <div className="grid gap-x-4 sm:grid-cols-2">
                    <TextField label="City" value={form.city} onChange={set("city")} />
                    <TextField label="State / region" value={form.state} onChange={set("state")} />
                    <TextField label="Postal code" value={form.postal_code} onChange={set("postal_code")} />
                    <TextField label="Country code (e.g. US, BD)" value={form.country} onChange={set("country")} />
                </div>
                <button type="submit" disabled={saving} className={`${theme.button} disabled:opacity-60`}>
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-2 flex items-center gap-2 font-bold">
                    <CreditCard size={20} /> Payment methods
                </h2>
                <p className="mb-4 text-sm text-muted">
                    Card details are never stored on this store. Stripe keeps them securely. Tick “save my
                    payment details” at checkout to reuse your card next time, and manage saved cards below.
                </p>
                <button
                    type="button"
                    onClick={openPortal}
                    disabled={portalBusy}
                    className={`${theme.button} disabled:opacity-60`}
                >
                    {portalBusy ? "Opening..." : "Manage saved cards"}
                </button>
            </div>

            {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-red-600"}`}>{msg.text}</p>}

            <button
                type="button"
                onClick={async () => {
                    await signOut();
                    navigate("/");
                }}
                className="flex items-center gap-2 text-sm text-muted underline"
            >
                <LogOut size={16} /> Log out
            </button>
        </section>
    );
}