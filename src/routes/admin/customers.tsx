import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/customers")({ component: CustomersPage });

function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const res = await adminApi.getUsers({
        page: 1,
        limit: 100,
        search: search.trim() ? search.trim() : undefined,
      });
      return res.data?.users || res.data || [];
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) => {
      if (isBlocked) {
        return adminApi.unblockUser(id);
      } else {
        return adminApi.blockUser(id, "Administrative review / risk mitigation");
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isBlocked ? "User unblocked successfully" : "User blocked successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update user state");
    },
  });

  const users: any[] = data || [];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles, access permissions, and account statuses."
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-cream/40" />
          <Input
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-full border-black/10 bg-white/60 pl-10 text-sm focus:border-gold dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading customer roster...</p>
        ) : users.length === 0 ? (
          <EmptyState
            title="No customers found"
            hint="Customers who register or purchase will appear here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Access Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => {
                  const isBlocked = user.isBlocked || user.status === "BLOCKED";
                  return (
                    <TableRow key={user.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 place-items-center rounded-full bg-gold/10 text-gold font-serif text-xs">
                            {(user.name || user.email || "U")[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-ink dark:text-cream">{user.name || "Unnamed"}</span>
                            <span className="text-[11px] text-black/50 dark:text-cream/50">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-black/70 dark:text-cream/70">
                        {user.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${
                            isBlocked
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          }`}
                        >
                          {isBlocked ? "BLOCKED" : "ACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-black/50 dark:text-cream/50">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={blockMutation.isPending}
                          onClick={() => blockMutation.mutate({ id: user.id, isBlocked })}
                          className={`h-8 rounded-full px-3 text-xs ${
                            isBlocked ? "text-emerald-600 hover:text-emerald-700" : "text-red-500 hover:text-red-600"
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <ShieldCheck className="mr-1 size-3.5" /> Unblock
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="mr-1 size-3.5" /> Block
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
