import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { API_BASE_URL } from "@/lib/axios";

const API_BASE = API_BASE_URL;

/**
 * Wave 1 — Admin Route Guard
 * Auth authority: Triveni Express backend JWT (admin@trivenibombaybaghouse.com)
 * Token storage: localStorage "admin_access_token" (Dual-Tap pattern)
 * Visual shell: Bombay Bag House existing AdminShell (gold/ink/cream theme)
 */
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("admin_access_token")
      : null;

    if (!token) {
      throw redirect({ to: "/admin-signin" as any });
    }

    try {
      const res = await fetch(`${API_BASE}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        localStorage.removeItem("admin_access_token");
        throw redirect({ to: "/admin-signin" as any });
      }

      const data = await res.json();
      const admin = data?.data;

      if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
        localStorage.removeItem("admin_access_token");
        throw redirect({ to: "/admin-signin" as any });
      }

      return { adminId: admin.id, adminRole: admin.role, adminEmail: admin.email };
    } catch (e: any) {
      // Only redirect if it's not already a redirect
      if (e?.isRedirect) throw e;
      localStorage.removeItem("admin_access_token");
      throw redirect({ to: "/admin-signin" as any });
    }
  },
  component: Layout,
});

function Layout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
