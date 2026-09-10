import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Undo2, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/returns")({ component: ReturnsPage });

const rupee = (n: number) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");

function ReturnsPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundNote, setRefundNote] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "returns"],
    queryFn: async () => {
      // Pull orders in return/refund lifecycle stages
      const res = await adminApi.getOrders({ page: 1, limit: 100, status: "all" });
      const allOrders = res.data?.orders || [];
      return allOrders.filter(
        (o: any) =>
          o.status === "REFUNDED" ||
          o.status === "CANCELLED" ||
          o.status === "RETURN_REQUESTED" ||
          o.status === "RETURNED"
      );
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return;
      if (selectedOrder.razorpayPaymentId) {
        return adminApi.processRefund(selectedOrder.razorpayPaymentId, {
          amount: refundAmount * 100, // paise
          notes: { reason: refundNote || "Approved customer return for bag item" },
        });
      } else {
        // Mark order directly as REFUNDED
        return adminApi.updateOrderStatus(selectedOrder.id, "REFUNDED", refundNote || "Manual refund recorded");
      }
    },
    onSuccess: () => {
      toast.success("Refund processed and ledger updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "returns"] });
      setSelectedOrder(null);
      setRefundAmount(0);
      setRefundNote("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to process refund");
    },
  });

  const returns: any[] = data || [];

  return (
    <>
      <PageHeader
        title="Returns & Refunds"
        subtitle="Reverse logistics, customer inspection, and ledger-backed refund processing."
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

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Return Policy</p>
          <p className="mt-2 font-serif text-2xl text-gold">7-Day Transit Policy</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Unused condition with original tags</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Inspection Protocol</p>
          <p className="mt-2 font-serif text-2xl text-ink dark:text-cream">Standard QC Check</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Hardware, stitching, and zip verify</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Reconciliation</p>
          <p className="mt-2 font-serif text-2xl text-emerald-600">Dual-Ledger Sync</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Prisma ledger & Razorpay verified</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl">Return Requests & Cancelled Orders</h3>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading returns pipeline...</p>
        ) : returns.length === 0 ? (
          <EmptyState
            title="No return requests pending"
            hint="Customer returns and refund lifecycle events will appear here with audit tracking."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Gateway</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r: any) => (
                  <TableRow key={r.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5 font-mono text-xs font-semibold text-ink dark:text-cream">
                      {r.orderNumber || r.id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-ink dark:text-cream">{r.customerName || r.user?.name || "Customer"}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gold">
                      {rupee(r.totalAmount || r.total || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-black/70 dark:text-cream/70">
                      {r.paymentMethod || "ONLINE"}
                    </TableCell>
                    <TableCell className="text-xs text-black/50 dark:text-cream/50">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(r);
                          setRefundAmount(r.totalAmount || r.total || 0);
                        }}
                        className="h-8 rounded-full px-3 text-xs text-gold hover:text-gold/80"
                      >
                        <Undo2 className="mr-1 size-3.5" /> Inspect / Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Process Refund Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                Refund Order #{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            <div className="my-4 space-y-3 text-sm">
              <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-cream/50">Original Payment</p>
                <p className="font-serif text-xl text-gold">{rupee(selectedOrder.totalAmount || selectedOrder.total || 0)}</p>
                <p className="text-xs text-black/60 dark:text-cream/60">Payment ID: {selectedOrder.razorpayPaymentId || "Manual / Cash"}</p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Refund Amount (₹)</label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Inspection Notes / Reason</label>
                <Input
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="e.g. Bag returned in original condition. Zip and stitches verified."
                  className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={() => processRefundMutation.mutate()}
                disabled={processRefundMutation.isPending || refundAmount <= 0}
                className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
              >
                {processRefundMutation.isPending ? "Processing..." : "Authorize Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
