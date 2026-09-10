import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsPage });

function ReviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const res = await adminApi.getReviews({ page: 1, limit: 100 });
      return res.data?.reviews || res.data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      return adminApi.updateReviewStatus(id, status);
    },
    onSuccess: () => {
      toast.success("Review status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteReview(id);
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to delete review");
    },
  });

  const reviews: any[] = data || [];

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Moderate, approve, and manage customer product feedback."
      />

      <Card>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            hint="Customer reviews submitted for bags will appear here for moderation."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Product / Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Moderation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r: any) => (
                  <TableRow key={r.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink dark:text-cream">{r.product?.name || "Product"}</span>
                        <span className="text-[11px] text-black/50 dark:text-cream/50">By {r.userName || r.user?.name || "Customer"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5 text-gold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${i < (r.rating || 5) ? "fill-gold text-gold" : "text-black/20 dark:text-white/20"}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-xs text-black/80 dark:text-cream/80">{r.title && <strong>{r.title} — </strong>}{r.comment || r.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${
                          r.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : r.status === "REJECTED"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {r.status || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-black/50 dark:text-cream/50">
                      {new Date(r.createdAt || Date.now()).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== "APPROVED" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: "APPROVED" })}
                            className="size-8 text-emerald-600 hover:bg-emerald-500/10"
                            title="Approve"
                          >
                            <Check className="size-4" />
                          </Button>
                        )}
                        {r.status !== "REJECTED" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: "REJECTED" })}
                            className="size-8 text-amber-600 hover:bg-amber-500/10"
                            title="Reject"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this review permanently?")) deleteMutation.mutate(r.id);
                          }}
                          className="size-8 text-red-500 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
