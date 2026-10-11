import { useTheme } from "../../theme/ThemeProvider";
import { TextField } from "../../components/admin/Field";
import ImageUploader from "../../components/admin/ImageUploader";
import type { SiteContent } from "../../types";

export default function Settings() {
    const { theme, site, setSite } = useTheme();
    const c = site.content;

    const setContent = (patch: Partial<SiteContent>) =>
        setSite({ ...site, content: { ...c, ...patch } });
    const setSocial = (patch: Partial<SiteContent["socials"]>) =>
        setContent({ socials: { ...c.socials, ...patch } });

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Store settings</h1>
                <p className="text-sm text-muted">Click “Save changes” at the bottom when you are done.</p>
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Brand</h2>
                <TextField label="Store name" value={site.storeName}
                    onChange={(v) => setSite({ ...site, storeName: v })} />
                <ImageUploader label="Logo (shown in the header instead of the name)" folder="logo"
                    value={site.logoUrl} onChange={(url) => setSite({ ...site, logoUrl: url })} />
            </div>

            <div className={`p-5 ${theme.card}`}>
                <h2 className="mb-4 font-bold">Footer</h2>
                <TextField label="Footer text" multiline value={c.footerText}
                    onChange={(v) => setContent({ footerText: v })} />
                <TextField label="Instagram link" placeholder="https://instagram.com/yourstore"
                    value={c.socials.instagram} onChange={(v) => setSocial({ instagram: v })} />
                <TextField label="Facebook link" placeholder="https://facebook.com/yourstore"
                    value={c.socials.facebook} onChange={(v) => setSocial({ facebook: v })} />
                <TextField label="TikTok link" placeholder="https://tiktok.com/@yourstore"
                    value={c.socials.tiktok} onChange={(v) => setSocial({ tiktok: v })} />
                <TextField label="YouTube link" placeholder="https://youtube.com/@yourstore"
                    value={c.socials.youtube} onChange={(v) => setSocial({ youtube: v })} />
            </div>
        </div>
    );
}