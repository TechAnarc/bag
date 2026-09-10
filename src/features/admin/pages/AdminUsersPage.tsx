import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, BrainCircuit, TrendingUp, AlertTriangle,
  RefreshCcw, ShieldCheck, Activity, Zap, Eye, ShoppingCart,
  CreditCard, LogIn, ChevronDown, ChevronRight, Clock,
  CheckCircle2, XCircle, Package, Crown, Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "../services/adminApi";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ── Light Golden palette ──────────────────────────────────────────
const G = {
  bg: "#FDFAF3",
  surface: "#FFFFFF",
  card: "#FDF6E3",
  border: "#E8D89A",
  gold: "#A07820",
  goldLight: "#7A5C10",
  goldDim: "#C49A30",
  amber: "#D97706",
  text: "#2D1F00",
  muted: "#8A6D30",
  red: "#DC2626",
  green: "#059669",
  blue: "#4F46E5",
};

const STAGE_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  HIGH_VALUE: { color: "#7A5C10", bg: "rgba(160,120,32,0.12)", icon: Crown, label: "HIGH VALUE" },
  LOYAL:      { color: "#065F46", bg: "rgba(5,150,105,0.10)",  icon: ShieldCheck, label: "LOYAL" },
  ACTIVE:     { color: "#3730A3", bg: "rgba(79,70,229,0.10)",  icon: Activity, label: "ACTIVE" },
  INTERESTED: { color: "#92400E", bg: "rgba(217,119,6,0.10)",  icon: Flame, label: "INTERESTED" },
  AT_RISK:    { color: "#991B1B", bg: "rgba(220,38,38,0.10)",  icon: AlertTriangle, label: "AT RISK" },
  NEW:        { color: "#6B5020", bg: "rgba(138,109,48,0.10)", icon: Users, label: "NEW" },
};

function eventIcon(type: string) {
  if (type?.includes("order")) return <Package size={10} className="text-emerald-400" />;
  if (type?.includes("cart")) return <ShoppingCart size={10} className="text-amber-400" />;
  if (type?.includes("checkout")) return <CreditCard size={10} className="text-indigo-400" />;
  if (type?.includes("login") || type?.includes("auth")) return <LogIn size={10} className="text-blue-400" />;
  if (type?.includes("product") || type?.includes("view")) return <Eye size={10} className="text-purple-400" />;
  return <Activity size={10} style={{ color: G.muted }} />;
}

function eventText(ev: any) {
  const t = ev.eventType || "";
  const p = ev.payload || {};
  if (t.includes("order.created")) return `Created order #${ev.entityId?.slice(0, 8) || "—"} · ₹${p.total || "?"}`;
  if (t.includes("order.completed")) return `Order completed · ₹${p.total || "?"}`;
  if (t.includes("order.cancelled")) return `Order cancelled · ${ev.entityId?.slice(0, 8) || ""}`;
  if (t.includes("cart")) return `Cart updated · ${p.delta || ""} item(s)`;
  if (t.includes("checkout")) return `Checkout started · ${p.itemCount || "?"} items`;
  if (t.includes("product.viewed")) return `Viewed product · ${p.productName || p.slug || ev.entityId?.slice(0, 12) || "—"}`;
  if (t.includes("login") || t.includes("auth")) return `Signed in via ${p.method || "email"}`;
  return t.replace(/[._]/g, " ");
}

function UserRow({ user, onClick, isSelected }: { user: any; onClick: () => void; isSelected: boolean }) {
  const intel = user.intelligence || {};
  const stage = intel.lifecycleStage || "NEW";
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.NEW;
  const Icon = cfg.icon;
  const orderCount = user._count?.orders ?? intel.orderCount ?? 0;
  const ltv = intel.ltv || 0;
  const lastActive = intel.lastActiveAt || user.lastLoginAt || user.createdAt;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${G.border}`,
        background: isSelected ? "rgba(201,168,76,0.08)" : "transparent",
        borderLeft: isSelected ? `3px solid ${G.gold}` : "3px solid transparent",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: cfg.bg, color: cfg.color }}>
          {user.name?.charAt(0)?.toUpperCase() || "?"}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold truncate" style={{ color: G.text }}>{user.name || "Unknown"}</p>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: cfg.bg, color: cfg.color }}>
              <Icon size={8} />
              {cfg.label}
            </div>
          </div>
          <p className="text-[10px] font-mono truncate" style={{ color: G.muted }}>{user.email}</p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-black font-mono" style={{ color: G.goldLight }}>₹{ltv.toLocaleString()}</p>
            <p className="text-[9px]" style={{ color: G.muted }}>{orderCount} orders</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-mono" style={{ color: G.muted }}>
              {lastActive ? formatDistanceToNow(new Date(lastActive), { addSuffix: true }) : "never"}
            </p>
          </div>
          <ChevronRight size={14} style={{ color: G.goldDim }} />
        </div>
      </div>
    </div>
  );
}

function LiveLogEntry({ ev, isNew }: { ev: any; isNew?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2 py-2 px-3 rounded-lg transition-all", isNew && "animate-pulse")}
      style={{ background: isNew ? "rgba(201,168,76,0.06)" : "transparent" }}>
      <div className="mt-0.5 flex-shrink-0">{eventIcon(ev.eventType)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] leading-snug" style={{ color: G.text }}>{eventText(ev)}</p>
        <p className="text-[9px] font-mono mt-0.5" style={{ color: G.muted }}>
          {ev.occurredAt ? format(new Date(ev.occurredAt), "HH:mm:ss · dd MMM") : ""}
        </p>
      </div>
    </div>
  );
}

function UserDetailPanel({ user, liveEvents }: { user: any; liveEvents: any[] }) {
  const intel = user.intelligence || {};
  const navigate = useNavigate();
  const allEvents = [...liveEvents, ...(user.recentEvents || [])].slice(0, 20);
  const stage = intel.lifecycleStage || "NEW";
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.NEW;

  const metrics = [
    { label: "Lifetime Value", value: `₹${(intel.ltv || 0).toLocaleString()}`, color: G.goldLight },
    { label: "Orders", value: user._count?.orders ?? intel.orderCount ?? 0, color: G.text },
    { label: "Avg. Order", value: `₹${(intel.aov || 0).toFixed(0)}`, color: G.text },
    { label: "Product Views", value: intel.productViewsCount || 0, color: G.text },
    { label: "Cart Adds", value: intel.cartAdditions || 0, color: G.amber },
    { label: "Checkouts", value: intel.checkoutAttempts || 0, color: G.blue },
    { label: "Sessions", value: intel.sessionCount || 0, color: G.muted },
    { label: "Risk Score", value: `${((intel.riskScore || 0) * 100).toFixed(0)}%`, color: (intel.riskScore || 0) > 0.5 ? G.red : G.green },
  ];

  const scores = [
    { label: "Conversion", value: intel.conversionScore || 0, color: G.green },
    { label: "Churn Risk", value: intel.churnScore || 0, color: G.red },
    { label: "Risk Score", value: intel.riskScore || 0, color: G.amber },
    { label: "Trust Index", value: intel.trustIndex || 0.5, color: G.blue },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ color: G.text }}>
      {/* Header */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
            style={{ background: cfg.bg, color: cfg.color }}>
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: G.goldLight }}>{user.name || "Unknown"}</p>
            <p className="text-[10px] font-mono" style={{ color: G.muted }}>{user.email}</p>
            {user.phone && <p className="text-[10px] font-mono" style={{ color: G.muted }}>{user.phone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] px-2 py-1 rounded font-black uppercase" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          {user.isBlocked && <span className="text-[9px] px-2 py-1 rounded font-black uppercase bg-red-500/20 text-red-400">BLOCKED</span>}
          <span className="text-[9px] font-mono" style={{ color: G.muted }}>
            Joined {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "—"}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-2 flex-shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl p-3" style={{ background: G.card, border: `1px solid ${G.border}` }}>
            <p className="text-[9px] uppercase font-bold mb-1" style={{ color: G.muted }}>{m.label}</p>
            <p className="text-sm font-black font-mono" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Probability Bars */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
        <p className="text-[10px] font-black uppercase mb-3" style={{ color: G.goldDim }}>Intent Signals</p>
        <div className="space-y-3">
          {scores.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span style={{ color: G.muted }}>{s.label}</span>
                <span style={{ color: s.color }}>{(s.value * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: G.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, s.value * 100)}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {user.orders?.length > 0 && (
        <div className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${G.border}` }}>
          <p className="text-[10px] font-black uppercase mb-3" style={{ color: G.goldDim }}>Recent Orders</p>
          <div className="space-y-2">
            {user.orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg p-2.5"
                style={{ background: G.card, border: `1px solid ${G.border}` }}>
                <div>
                  <p className="text-[10px] font-bold font-mono" style={{ color: G.text }}>#{o.orderNumber}</p>
                  <p className="text-[9px]" style={{ color: G.muted }}>
                    {o.createdAt ? format(new Date(o.createdAt), "dd MMM") : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black" style={{ color: G.goldLight }}>₹{o.total}</p>
                  <p className="text-[9px]" style={{ color: o.paymentStatus === "COMPLETED" ? G.green : G.amber }}>
                    {o.paymentStatus?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="p-4 flex-1">
        <p className="text-[10px] font-black uppercase mb-3" style={{ color: G.goldDim }}>
          Activity Log
          {liveEvents.length > 0 && (
            <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded animate-pulse"
              style={{ background: "rgba(16,185,129,0.15)", color: G.green }}>
              ● LIVE
            </span>
          )}
        </p>
        {allEvents.length === 0 ? (
          <p className="text-[10px] italic" style={{ color: G.muted }}>No activity recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {allEvents.map((ev, i) => (
              <LiveLogEntry key={ev.id || i} ev={ev} isNew={i < liveEvents.length} />
            ))}
          </div>
        )}
      </div>

      {/* Full Intelligence Button */}
      <div className="p-4 flex-shrink-0">
        <button
          onClick={() => navigate(`/admin/users/${user.id}/intelligence`)}
          className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${G.goldDim}, ${G.gold})`, color: "#0D0A00" }}>
          <BrainCircuit size={12} className="inline mr-2" />
          Full Intel 360
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveLog, setLiveLog] = useState<{ userId: string; events: any[] }[]>([]);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ["admin-users-intel", stageFilter, debouncedSearch],
    queryFn: () => adminApi.getUsersWithIntelligence({ stage: stageFilter, search: debouncedSearch, limit: 100 }),
    refetchInterval: 30000,
  });

  const users: any[] = res?.data || [];

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;
    socket.emit("join_admin");

    const handleLiveEvent = (ev: any) => {
      const uid = ev.payload?.userId || ev.actor;
      if (!uid || uid === "SYSTEM" || uid === "GUEST") return;

      const newEv = { ...ev, occurredAt: ev.occurredAt || new Date().toISOString(), id: ev.id || Date.now().toString() };

      // Update selected user live feed
      if (selectedUser?.id === uid) {
        setLiveEvents((prev) => [newEv, ...prev].slice(0, 20));
      }

      // Update live log per user
      setLiveLog((prev) => {
        const existing = prev.find((l) => l.userId === uid);
        if (existing) {
          return prev.map((l) => l.userId === uid ? { ...l, events: [newEv, ...l.events].slice(0, 10) } : l);
        }
        return [{ userId: uid, events: [newEv] }, ...prev].slice(0, 50);
      });

      setRealtimeTick((t) => t + 1);
      // Refresh user list data after a short delay
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin-users-intel"] }), 2000);
    };

    socket.on("upis:live_event", handleLiveEvent);
    return () => { socket.off("upis:live_event", handleLiveEvent); };
  }, [socket, selectedUser]);

  // Reset live events when user changes
  useEffect(() => { setLiveEvents([]); }, [selectedUser?.id]);

  const stages = ["all", "HIGH_VALUE", "LOYAL", "ACTIVE", "INTERESTED", "AT_RISK", "NEW"];

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: G.gold },
    { label: "High Value", value: users.filter((u) => u.intelligence?.lifecycleStage === "HIGH_VALUE").length, icon: Crown, color: G.goldLight },
    { label: "At Risk", value: users.filter((u) => u.intelligence?.lifecycleStage === "AT_RISK").length, icon: AlertTriangle, color: G.red },
    { label: "Active Now", value: realtimeTick, icon: Zap, color: G.green },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: G.bg, color: G.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${G.border}` }}>
        <div>
          <h1 className="text-xl font-black uppercase italic tracking-tight" style={{ color: G.goldLight }}>
            Intelligence <span style={{ color: G.muted }}>Registry</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em] font-bold mt-0.5" style={{ color: G.goldDim }}>
            User Lifecycle & Behavioral Surveillance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {realtimeTick > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-full font-bold"
              style={{ background: "rgba(5,150,105,0.10)", color: G.green, border: `1px solid rgba(5,150,105,0.25)` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {realtimeTick} live events
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => { setRealtimeTick(0); refetch(); }}
            className="text-[10px] font-bold uppercase"
            style={{ color: G.muted, borderColor: G.border, background: G.surface }}>
            <RefreshCcw size={12} className={cn("mr-1", isLoading && "animate-spin")} />
            Sync
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-0" style={{ borderBottom: `1px solid ${G.border}` }}>
        {stats.map((s, i) => (
          <div key={i} className="p-4 flex items-center gap-3"
            style={{ borderRight: i < 3 ? `1px solid ${G.border}` : "none" }}>
            <div className="p-2 rounded-xl" style={{ background: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-black font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase font-bold" style={{ color: G.muted }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: G.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs font-mono outline-none"
            style={{ background: G.card, border: `1px solid ${G.border}`, color: G.text }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {stages.map((s) => {
            const cfg = STAGE_CONFIG[s];
            const active = stageFilter === s;
            return (
              <button key={s} onClick={() => setStageFilter(s)}
                className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all"
                style={{
                  background: active ? (cfg?.bg || "rgba(201,168,76,0.15)") : "transparent",
                  color: active ? (cfg?.color || G.gold) : G.muted,
                  border: `1px solid ${active ? (cfg?.color || G.gold) : G.border}`,
                }}>
                {s === "all" ? "ALL" : (STAGE_CONFIG[s]?.label || s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content: List + Detail Panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Users List */}
        <div className="flex flex-col overflow-hidden" style={{ width: selectedUser ? "380px" : "100%", borderRight: selectedUser ? `1px solid ${G.border}` : "none", flexShrink: 0 }}>
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${G.border}`, background: G.surface }}>
            <p className="text-[10px] font-black uppercase" style={{ color: G.goldDim }}>
              {users.length} Subject{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${G.border}` }}>
                  <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: G.card }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded animate-pulse w-32" style={{ background: G.card }} />
                    <div className="h-2 rounded animate-pulse w-24" style={{ background: G.card }} />
                  </div>
                </div>
              ))
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Users size={32} style={{ color: G.goldDim }} />
                <p className="text-xs font-bold uppercase" style={{ color: G.muted }}>No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUser?.id === user.id}
                  onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedUser && (
          <div className="flex-1 overflow-hidden" style={{ background: G.surface }}>
            <UserDetailPanel
              user={selectedUser}
              liveEvents={liveEvents}
            />
          </div>
        )}

        {/* No selection state */}
        {!selectedUser && !isLoading && users.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 absolute right-0 bottom-0 top-64 left-96 pointer-events-none">
            {/* intentionally empty - list takes full width */}
          </div>
        )}
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
