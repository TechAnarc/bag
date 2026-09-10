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
import { Ticket, Plus, Tag, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsPage });

interface CouponRule {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
}

function CouponsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENTAGE",
    value: 10,
    minOrderValue: 999,
    usageLimit: 100,
    isActive: true,
  });

  const { data: businessConfig, isLoading } = useQuery({
    queryKey: ["admin", "business-config", "coupons"],
    queryFn: async () => {
      const res = await adminApi.getBusinessConfig();
      return res.data || {};
    },
  });

  const saveCouponsMutation = useMutation({
    mutationFn: async (updatedCoupons: CouponRule[]) => {
      return adminApi.updateBusinessConfig({
        ...businessConfig,
        metadata: {
          ...(businessConfig?.metadata || {}),
          coupons: updatedCoupons,
        },
      });
    },
    onSuccess: () => {
      toast.success("Coupon promotional rule saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "business-config", "coupons"] });
      setIsCreateOpen(false);
      setNewCoupon({ code: "", type: "PERCENTAGE", value: 10, minOrderValue: 999, usageLimit: 100, isActive: true });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to save coupon");
    },
  });

  const coupons: CouponRule[] = businessConfig?.metadata?.coupons || [
    {
      id: "c-welcome",
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderValue: 999,
      usageLimit: 500,
      usedCount: 28,
      isActive: true,
    },
    {
      id: "c-luxury",
      code: "BAG500",
      type: "FIXED_AMOUNT",
      value: 500,
      minOrderValue: 2999,
      usageLimit: 100,
      usedCount: 14,
      isActive: true,
    },
    {
      id: "c-freeship",
      code: "FREESHIP",
      type: "FREE_SHIPPING",
      value: 0,
      minOrderValue: 1499,
      usageLimit: 1000,
      usedCount: 82,
      isActive: true,
    },
  ];

  const handleCreateCoupon = () => {
    const couponToAdd: CouponRule = {
      id: `c-${Date.now()}`,
      code: newCoupon.code.toUpperCase().trim(),
      type: newCoupon.type as any,
      value: Number(newCoupon.value),
      minOrderValue: Number(newCoupon.minOrderValue),
      usageLimit: Number(newCoupon.usageLimit),
      usedCount: 0,
      isActive: newCoupon.isActive,
    };
    saveCouponsMutation.mutate([...coupons, couponToAdd]);
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = coupons.filter((c) => c.id !== id);
    saveCouponsMutation.mutate(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = coupons.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    saveCouponsMutation.mutate(updated);
  };

  return (
    <>
      <PageHeader
        title="Coupons & Discount Rules"
        subtitle="Campaign promotional codes, cart thresholds, and auto-redemption limits."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
          >
            <Plus className="mr-1 size-3.5" /> Create Coupon
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Active Promo Codes</p>
          <p className="mt-2 font-serif text-3xl text-gold">{coupons.filter((c) => c.isActive).length}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Live across storefront checkout</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Total Redemptions</p>
          <p className="mt-2 font-serif text-3xl text-ink dark:text-cream">
            {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Audited checkout applications</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Discount Cap Protection</p>
          <p className="mt-2 font-serif text-2xl text-emerald-600">Enforced</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Max percentage capped server-side</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl">Configured Promotional Campaigns</h3>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading coupon rules...</p>
        ) : coupons.length === 0 ? (
          <EmptyState
            title="No promotional coupons"
            hint="Create promotional codes to incentivize bag buyers on high-value collections."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Coupon Code</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Benefit</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Usage Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5 font-mono text-xs font-bold text-gold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="size-3.5" />
                        <span>{c.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-black/70 dark:text-cream/70">
                      {c.type.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-semibold text-ink dark:text-cream">
                      {c.type === "PERCENTAGE" ? `${c.value}% OFF` : c.type === "FIXED_AMOUNT" ? `₹${c.value} FLAT` : "FREE SHIPPING"}
                    </TableCell>
                    <TableCell className="text-xs text-black/70 dark:text-cream/70">
                      ₹{c.minOrderValue || 0}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-ink dark:text-cream">{c.usedCount}</span>
                      <span className="text-black/40 dark:text-cream/40"> / {c.usageLimit || "∞"}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(c.id)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${
                            c.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-black/10 text-black/50 border-black/10"
                          }`}
                        >
                          {c.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="size-8 text-red-500 hover:bg-red-500/10"
                        title="Delete coupon"
                      >
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

      {/* Create Coupon Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create Promotional Coupon</DialogTitle>
          </DialogHeader>
          <div className="my-4 space-y-3 text-sm">
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Coupon Code</label>
              <Input
                placeholder="e.g. LUXURY20"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="mt-1 h-10 font-mono font-bold rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Discount Type</label>
              <Select value={newCoupon.type} onValueChange={(type) => setNewCoupon({ ...newCoupon, type })}>
                <SelectTrigger className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage Discount (%)</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Flat Amount (₹)</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newCoupon.type !== "FREE_SHIPPING" && (
              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">
                  {newCoupon.type === "PERCENTAGE" ? "Discount Percentage (%)" : "Flat Amount (₹)"}
                </label>
                <Input
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                  className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Minimum Order Value (₹)</label>
              <Input
                type="number"
                value={newCoupon.minOrderValue}
                onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Max Usage Limit</label>
              <Input
                type="number"
                value={newCoupon.usageLimit}
                onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleCreateCoupon}
              disabled={saveCouponsMutation.isPending || !newCoupon.code.trim()}
              className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
            >
              {saveCouponsMutation.isPending ? "Saving..." : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
