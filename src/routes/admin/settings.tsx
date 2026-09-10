import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Store, ShieldCheck, Mail, Building, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    businessName: "Bombay Bag House",
    email: "admin@trivenibombaybaghouse.com",
    phone: "+91 98765 43210",
    gstin: "24AAAAA0000A1Z5",
    stateCode: "24",
    authorizedSignatory: "Piyush Soni",
    invoicePrefix: "BBH-INV",
    returnPolicyDays: 7,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "business-config"],
    queryFn: async () => {
      const res = await adminApi.getBusinessConfig();
      return res.data || {};
    },
  });

  useEffect(() => {
    if (config && config.businessName) {
      setFormData({
        businessName: config.businessName || "Bombay Bag House",
        email: config.email || "admin@trivenibombaybaghouse.com",
        phone: config.phone || "+91 98765 43210",
        gstin: config.gstin || "24AAAAA0000A1Z5",
        stateCode: config.stateCode || "24",
        authorizedSignatory: config.authorizedSignatory || "Piyush Soni",
        invoicePrefix: config.invoicePrefix || "BBH-INV",
        returnPolicyDays: config.returnPolicyDays || 7,
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminApi.updateBusinessConfig({
        ...config,
        ...data,
        registeredAddress: config?.registeredAddress || {
          line1: "123 Commercial Street",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380001",
          country: "India",
        },
      });
    },
    onSuccess: () => {
      toast.success("Business configuration updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "business-config"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update configuration");
    },
  });

  return (
    <>
      <PageHeader
        title="Settings & Store Identity"
        subtitle="Manage brand profile, GST compliance, invoice sequence, and customer policies."
        actions={
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
          >
            <Save className="mr-1.5 size-3.5" /> {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Store className="size-5 text-gold" />
            <h3 className="font-serif text-xl">Store Identity</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Brand Name</label>
              <Input
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Support Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Support Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="size-5 text-gold" />
            <h3 className="font-serif text-xl">Compliance & Invoicing</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">GSTIN</label>
              <Input
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="mt-1 h-10 font-mono text-xs rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Invoice Prefix</label>
              <Input
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                className="mt-1 h-10 font-mono text-xs rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Authorized Signatory</label>
              <Input
                value={formData.authorizedSignatory}
                onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Return Window (Days)</label>
              <Input
                type="number"
                value={formData.returnPolicyDays}
                onChange={(e) => setFormData({ ...formData, returnPolicyDays: Number(e.target.value) })}
                className="mt-1 h-10 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40"
              />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
