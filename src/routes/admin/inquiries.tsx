import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, Check, Reply, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inquiries")({ component: InquiriesPage });

function InquiriesPage() {
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      const res = await adminApi.getInquiries({ page: 1, limit: 100 });
      return res.data?.submissions || res.data || [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.markInquiryAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInquiry || !replyMessage.trim()) return;
      const formData = new FormData();
      formData.append("message", replyMessage);
      formData.append("recipientEmail", selectedInquiry.email);
      return adminApi.sendInquiryReply(selectedInquiry.id, formData);
    },
    onSuccess: () => {
      toast.success("Reply dispatched to customer email");
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      setSelectedInquiry(null);
      setReplyMessage("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to dispatch reply");
    },
  });

  const inquiries: any[] = data || [];

  return (
    <>
      <PageHeader
        title="Customer Inquiries & Concierge"
        subtitle="Customer contact submissions, product queries, bespoke customization requests."
      />

      <Card>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">Loading inquiries...</p>
        ) : inquiries.length === 0 ? (
          <EmptyState
            title="No inquiries pending"
            hint="Messages submitted through the storefront contact form will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <TableHead className="py-3">Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inq: any) => (
                  <TableRow key={inq.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-ink dark:text-cream">{inq.name}</span>
                        <span className="text-[11px] text-black/50 dark:text-cream/50">{inq.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-ink dark:text-cream">
                      {inq.subject || "General Inquiry"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-xs text-black/70 dark:text-cream/70">{inq.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${
                          inq.isReplied
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : inq.isRead
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {inq.isReplied ? "REPLIED" : inq.isRead ? "READ" : "NEW"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-black/50 dark:text-cream/50">
                      {new Date(inq.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedInquiry(inq);
                          if (!inq.isRead) markAsReadMutation.mutate(inq.id);
                        }}
                        className="h-8 rounded-full px-3 text-xs text-gold hover:text-gold/80"
                      >
                        <Reply className="mr-1 size-3.5" /> Reply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Reply Modal */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Reply to {selectedInquiry.name}</DialogTitle>
            </DialogHeader>
            <div className="my-4 space-y-3 text-sm">
              <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-black/50 dark:text-cream/50">Customer Inquiry</p>
                <p className="mt-1 text-xs text-black/80 dark:text-cream/80 italic">"{selectedInquiry.message}"</p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-black/60 dark:text-cream/60">Your Response</label>
                <Textarea
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your official response..."
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black/40 text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedInquiry(null)} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={() => sendReplyMutation.mutate()}
                disabled={sendReplyMutation.isPending || !replyMessage.trim()}
                className="rounded-full bg-gradient-gold text-xs uppercase tracking-widest text-ink hover:opacity-90"
              >
                {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
