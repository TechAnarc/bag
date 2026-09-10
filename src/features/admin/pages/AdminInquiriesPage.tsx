import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  MailQuestion,
  Paperclip,
  Send,
  X,
  FileText,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminInquiriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "replied" | "pending_reply">("all");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async (inquiryId: string) => {
    if (!replyMessage.trim()) {
      toast.error("Reply message cannot be empty");
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.append("message", replyMessage);
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      await adminApi.sendInquiryReply(inquiryId, formData);
      toast.success("Reply sent successfully via email!");
      setActiveReplyId(null);
      setReplyMessage("");
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ["admin-inquiries", filter],
    queryFn: async () => {
      const params: any = {};
      if (filter === "unread") params.isRead = false;
      if (filter === "read") params.isRead = true;
      if (filter === "replied") params.isReplied = true;
      if (filter === "pending_reply") params.isReplied = false;

      const response = await adminApi.getInquiries(params);
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => adminApi.markInquiryAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries-unread"] });
      toast.success("Marked as read");
    },
  });

  const filteredInquiries = inquiriesData?.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Inquiries</h1>
          <p className="text-muted-foreground">Manage and respond to customer messages from the contact form.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
             {inquiriesData?.filter((i: any) => !i.isRead).length || 0} Unread
           </Badge>
           <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1">
             {inquiriesData?.filter((i: any) => !i.isReplied).length || 0} Pending Reply
           </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search inquiries..." 
            className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shrink-0"}
          >
            All
          </Button>
          <Button 
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shrink-0"}
          >
            Unread
          </Button>
          <Button 
            variant={filter === "read" ? "default" : "outline"}
            onClick={() => setFilter("read")}
            className={filter === "read" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shrink-0"}
          >
            Read
          </Button>
          <Button 
            variant={filter === "replied" ? "default" : "outline"}
            onClick={() => setFilter("replied")}
            className={filter === "replied" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shrink-0"}
          >
            Replied
          </Button>
          <Button 
            variant={filter === "pending_reply" ? "default" : "outline"}
            onClick={() => setFilter("pending_reply")}
            className={filter === "pending_reply" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shrink-0"}
          >
            Pending Reply
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-16 w-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredInquiries?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-full">
              <MailQuestion size={40} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">No inquiries found</h3>
              <p className="text-slate-500">When customers contact you, their messages will appear here.</p>
            </div>
          </div>
        ) : (
          filteredInquiries?.map((inquiry: any) => (
            <Card 
              key={inquiry.id} 
              className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 group relative overflow-hidden ${!inquiry.isRead ? 'ring-1 ring-indigo-500/30' : ''}`}
            >
              {!inquiry.isRead && (
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              )}
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${!inquiry.isRead ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {inquiry.name.charAt(0)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{inquiry.name}</h3>
                          {!inquiry.isRead && (
                            <Badge className="bg-indigo-600 text-[10px] uppercase font-bold px-1.5 py-0">New</Badge>
                          )}
                          {inquiry.isReplied && (
                            <Badge className="bg-emerald-600 text-[10px] uppercase font-bold px-1.5 py-0">Replied</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Mail size={14} className="text-slate-400 dark:text-slate-500" /> {inquiry.email}</span>
                          {inquiry.phone && <span className="flex items-center gap-1"><Phone size={14} className="text-slate-400 dark:text-slate-500" /> {inquiry.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(inquiry.createdAt), "MMM d, h:mm a")}</span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            {!inquiry.isRead && (
                              <DropdownMenuItem onClick={() => markAsReadMutation.mutate(inquiry.id)} className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50">
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{inquiry.subject || "No Subject"}</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                        "{inquiry.message}"
                      </p>
                    </div>

                    {inquiry.isReplied && inquiry.replyText && (
                      <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            Replied by {inquiry.repliedBy || "Admin"}
                          </span>
                          {inquiry.repliedAt && (
                            <span>{format(new Date(inquiry.repliedAt), "MMM d, h:mm a")}</span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                          "{inquiry.replyText}"
                        </p>
                      </div>
                    )}

                    {activeReplyId === inquiry.id && (
                      <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-3 mt-4">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MessageSquare size={12} className="text-indigo-500" />
                          Compose Email Reply to {inquiry.email}
                        </div>
                        <Textarea
                          placeholder="Type your reply here..."
                          className="min-h-[120px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-slate-900 dark:text-slate-100"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          disabled={isSending}
                        />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                              <Paperclip size={14} className="text-slate-400 dark:text-slate-500" />
                              Attach Files
                              <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const filesArray = Array.from(e.target.files);
                                    setAttachments(prev => [...prev, ...filesArray]);
                                  }
                                }}
                                disabled={isSending}
                              />
                            </label>
                            {attachments.length > 0 && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {attachments.length} file(s) attached
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setActiveReplyId(null);
                                setReplyMessage("");
                                setAttachments([]);
                              }}
                              disabled={isSending}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendReply(inquiry.id)}
                              disabled={isSending || !replyMessage.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-xs flex items-center gap-1.5"
                            >
                              {isSending ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send size={12} />
                                  Send Email Reply
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                <FileText size={12} className="text-slate-400 dark:text-slate-500" />
                                <span className="max-w-[120px] truncate">{file.name}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                  disabled={isSending}
                                  className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                       {!inquiry.isRead && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => markAsReadMutation.mutate(inquiry.id)}
                            className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 size={14} className="mr-2" /> Mark as Read
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                          onClick={() => {
                            if (activeReplyId === inquiry.id) {
                              setActiveReplyId(null);
                              setReplyMessage("");
                              setAttachments([]);
                            } else {
                              setActiveReplyId(inquiry.id);
                              setReplyMessage("");
                              setAttachments([]);
                            }
                          }}
                        >
                          <MessageSquare size={14} className="mr-2" />
                          {activeReplyId === inquiry.id ? "Cancel Reply" : inquiry.isReplied ? "Reply Again" : "Reply"}
                        </Button>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
