import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Search, Eye, Filter, RefreshCw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });

const rupee = (n: number) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PROCESSING: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DELIVERED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  REFUNDED: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "orders", statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getOrders({
        page: 1,
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() ? search.trim() : undefined,
      });
      return res.data?.orders || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !newStatus) return;
      return adminApi.updateOrderStatus(selectedOrder.id, newStatus, statusNotes);
    },
    onSuccess: () => {
      toast.success("Order status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setSelectedOrder(null);
      setNewStatus("");
      setStatusNotes("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update status");
    },
  });

  const orders = data || [];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Live fulfillment lifecycle, customer payment state, and status management."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-full border-black/10 dark:border-white/10"
          >
            <RefreshCw className="mr-1.5 size-3.5" /> Refresh
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-cream/40" />
          <Input
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-full border-black/10 bg-white/60 pl-10 text-sm focus:border-gold dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-full border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading orders...</p>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            hint="Orders created by customers will appear in this control center in real-time."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5 font-mono text-xs font-semibold text-ink dark:text-cream">
                      {order.orderNumber || order.id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-ink dark:text-cream">{order.customerName || order.user?.name || "Guest Customer"}</span>
                        <span className="text-[11px] text-black/50 dark:text-cream/50">{order.customerEmail || order.user?.email || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-black/70 dark:text-cream/70">
                        {order.paymentStatus || "PENDING"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-black/50 dark:text-cream/50">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-ink dark:text-cream">
                      {rupee(order.totalAmount || order.total || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status);
                        }}
                        className="h-8 rounded-full px-3 text-xs text-gold hover:text-gold/80"
                      >
                        <Eye className="mr-1 size-3.5" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Order Details & Status Transition Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                Order #{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-cream/50">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName || selectedOrder.user?.name || "Guest"}</p>
                  <p className="text-xs text-black/60 dark:text-cream/60">{selectedOrder.customerEmail || selectedOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-cream/50">Total Amount</p>
                  <p className="text-lg font-serif text-gold">{rupee(selectedOrder.totalAmount || selectedOrder.total || 0)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Change Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                    <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                    <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                    <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Admin Notes / Audit Reason</label>
                <Input
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Dispatched via BlueDart AWB# 12345"
                  className="mt-1.5 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)} className="rounded-full">
                Close
              </Button>
              <Button
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
                className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
              >
                {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
