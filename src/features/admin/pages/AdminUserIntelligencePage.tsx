import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  BrainCircuit, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  History, 
  DollarSign, 
  ShoppingCart, 
  User, 
  ArrowLeft,
  Search,
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Heart,
  MousePointer2,
  Package,
  CreditCard,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { adminApi } from "../services/adminApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { useSocket } from "@/context/SocketContext";

export default function AdminUserIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [intelligence, setIntelligence] = useState<any>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (id) fetchIntelligence();
  }, [id]);

  // 🛰️ Real-Time Neuro-Stream Hook
  useEffect(() => {
    if (!socket || !id) return;

    // Connect to Command Center feed
    socket.emit('join_admin');

    const handleLiveEvent = (liveEvent: any) => {
      // Check if event matches CURRENT user profile or generic broadcast
      const eventUserId = liveEvent.payload?.userId || liveEvent.actor;
      if (eventUserId === id) {
        console.log("🔥 Realtime Event Captured:", liveEvent);
        toast.success(`Live Action Detected: ${liveEvent.eventType}`, {
           description: "Appending to active neural timeline...",
           duration: 2000
        });
        
        setIntelligence((prev: any) => {
           if (!prev) return prev;
           // Dedup and Prepend
           const alreadyExists = prev.timeline?.some((e: any) => e.id === liveEvent.id);
           if (alreadyExists) return prev;
           
           return {
             ...prev,
             timeline: [liveEvent, ...(prev.timeline || [])]
           };
        });
      }
    };

    socket.on('upis:live_event', handleLiveEvent);
    return () => {
      socket.off('upis:live_event', handleLiveEvent);
    };
  }, [socket, id]);

  const fetchIntelligence = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUserIntelligence(id!);
      setIntelligence(response.data);
    } catch (error) {
      toast.error("Failed to load intelligence data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Synchronizing Digital Twin...</p>
      </div>
    );
  }

  if (!intelligence) return <div>Intelligence Node Offline</div>;

  const { twin, identity, timeline } = intelligence;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ðŸ§¬ Header / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                INTEL_<span className="text-indigo-500">360</span>
               </h1>
               <Badge className={cn(
                 "uppercase font-black text-[10px] px-2 py-0 border-0",
                 twin.lifecycleStage === 'HIGH_VALUE' ? "bg-amber-500 text-white" :
                 twin.lifecycleStage === 'LOYAL' ? "bg-emerald-500 text-white" :
                 twin.lifecycleStage === 'AT_RISK' ? "bg-rose-500 text-white animate-pulse" :
                 "bg-slate-500 text-white"
               )}>
                 {twin.lifecycleStage}
               </Badge>
            </div>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">
              Subject: {identity?.name || id} | UUID: {id?.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">Last_Active</span>
              <span className="text-xs font-bold font-mono">{format(new Date(twin.lastActiveAt), 'HH:mm:ss')} | {format(new Date(twin.lastActiveAt), 'dd/MM/yy')}</span>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              {identity?.name?.charAt(0) || 'U'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ðŸ“Š Column 1: Core Metrics & Value */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="bg-slate-900 border-indigo-500/20 text-white overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">ECONOMIC_DNA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Lifetime_Value</p>
                      <p className="text-3xl font-black text-white italic">₹{(twin.ltv || 0).toLocaleString()}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Order_Volume</p>
                        <p className="text-xl font-bold">{twin.orderCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Avg_Ticket</p>
                        <p className="text-xl font-bold">₹{twin.aov.toFixed(0)}</p>
                      </div>
                   </div>
                </div>
              </CardContent>
           </Card>

           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">INTENT_SIGNALS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span>Conversion_Likely</span>
                       <span className="text-indigo-500">{Math.round(twin.conversionScore * 100)}%</span>
                    </div>
                    <Progress value={twin.conversionScore * 100} className="h-1 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-indigo-500" />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span>Churn_Probability</span>
                       <span className="text-rose-500">{Math.round(twin.churnScore * 100)}%</span>
                    </div>
                    <Progress value={twin.churnScore * 100} className="h-1 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-rose-500" />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                       <span>Risk_Coefficient</span>
                       <span className="text-amber-500">{Math.round(twin.riskScore * 100)}%</span>
                    </div>
                    <Progress value={twin.riskScore * 100} className="h-1 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-amber-500" />
                 </div>
              </CardContent>
           </Card>

           <Card className="bg-indigo-500/5 border-indigo-500/20 border-dashed">
              <CardContent className="p-4 flex items-center gap-3">
                 <div className="p-2 bg-indigo-500 text-white rounded-lg">
                    <BrainCircuit size={16} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Confidence_Bands</p>
                    <p className="text-[9px] text-slate-500 font-mono">Telemetry verified with 85% statistical significance.</p>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* ðŸ§¬ Column 2-3: Behavioral Timeline / War Room Replay */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl h-[700px] flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-black uppercase tracking-tight">BEHAVIORAL_TIMELINE</CardTitle>
                   <CardDescription className="text-[10px] font-mono uppercase">Replaying historical interaction stream...</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="font-mono text-[9px] uppercase border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      Events_Captured: {timeline.length}
                   </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                 <div className="p-6 space-y-8">
                    {timeline.map((event: any, idx: number) => (
                      <div key={event.id} className="relative pl-8 group">
                         {idx !== timeline.length - 1 && (
                           <div className="absolute left-[3px] top-4 bottom-[-32px] w-[1px] bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500/30 transition-colors" />
                         )}
                         <div className={cn(
                           "absolute left-0 top-1 w-2 h-2 rounded-full ring-4 ring-white dark:ring-slate-900 transition-all",
                           event.eventType === 'order.completed' || event.eventType === 'order.created' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-125' :
                           event.eventType === 'cart.updated' ? 'bg-indigo-500' :
                           event.eventType === 'product.viewed' ? 'bg-slate-300 dark:bg-slate-700' :
                           'bg-slate-500'
                         )} />
                         
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono italic">
                                  {event.eventType.replace('.', '_')}
                               </span>
                               <span className="text-[9px] text-slate-400 font-mono italic">
                                  {format(new Date(event.occurredAt), 'HH:mm:ss.SSS')}
                               </span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl group-hover:border-indigo-500/20 transition-all">
                               <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {getEventDescription(event)}
                               </p>
                               {event.payload && Object.keys(event.payload).length > 0 && (
                                 <div className="mt-2 text-[9px] font-mono text-slate-400 line-clamp-1 opacity-50">
                                    DATA: {JSON.stringify(event.payload)}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* ðŸ§¬ Column 4: Contextual Intelligence */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest">Digital_Twin_Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Eye size={14} className="text-slate-400" />
                       <span className="text-[10px] font-bold uppercase">Product_Views</span>
                    </div>
                    <span className="text-xs font-bold font-mono">{twin.productViewsCount}</span>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ShoppingCart size={14} className="text-slate-400" />
                       <span className="text-[10px] font-bold uppercase">Cart_Velocity</span>
                    </div>
                    <span className="text-xs font-bold font-mono">{(twin.cartAdditions / (twin.productViewsCount || 1)).toFixed(2)}</span>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-slate-400" />
                       <span className="text-[10px] font-bold uppercase">Checkout_Starts</span>
                    </div>
                    <span className="text-xs font-bold font-mono">{twin.checkoutAttempts}</span>
                 </div>
                 
                 <Separator className="bg-slate-100 dark:bg-slate-800" />
                 
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category_Affinity</p>
                    <div className="flex flex-wrap gap-2">
                       {(twin.categoryAffinity && Object.keys(twin.categoryAffinity).length > 0) ? 
                         Object.entries(twin.categoryAffinity).map(([cat, weight]: [string, any]) => (
                           <Badge key={cat} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[9px] uppercase font-bold border-0">
                              {cat} ({(weight * 100).toFixed(0)}%)
                           </Badge>
                         )) : (
                           <p className="text-[9px] italic text-slate-400 uppercase">Insufficient category data</p>
                         )
                       }
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/30 text-white relative overflow-hidden group cursor-pointer hover:bg-indigo-700 transition-colors">
              <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:rotate-12 transition-transform">
                 <Zap size={120} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Recommended_Action</p>
              <h3 className="text-xl font-bold italic mb-4">
                 {twin.lifecycleStage === 'AT_RISK' ? 'INITIATE_RETENTION_PROTOCOL' : 
                  twin.lifecycleStage === 'HIGH_VALUE' ? 'ACTIVATE_WHITE_GLOVE_SERVICE' :
                  twin.lifecycleStage === 'INTERESTED' ? 'TRIGGER_FLASH_INCENTIVE' :
                  'MAINTAIN_STANDARD_SURVEILLANCE'}
              </h3>
              <Button size="sm" className="bg-white text-indigo-600 hover:bg-slate-100 font-black text-[10px] uppercase w-full">
                 Execute_Protocol
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

function getEventDescription(event: any) {
  switch (event.eventType) {
    case 'product.viewed':
      return `Viewed product ${event.payload?.productName || event.entityId} from ${event.payload?.source || 'direct browse'}.`;
    case 'cart.updated':
      return `Modified shopping context. Cart value adjusted by ${event.payload?.delta || 0} unit(s).`;
    case 'checkout.started':
      return `Entered high-intent zone. Initiated checkout sequence for ${event.payload?.itemCount || 0} items.`;
    case 'order.created':
      return `Transaction commitment verified. Created order #${event.entityId}. Payload: ₹${event.payload?.total}.`;
    case 'order.completed':
      return `Lifecycle cycle completed. Order #${event.entityId} fulfillment verified.`;
    case 'user.login':
      return `Intelligence session established. Auth node: ${event.payload?.method || 'Standard'}.`;
    default:
      return `System event recorded with type ${event.eventType}. No description template available.`;
  }
}
