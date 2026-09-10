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
import { Truck, Plus, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shipping")({ component: ShippingPage });

function ShippingPage() {
  const queryClient = useQueryClient();
  const [isNewPartnerOpen, setIsNewPartnerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "SURFACE",
    apiUrl: "",
    contactEmail: "",
  });

  const { data: partnersData, isLoading, refetch } = useQuery({
    queryKey: ["admin", "logistics-partners"],
    queryFn: async () => {
      const res = await adminApi.getLogisticsPartners();
      return res.data || [];
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminApi.createLogisticsPartner({
        ...data,
        capabilities: { express: true, surface: true, tracking: true },
      });
    },
    onSuccess: () => {
      toast.success("Logistics carrier added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "logistics-partners"] });
      setIsNewPartnerOpen(false);
      setFormData({ name: "", code: "", type: "SURFACE", apiUrl: "", contactEmail: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create partner");
    },
  });

  const partners: any[] = partnersData || [];

  return (
    <>
      <PageHeader
        title="Shipping & Logistics"
        subtitle="Carrier partner routing, SLA monitoring, and fulfillment network configuration."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-full border-black/10 dark:border-white/10"
            >
              <RefreshCw className="mr-1.5 size-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewPartnerOpen(true)}
              className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
            >
              <Plus className="mr-1 size-3.5" /> Add Carrier
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Active Partners</p>
          <p className="mt-2 font-serif text-3xl text-gold">{partners.length}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">National & Regional Couriers</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Default Carrier</p>
          <p className="mt-2 font-serif text-2xl text-ink dark:text-cream">Delhivery Express</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Primary surface & air logistics</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Packaging Standard</p>
          <p className="mt-2 font-serif text-2xl text-emerald-600">Luxury Bag Box</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Reinforced protective carton</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl">Integrated Delivery Partners</h3>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading logistics network...</p>
        ) : partners.length === 0 ? (
          <EmptyState
            title="No custom carriers connected"
            hint="Integrate BlueDart, Delhivery, or Shiprocket to auto-dispatch orders directly from your admin panel."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Carrier Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reliability Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p: any) => (
                  <TableRow key={p.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5 font-medium text-ink dark:text-cream">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-gold" />
                        <span>{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-black/70 dark:text-cream/70">
                      {p.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600">
                      {(p.reliabilityScore * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-black/50 dark:text-cream/50">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Add Partner Dialog */}
      <Dialog open={isNewPartnerOpen} onOpenChange={setIsNewPartnerOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Connect Carrier Partner</DialogTitle>
          </DialogHeader>
          <div className="my-4 space-y-3 text-sm">
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Carrier Name</label>
              <Input
                placeholder="e.g. Delhivery Surface"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Carrier Code</label>
              <Input
                placeholder="e.g. DELHIVERY_SURFACE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1 h-10 font-mono text-xs rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Fulfillment Type</label>
              <Select value={formData.type} onValueChange={(type) => setFormData({ ...formData, type })}>
                <SelectTrigger className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURFACE">Standard Surface (Bags)</SelectItem>
                  <SelectItem value="AIR_EXPRESS">Air Express Priority</SelectItem>
                  <SelectItem value="HYPERLOCAL">Same-Day Local Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Webhook / Tracking Endpoint</label>
              <Input
                placeholder="https://api.carrier.com/v1/track"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNewPartnerOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => createPartnerMutation.mutate(formData)}
              disabled={createPartnerMutation.isPending || !formData.name || !formData.code}
              className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
            >
              {createPartnerMutation.isPending ? "Connecting..." : "Add Carrier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
