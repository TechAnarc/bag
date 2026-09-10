import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useSocket } from "@/context/SocketContext";
import AdminOrderDetailDrawer from "../components/AdminOrderDetailDrawer";
import { cn } from "@/lib/utils";

const STATUS_MAPPING: Record<string, string> = {
  ALL: "All Orders",
  CREATED: "New",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  // Logistics Additions
  ORDER_CREATED: "Order Created",
  IN_TRANSIT: "In Transit",
  DELIVERY_FAILED: "Delivery Failed",
  RETURN_INITIATED: "Return Initiated",
  RETURN_COMPLETED: "Return Completed",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [surveillance, setSurveillance] = useState<any>(null);

  const { toast } = useToast();
  const { socket } = useSocket();

  const fetchSurveillance = async () => {
    try {
      const response = await adminAPI.getSurveillanceMetrics();
      const data = response.data.data;
      setSurveillance(data);
    } catch (err) {
      console.error("Failed to fetch surveillance", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics();
      setAnalytics(response.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calling standard getOrders with identical auth headers via main api client
      const response = await adminAPI.getOrders({ limit: 100 });
      const ordersData = response.data.data;
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
      setOrders(ordersList);
    } catch (error: any) {
      console.error("Failed to fetch standard orders, falling back:", error);
      try {
        const fallbackResponse = await adminAPI.getOperationalOrders();
        setOrders(fallbackResponse.data.data || []);
      } catch (err) {
        setOrders([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      const data = response.data.data;
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    const todayString = new Date().toDateString();
    const todayCount = orders.filter(o => new Date(o.createdAt).toDateString() === todayString).length;
    setNewOrdersCount(stats?.newOrdersToday || todayCount);
  }, [orders, stats]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchAnalytics();
    fetchSurveillance();
  }, [fetchOrders]);

  // WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_admin');

    socket.on('order:created', (newOrder) => {
      // Wire existing order:created WebSocket event directly to append new rows into the table state in real time
      setOrders((prev) => [newOrder, ...prev]);
      // Increment daily count integer only when a new order:created event fires
      setNewOrdersCount((prev) => prev + 1);
      
      toast({
        title: "New Order Placed",
        description: `Order #${newOrder.orderNumber || newOrder.id} received.`,
      });
    });

    socket.on('order:updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updatedOrder.id || o.orderNumber === updatedOrder.orderNumber
            ? { ...o, ...updatedOrder }
            : o
        )
      );
      if (selectedOrder?.id === updatedOrder.id || selectedOrder?.orderNumber === updatedOrder.orderNumber) {
        setSelectedOrder((prev: any) => ({ ...prev, ...updatedOrder }));
      }
    });

    return () => {
      socket.off('order:created');
      socket.off('order:updated');
    };
  }, [socket, selectedOrder, toast]);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const statusColors: Record<string, string> = {
    CREATED: "bg-blue-50 text-blue-700 border-blue-200",
    PAYMENT_PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PAYMENT_CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PACKED: "bg-violet-50 text-violet-700 border-violet-200",
    SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
    OUT_FOR_DELIVERY: "bg-yellow-50 text-yellow-700 border-yellow-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    COMPLETED: "bg-gray-50 text-gray-700 border-gray-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const filteredOrders = orders.filter((order) => {
    const s = searchTerm.toLowerCase();
    const searchFields = [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      order.user?.name,
      order.user?.email,
    ].map((f) => (f || '').toLowerCase());

    const matchesSearch = searchFields.some((f) => f.includes(s));
    const matchesStatus = filterStatus === "ALL" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter((o) => o.status !== 'DELIVERED').length;

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-8 bg-[#FDFAF3] min-h-screen text-[#3D2E1A] font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DFC4] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#3D2E1A]">
            Orders
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchOrders();
              fetchStats();
              fetchAnalytics();
            }}
            className="border-[#E8DFC4] hover:bg-[#EDE8D8] text-[#3D2E1A] rounded-xl h-10 w-10"
          >
            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "New Orders Today",
            value: newOrdersCount || 0,
            trend: "Incrementing live",
            trendColor: "text-emerald-600 bg-emerald-50 border border-emerald-100",
          },
          {
            label: "Today's Revenue",
            value: `₹${(surveillance?.revenueToday || stats?.totalRevenue || 0).toLocaleString()}`,
            trend: "+12% from yesterday",
            trendColor: "text-emerald-600 bg-emerald-50 border border-emerald-100",
          },
          {
            label: "Pending Orders",
            value: pendingCount || 0,
            trend: "Normal load",
            trendColor: "text-blue-600 bg-blue-50 border border-blue-100",
          },
          {
            label: "Delayed Orders",
            value: surveillance?.escalations || 0,
            trend: (surveillance?.escalations > 0 ? "Needs attention" : "All good"),
            trendColor: surveillance?.escalations > 0 ? "text-amber-600 bg-amber-50 border border-amber-100" : "text-emerald-600 bg-emerald-50 border border-emerald-100",
          },
        ].map((card, i) => (
          <Card key={i} className="bg-white border-[#E8DFC4] shadow-sm rounded-2xl hover:shadow-md transition-all">
            <CardContent className="p-6 space-y-2">
              <h3 className="text-3xl font-bold text-[#3D2E1A]">{card.value}</h3>
              <p className="text-sm font-medium text-[#7A6B4F]">{card.label}</p>
              <div className="pt-2 flex">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", card.trendColor)}>
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-[#E8DFC4] shadow-sm mt-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B4F]" />
          <Input
            placeholder="Search by order number, customer name, or email…"
            className="pl-10 bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A] text-sm focus:ring-[#B8860B] focus:border-[#B8860B]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px] bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A] font-medium h-10">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E8DFC4] text-[#3D2E1A]">
              {Object.entries(STATUS_MAPPING).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rebuilt Secure Orders Table taking full width */}
      <Card className="bg-white border-[#E8DFC4] overflow-hidden shadow-sm rounded-2xl w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#FDFAF3] border-b border-[#E8DFC4]">
              <TableRow className="border-b border-[#E8DFC4] hover:bg-transparent">
                <TableHead className="text-[#7A6B4F] font-bold text-xs py-4">Order</TableHead>
                <TableHead className="text-[#7A6B4F] font-bold text-xs py-4">Customer</TableHead>
                <TableHead className="text-[#7A6B4F] font-bold text-xs py-4">Amount</TableHead>
                <TableHead className="text-[#7A6B4F] font-bold text-xs py-4">Status</TableHead>
                <TableHead className="text-[#7A6B4F] font-bold text-xs py-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && orders.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-gray-100">
                    <TableCell className="py-5"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded animate-pulse w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded animate-pulse w-16" /></TableCell>
                    <TableCell><div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 bg-gray-100 rounded-xl animate-pulse w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-[#7A6B4F] text-sm font-medium">
                    No orders found — try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-[#3D2E1A]">#{order.orderNumber || order.id.slice(0, 8)}</span>
                        <div className="flex items-center gap-1 mt-1 text-[#7A6B4F] text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(order.createdAt), "dd MMM yyyy")}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[#3D2E1A] font-bold text-sm">{order.customerName || order.user?.name}</span>
                        <span className="text-xs text-[#7A6B4F]">{order.customerEmail || order.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[#3D2E1A] font-bold text-sm">₹{(order.totalAmount || order.total)?.toLocaleString()}</span>
                        <span className="text-xs text-[#7A6B4F] mt-0.5">{order.itemCount || (order.items?.length || 0)} Items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("px-3 py-1 text-[11px] font-bold border rounded-full uppercase", statusColors[order.status])}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                        {order.isEscalated && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full uppercase">
                            Delayed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#E8DFC4] bg-[#FDFAF3] text-[#3D2E1A] hover:bg-[#B8860B] hover:text-white hover:border-[#B8860B] text-xs font-bold rounded-xl transition-all shadow-sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDrawerOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AdminOrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdate={(status) => handleStatusUpdate(selectedOrder.id, status)}
        statusColors={statusColors}
      />
    </div>
  );
}
