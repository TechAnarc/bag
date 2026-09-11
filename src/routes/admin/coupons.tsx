import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Ticket, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsPage });

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit?: number;
  isActive: boolean;
  expiresAt?: string;
  description?: string;
  createdAt: string;
}

const DEFAULT_FORM = { code: "", type: "PERCENTAGE", value: 10, minOrderValue: 999, usageLimit: 100, isActive: true, expiresAt: "", description: "" };

function CouponsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const res = await adminApi.listCoupons();
      return (res.data as Coupon[]) ?? [];
    },
  });

  const coupons: Coupon[] = data ?? [];

  const createMutation = useMutation({
    mutationFn: async () => adminApi.createCoupon({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrderValue: Number(form.minOrderValue),
      usageLimit: Number(form.usageLimit) || undefined,
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      description: form.description || undefined,
    }),
    onSuccess: () => {
      toast.success("Coupon created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setIsCreateOpen(false);
      setForm({ ...DEFAULT_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Failed to create coupon"),
  });

  const toggleMutation = useMutation({
    mutationFn: (couponId: string) => adminApi.toggleCouponStatus(couponId),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId: string) => adminApi.deleteCoupon(couponId),
    onSuccess: () => { toast.success("Coupon deleted"); queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete coupon"),
  });

  return (
    <>
      <PageHeader
        title="Coupons & Discount Rules"
        subtitle="Campaign promotional codes, cart thresholds, and auto-redemption limits."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90">
            <Plus className="mr-1 size-3.5" /> Create Coupon
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Active Promo Codes</p>
          <p className="mt-2 font-serif text-3xl text-gold">{coupons.filter(c => c.isActive).length}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Live across storefront checkout</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Total Redemptions</p>
          <p className="mt-2 font-serif text-3xl text-ink dark:text-cream">{coupons.reduce((s, c) => s + (c.usedCount || 0), 0)}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Audited checkout applications</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Discount Cap Protection</p>
          <p className="mt-2 font-serif text-2xl text-emerald-600">Enforced</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">All discounts calculated server-side</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl">Configured Promotional Campaigns</h3>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading coupon rules...</p>
        ) : coupons.length === 0 ? (
          <EmptyState title="No promotional coupons" hint="Create promotional codes to incentivize bag buyers on high-value collections." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Coupon Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Benefit</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(c => (
                  <TableRow key={c.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5 font-mono text-xs font-bold text-gold">
                      <div className="flex items-center gap-1.5"><Tag className="size-3.5" /><span>{c.code}</span></div>
                    </TableCell>
                    <TableCell className="text-xs text-black/70 dark:text-cream/70">{c.type.replace("_", " ")}</TableCell>
                    <TableCell className="font-semibold text-ink dark:text-cream">
                      {c.type === "PERCENTAGE" ? `${c.value}% OFF` : c.type === "FIXED_AMOUNT" ? `₹${c.value} FLAT` : "FREE SHIPPING"}
                    </TableCell>
                    <TableCell className="text-xs text-black/70 dark:text-cream/70">₹{c.minOrderValue || 0}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-ink dark:text-cream">{c.usedCount}</span>
                      <span className="text-black/40 dark:text-cream/40"> / {c.usageLimit ?? "∞"}</span>
                    </TableCell>
                    <TableCell className="text-xs text-black/60 dark:text-cream/60">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleMutation.mutate(c.id)} className="cursor-pointer" title="Click to toggle">
                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${c.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-black/10 text-black/50 border-black/10"}`}>
                          {c.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)} className="size-8 text-red-500 hover:bg-red-500/10" title="Delete coupon">
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create Promotional Coupon</DialogTitle>
          </DialogHeader>
          <div className="my-4 space-y-3 text-sm">
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Coupon Code</label>
              <Input placeholder="e.g. LUXURY20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 h-10 font-mono font-bold rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Discount Type</label>
              <Select value={form.type} onValueChange={type => setForm({ ...form, type })}>
                <SelectTrigger className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage Discount (%)</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Flat Amount (₹)</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type !== "FREE_SHIPPING" && (
              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">{form.type === "PERCENTAGE" ? "Discount Percentage (%)" : "Flat Amount (₹)"}</label>
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Minimum Order Value (₹)</label>
              <Input type="number" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Max Usage Limit (leave blank for unlimited)</label>
              <Input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Expiry Date (leave blank = never expires)</label>
              <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Description (optional)</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.code.trim()} className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90">
              {createMutation.isPending ? "Saving..." : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
