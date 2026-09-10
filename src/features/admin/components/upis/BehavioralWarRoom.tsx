import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Eye, 
  ShoppingCart, 
  CreditCard, 
  User, 
  Zap, 
  Globe, 
  MousePointer2, 
  Clock, 
  BrainCircuit,
  RefreshCcw,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import { adminApi } from "@/features/admin/services/adminApi";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

/**
 * ⚡ COMPONENT 1: Realtime Visitor Feed (The Live Ticker)
 */
export const RealtimeVisitorFeed = ({ liveEvents }: { liveEvents: any[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [liveEvents]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'product.viewed': return <Eye className="w-3 h-3 text-slate-400" />;
            case 'cart.updated': return <ShoppingCart className="w-3 h-3 text-indigo-400" />;
            case 'checkout.started': return <CreditCard className="w-3 h-3 text-amber-400" />;
            default: return <Activity className="w-3 h-3 text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">LIVE_TELEMETRY_STREAM</h3>
                </div>
                <Badge variant="outline" className="font-mono text-[9px] text-indigo-400 border-indigo-900 bg-indigo-950/30">
                    RECEIVING_PACKETS
                </Badge>
            </div>
            
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800"
            >
                <AnimatePresence initial={false}>
                    {liveEvents.map((event, idx) => (
                        <motion.div
                            key={event.id || idx}
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-3 backdrop-blur-sm flex items-start gap-3 group hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-indigo-500/30 transition-colors flex-shrink-0">
                                {getIcon(event.eventType || event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black uppercase font-mono text-indigo-400 tracking-widest">
                                        {(event.eventType || event.type || '').replace('.', '_')}
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-500">
                                        {new Date(event.occurredAt || event.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium truncate">
                                    {event.payload?.productName || event.payload?.intent || 'User interaction recorded'}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 rounded border border-slate-800">
                                        ID: {(event.payload?.visitorId || event.actor || 'ANON').substring(0, 8)}
                                    </span>
                                    {event.isRealtime && (
                                        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                                            <Zap className="w-2 h-2 fill-current" /> Realtime
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {liveEvents.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12">
                            <Clock className="w-8 h-8 mb-3 opacity-20 animate-pulse" />
                            <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting telemetry bursts...</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * 🎯 COMPONENT 2: Live Session Radar (Active Sessions Grid)
 */
export const LiveSessionRadar = ({ sessions, onInspect }: { sessions: any[], onInspect?: (id: string) => void }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            <AnimatePresence>
                {sessions.map((session) => (
                    <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md overflow-hidden group hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer"
                        onClick={() => onInspect?.(session.id)}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner",
                                    session.isAuthenticated ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800/50 text-slate-400 border border-slate-700"
                                )}>
                                    {session.isAuthenticated ? <User size={18} /> : <Globe size={18} />}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                        {session.isAuthenticated ? "AUTH_USER" : "VISITOR_ANON"}
                                        {Date.now() - new Date(session.lastActive).getTime() < 60000 && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-[9px] font-mono text-slate-500 tracking-wider">{session.id.substring(0, 12)}...</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-950/50 text-indigo-400 border-indigo-900/50 font-mono text-[9px]">
                                {session.eventCount} EVT
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest mb-1">CURRENT_NODE</p>
                                <p className="text-xs text-slate-300 truncate bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 font-mono">
                                    {session.recentPage || '/'}
                                </p>
                            </div>

                            <div>
                                <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest mb-1.5">INTENT_HISTORY</p>
                                <div className="flex gap-1">
                                    {session.actions?.slice(0, 6).map((act: string, i: number) => (
                                        <div key={i} className="w-6 h-6 rounded bg-slate-800/50 border border-slate-700 flex items-center justify-center" title={act}>
                                            {act.includes('view') ? <Eye size={10} className="text-slate-400" /> : 
                                             act.includes('cart') ? <ShoppingCart size={10} className="text-indigo-400" /> : 
                                             act.includes('checkout') ? <CreditCard size={10} className="text-amber-400" /> :
                                             <MousePointer2 size={10} className="text-slate-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[9px] font-mono text-slate-500">
                            <span>Active {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</span>
                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all" />
                        </div>
                    </motion.div>
                ))}
                {sessions.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center">
                        <Activity className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                        <h3 className="text-slate-400 uppercase font-black text-sm">Zero Active Signal Detected</h3>
                        <p className="text-slate-600 text-[10px] font-mono mt-2">Establishment of neural telemetry required.</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * 🧠 MASTER COMPONENT: Behavioral War Room
 * The ultimate holistic monitoring console for Triveni OS (Phase 5)
 */
export const BehavioralWarRoom = () => {
    const { socket } = useSocket();
    const [liveFeed, setLiveFeed] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ activeCount: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        try {
            const res = await adminApi.getVisitorRadar();
            if (res.success) {
                setSessions(res.data.activeSessions || []);
                setSummary(res.data.summary || { activeCount: 0 });
                // Only load initial feed if current feed is empty to prevent overwriting realtime
                if (liveFeed.length === 0) {
                    setLiveFeed(res.data.liveTicker || []);
                }
            }
        } catch (err) {
            console.error("War Room failed to sync:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        // Periodic poll for general sessions update every 30 seconds for fallback
        const timer = setInterval(refreshData, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_admin');

        const handleRawEvent = (event: any) => {
            // Prepend to live ticker
            setLiveFeed(prev => [
                { ...event, isRealtime: true, id: `rt_${Date.now()}_${Math.random()}` },
                ...prev.slice(0, 49) // Max 50 items cached
            ]);

            // Dynamically update existing session in grid or add new
            setSessions(prev => {
                const visitorId = event.payload?.visitorId || event.actor || 'UNKNOWN';
                const existingIdx = prev.findIndex(s => s.id === visitorId);
                
                const eventTime = new Date().toISOString();
                
                if (existingIdx >= 0) {
                    const newArr = [...prev];
                    newArr[existingIdx] = {
                        ...newArr[existingIdx],
                        lastActive: eventTime,
                        eventCount: newArr[existingIdx].eventCount + 1,
                        recentPage: event.payload?.productName || newArr[existingIdx].recentPage,
                        actions: [event.eventType, ...newArr[existingIdx].actions].slice(0, 6)
                    };
                    // Sort to put most active on top
                    return newArr.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
                } else {
                    // New realtime entrant
                    return [{
                        id: visitorId,
                        lastActive: eventTime,
                        eventCount: 1,
                        isAuthenticated: !!event.payload?.userId && event.payload?.userId !== 'GUEST',
                        recentPage: event.payload?.productName || 'HOME',
                        actions: [event.eventType]
                    }, ...prev];
                }
            });
        };

        socket.on('upis:live_event', handleRawEvent);
        return () => {
            socket.off('upis:live_event', handleRawEvent);
        };
    }, [socket]);

    return (
        <div className="space-y-6 p-8 min-h-screen bg-slate-950 text-slate-200 rounded-3xl border border-slate-900 shadow-2xl selection:bg-indigo-500/30">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 animate-pulse">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                            BEHAVIORAL_WAR_ROOM 
                            <Badge className="bg-indigo-500 text-[10px] font-black font-mono px-2 py-0 animation-pulse">v3.0</Badge>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                           <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Persistent Neural Observability Online</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <Card className="bg-slate-900 border-slate-800 flex items-center gap-3 px-4 py-2 text-white">
                        <div className="text-right">
                            <p className="text-[9px] font-mono text-slate-500 uppercase">Active_Nodes</p>
                            <p className="text-xl font-black font-mono text-emerald-400">{sessions.length}</p>
                        </div>
                        <Activity className="text-emerald-500" size={20} />
                    </Card>
                    <Button variant="outline" size="icon" onClick={refreshData} disabled={isLoading} className="h-auto px-3 bg-slate-900 border-slate-800 text-slate-400 hover:text-white">
                        <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Master Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* Left 2/3: Radar Matrix */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                            <Globe size={14} /> LIVE_SESSION_RADAR_MATRIX
                        </h2>
                        <span className="text-[9px] text-slate-600 font-mono uppercase">Scan Window: 24H Rolling</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden bg-slate-900/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-sm">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Activity size={32} className="text-indigo-500 animate-spin opacity-50" />
                            </div>
                        ) : (
                            <LiveSessionRadar sessions={sessions} />
                        )}
                    </div>
                </div>

                {/* Right 1/3: Realtime Feed Panel */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-inner h-full flex flex-col backdrop-blur-md">
                    <RealtimeVisitorFeed liveEvents={liveFeed} />
                </div>
            </div>
        </div>
    );
};
