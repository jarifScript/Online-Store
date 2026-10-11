import { supabase } from "./supabase";
import type { OrderRow } from "../types";

export async function withCurrentProfileNames(orders: OrderRow[]): Promise<OrderRow[]> {
    const userIds = [...new Set(orders.map((order) => order.user_id).filter(
        (id): id is string => Boolean(id),
    ))];
    if (userIds.length === 0) return orders;

    const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds);
    if (error) throw new Error(error.message);

    const names = (data ?? []).reduce<Record<string, string>>((result, profile) => {
        const name = profile.full_name?.trim();
        if (name) result[profile.id] = name;
        return result;
    }, {});

    return orders.map((order) => ({
        ...order,
        shipping_name: (order.user_id && names[order.user_id]) || order.shipping_name,
    }));
}
