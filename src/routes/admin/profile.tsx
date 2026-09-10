import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader } from "@/components/admin-shell";
import { Shield, User, Mail, Calendar, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/profile")({ component: ProfilePage });

function ProfilePage() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: async () => {
      const res = await adminApi.getProfile();
      return res.data || {};
    },
  });

  const admin = profileData || {};

  return (
    <>
      <PageHeader
        title="Admin Profile & Security"
        subtitle="Security clearances, administrative credentials, and session telemetry."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User className="size-5 text-gold" />
            <h3 className="font-serif text-xl">Identity Information</h3>
          </div>
          {isLoading ? (
            <p className="py-6 text-sm text-black/40 dark:text-cream/40">Loading profile data...</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-black/50 dark:text-cream/50">Primary Email:</span>
                <span className="font-medium text-ink dark:text-cream">{admin.email || "admin@trivenibombaybaghouse.com"}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-black/50 dark:text-cream/50">Role Clearance:</span>
                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30 text-[10px]">
                  {admin.role || "SUPER_ADMIN"}
                </Badge>
              </div>
              <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-black/50 dark:text-cream/50">Account Status:</span>
                <span className="font-medium text-emerald-600">ACTIVE</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-black/50 dark:text-cream/50">Session Authenticator:</span>
                <span className="font-mono text-xs text-black/70 dark:text-cream/70">JWT (Dual-Tap Vault)</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="size-5 text-gold" />
            <h3 className="font-serif text-xl">Security Posture</h3>
          </div>
          <div className="space-y-3 text-sm text-black/70 dark:text-cream/70">
            <p>
              Your administrative credentials authenticate against the dedicated Express/Prisma commerce engine with signed JSON Web Tokens.
            </p>
            <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02] text-xs">
              <p className="font-mono text-gold mb-1">AUDIT_COMPLIANCE: ACTIVE</p>
              <p className="text-black/60 dark:text-cream/60">
                All administrative actions (product creates, stock adjustments, customer blocks, order status changes) are persistently stored in the audit log.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
