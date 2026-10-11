import type { OrderRow } from "../../types";

export default function AddressBlock({ order }: { order: OrderRow }) {
    const a = order.shipping_address;
    const lines = a
        ? [
            a.line1,
            a.line2,
            [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
            a.country,
        ].filter(Boolean)
        : [];

    if (!order.shipping_name && !order.shipping_phone && lines.length === 0) {
        return <p className="text-sm text-muted">No shipping details for this order.</p>;
    }

    return (
        <div className="min-w-0 break-words text-sm [overflow-wrap:anywhere]">
            {order.shipping_name && <p className="font-semibold">{order.shipping_name}</p>}
            {lines.map((line, i) => (
                <p key={i}>{line}</p>
            ))}
            {order.shipping_phone && <p className="mt-1 text-muted">Phone: {order.shipping_phone}</p>}
        </div>
    );
}