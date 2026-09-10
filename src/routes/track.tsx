import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Package, Truck, Clock, AlertCircle, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { toast } from "sonner";
import api from "@/lib/axios";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "Track Order — Bombay Bag House" }] }),
  component: TrackPage,
});

function TrackPage() {
  const [id, setId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = id.trim().toUpperCase();
    if (!query) {
      toast.error("Please enter a valid order number");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(query)}`);
      if (res.data?.data) {
        setOrder(res.data.data);
      } else {
        setOrder(null);
      }
    } catch (err: any) {
      setOrder(null);
      toast.error("Order not found", { description: "Please check your order number e.g. BBH..." });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700">Delivered</span>;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold-dark">In transit</span>;
      case "CANCELLED":
        return <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive">Cancelled</span>;
      default:
        return <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{status || "Processing"}</span>;
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Order tracking</p>
        <h1 className="mt-3 font-serif text-5xl">Where's my order?</h1>

        <form onSubmit={handleTrack} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Order ID e.g. BBH..."
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-widest text-cream disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Track"}
          </button>
        </form>

        {order ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Order Number</p>
                <p className="font-medium text-base">#{order.orderNumber}</p>
                {order.trackingNumber && (
                  <p className="text-xs text-gold mt-0.5">Tracking AWB: {order.trackingNumber}</p>
                )}
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Destination summary */}
            {order.shippingAddress?.city && (
              <p className="mt-4 text-xs text-muted-foreground">
                Destination: {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
            )}

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items in shipment</p>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="font-serif">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-8 space-y-6 border-t border-border pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Milestone Progress</p>
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="grid size-10 place-items-center rounded-full bg-gold text-ink shrink-0">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">{event.title || event.status}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(event.timestamp || event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex gap-4">
                  <div className="grid size-10 place-items-center rounded-full bg-gold text-ink">
                    <Check className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">Order has been verified and sent to fulfillment center.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : hasSearched && !isLoading ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center">
            <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-medium">No order found matching "{id}"</p>
            <p className="text-xs text-muted-foreground mt-1">Please ensure the order number starts with BBH and matches your invoice.</p>
          </div>
        ) : null}
      </div>
    </SiteLayout>
  );
}
