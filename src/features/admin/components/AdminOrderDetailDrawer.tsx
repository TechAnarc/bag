import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle2, Truck, AlertTriangle, AlertOctagon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { UniversalOrderTracker } from '@/components/orders/UniversalOrderTracker';

interface AdminOrderDetailDrawerProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (status: string) => void;
  statusColors: Record<string, string>;
}

const STATUS_OPTIONS = [
  { value: 'CREATED', label: 'New' },
  { value: 'ORDER_CREATED', label: 'Order Created' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKED', label: 'Packed' },
  // Phase 2 Logistics extensions
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  // Failures & Returns
  { value: 'DELIVERY_FAILED', label: 'Delivery Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'RETURN_INITIATED', label: 'Return Initiated' },
  { value: 'RETURN_COMPLETED', label: 'Return Completed' },
];

const AdminOrderDetailDrawer = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  statusColors
}: AdminOrderDetailDrawerProps) => {
  const [updating, setUpdating] = useState(false);
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.status || 'CREATED');
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { toast } = useToast();

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setTrackingNumber(order.trackingNumber || '');
      setAdminNotes(order.adminNotes || '');
      
      if (order.estimatedDelivery) {
        const d = new Date(order.estimatedDelivery);
        // Format to YYYY-MM-DD for raw input
        setEstimatedDelivery(d.toISOString().split('T')[0]);
      } else {
        setEstimatedDelivery('');
      }
    }
  }, [order]);

  if (!order) return null;

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await adminAPI.updateOrderStatus(order.id, selectedStatus);
      onStatusUpdate(selectedStatus);
      toast({
        title: "Status updated",
        description: `Order successfully moved to ${selectedStatus}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.response?.data?.message || "Failed to update status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateDetails = async () => {
    setUpdatingDetails(true);
    try {
      await adminAPI.updateOrderDetails(order.id, {
        trackingNumber,
        estimatedDelivery,
        adminNotes,
      });
      toast({
        title: "Configuration synchronized",
        description: "Logistics and administrative parameters updated.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.response?.data?.message || "Failed to synchronize details",
      });
    } finally {
      setUpdatingDetails(false);
    }
  };

  const sanitizeUrl = (url: any) => {
    if (typeof url !== 'string' || !url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    if (path.startsWith('/uploads/') || path.startsWith('/assets/')) {
      const backendRoot = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
      return `${backendRoot}${path}`;
    }
    return path;
  };

  const fulfillmentType = 'delivery' as const;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-[#FDFAF3] border-l border-[#E8DFC4] p-0 shadow-2xl">
        
        {/* Apple-level Header */}
        <div className="bg-white p-8 border-b border-[#E8DFC4]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#B8860B' }}>
                Order Details
              </p>
              <SheetTitle className="text-2xl font-bold" style={{ color: '#3D2E1A', fontFamily: 'sans-serif' }}>
                Order #{order.orderNumber}
              </SheetTitle>
            </div>
            <Badge className="px-3.5 py-1 text-xs font-bold rounded-full uppercase" style={{ backgroundColor: '#B8860B', color: '#FDFAF3' }}>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <UniversalOrderTracker
            currentStatus={order.status}
            fulfillmentType={fulfillmentType}
            metadata={{
              estimatedDelivery: order.estimatedDelivery ? format(new Date(order.estimatedDelivery), "dd MMM yyyy") : undefined,
              carrier: order.carrier,
            }}
          />
        </div>

        <div className="p-8 space-y-8">
          
          {/* Intelligence Layer: Predictive Risk Alerts (Phase 4) */}
          {(order.isEscalated || order.riskLevel === 'CRITICAL' || order.riskLevel === 'MEDIUM') && (
            <Alert variant={order.riskLevel === 'CRITICAL' ? "destructive" : "default"} className={order.riskLevel !== 'CRITICAL' ? "bg-amber-50 border-amber-200 text-amber-900" : ""}>
              {order.riskLevel === 'CRITICAL' ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              <AlertTitle className="font-bold uppercase tracking-wide flex items-center gap-2">
                Fulfillment Intelligence Advisory
                <Badge variant="outline" className={order.riskLevel === 'CRITICAL' ? "border-white text-white" : "border-amber-300 text-amber-700"}>
                  Risk Score: {order.riskScore}/100
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                {order.riskLevel === 'CRITICAL' 
                  ? "Severe logistics breach detected. The predictive intelligence engine flags immediate SLA decay. Operational overrides highly advised."
                  : "Minor bottleneck predicted based on existing transit patterns. Monitor closely for next 24 hours."}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Update Control */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-[#7A6B4F] uppercase tracking-wider mb-2">Change Order Status</p>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A] h-10">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E8DFC4]">
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="sm:self-end h-10 font-bold px-6 shadow-sm hover:opacity-90 active:scale-95 transition-all text-white"
              style={{ backgroundColor: '#B8860B' }}
              disabled={updating}
              onClick={handleUpdateStatus}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>

          {/* Advanced Logistics & Admin Directives (NEW) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-[#F2EBD7] pb-3 mb-1">
              <Truck className="w-4 h-4 text-[#B8860B]" />
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#3D2E1A' }}>Logistics & Operations</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#7A6B4F] uppercase tracking-wide">Tracking Number / AWB</Label>
                <Input 
                  placeholder="Enter Courier Ref Number" 
                  className="bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A]"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#7A6B4F] uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Estimated Delivery Target
                </Label>
                <Input 
                  type="date"
                  className="bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A] [color-scheme:light]"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#7A6B4F] uppercase tracking-wide">Internal Administrative Notes (Private)</Label>
              <Textarea 
                placeholder="Add delivery constraints, customer requests, or operational metadata..." 
                className="min-h-[80px] bg-[#FDFAF3] border-[#E8DFC4] text-[#3D2E1A] placeholder:text-[#A39981]"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="border-[#E8DFC4] text-[#3D2E1A] font-bold text-xs hover:bg-[#FDFAF3] active:scale-95 transition-all flex items-center gap-2 rounded-xl h-9"
                disabled={updatingDetails}
                onClick={handleUpdateDetails}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B]" />
                {updatingDetails ? "Saving Changes..." : "Commit Logistics & Notes"}
              </Button>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#B8860B' }}>Customer</h4>
              <div className="text-sm space-y-1" style={{ color: '#3D2E1A' }}>
                <p className="font-bold">{order.user?.name || order.customerName}</p>
                <p style={{ color: '#7A6B4F' }}>{order.user?.email || order.customerEmail}</p>
                <p style={{ color: '#7A6B4F' }}>{order.user?.phone}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#B8860B' }}>Shipping Address</h4>
              <div className="text-sm space-y-1" style={{ color: '#3D2E1A' }}>
                {order.shippingAddress ? (
                  <>
                    <p className="font-semibold">{order.shippingAddress.street}</p>
                    <p style={{ color: '#7A6B4F' }}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  </>
                ) : (
                  <p style={{ color: '#7A6B4F' }}>No address specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Instructions (If any) */}
          {order.customerNotes && (
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                💡 Delivery Instructions (from Customer)
              </h4>
              <p className="text-sm italic text-[#3D2E1A] leading-relaxed">"{order.customerNotes}"</p>
            </div>
          )}

          {/* Ordered Items */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#B8860B' }}>Items ({order.items?.length || 0})</h4>
            <div className="space-y-3">
              {order.items?.map((item: any) => {
                const imageUrl = sanitizeUrl(item.product?.thumbnail || item.product?.images?.[0]);
                return (
                  <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-[#FDFAF3]">
                    <div className="w-12 h-12 bg-white rounded-lg border overflow-hidden flex-shrink-0" style={{ borderColor: '#E8DFC4' }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-[#FDFAF3]">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold truncate" style={{ color: '#3D2E1A' }}>{item.product?.name}</p>
                        <p className="text-xs" style={{ color: '#7A6B4F' }}>Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#B8860B' }}>₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-sm font-bold" style={{ color: '#3D2E1A' }}>Total amount paid</span>
              <span className="text-xl font-bold" style={{ color: '#B8860B' }}>₹{order.totalAmount || order.total}</span>
            </div>
          </div>

          {/* Order History Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFC4] shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#B8860B' }}>Order History</h4>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#E8DFC4]">
              {(order.timeline || []).map((event: any, i: number) => (
                <div key={i} className="pl-8 relative flex gap-4">
                  <div className="absolute left-[5px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: '#B8860B' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#B8860B' }} />
                  </div>
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <p className="text-sm font-bold" style={{ color: '#3D2E1A' }}>{event.title}</p>
                      <span className="text-xs" style={{ color: '#A39981' }}>{format(new Date(event.timestamp || event.createdAt), "dd MMM yyyy h:mm a")}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#7A6B4F' }}>{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminOrderDetailDrawer;
