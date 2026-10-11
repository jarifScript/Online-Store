import { supabase } from "./supabase";

const MAX_MB = 3;

export async function uploadImage(file: File, folder: string): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
    if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Image must be under ${MAX_MB} MB`);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
        .from("store-assets")
        .upload(path, file, { cacheControl: "3600" });
    if (error) throw new Error(error.message);

    return supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
}