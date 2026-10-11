import ThemeEditor from "../../components/admin/ThemeEditor";
import ContentEditor from "../../components/admin/ContentEditor";
import StorePreview from "../../components/admin/StorePreview";
import StoreDesignPicker from "../../components/admin/StoreDesignPicker";
import StoreTemplatePicker from "../../components/admin/StoreTemplatePicker";

export default function Customize() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Customize</h1>
                <p className="text-sm text-muted">
                    Changes show in the preview instantly. Click “Save changes” at the bottom to publish
                    them to your store.
                </p>
            </div>

            <StoreDesignPicker />
            <StoreTemplatePicker />

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-6">
                    <ThemeEditor />
                    <ContentEditor />
                </div>
                <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                    <p className="mb-2 text-sm font-semibold">Live preview</p>
                    <StorePreview />
                </div>
            </div>
        </div>
    );
}