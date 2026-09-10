import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { 
    Activity, 
    Filter, 
    RefreshCcw, 
    ShieldAlert, 
    Terminal, 
    AlertCircle, 
    CheckCircle2, 
    XCircle,
    User,
    ShoppingCart as OrderIcon,
    ChevronRight,
    Search,
    BrainCircuit,
    Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminDecisionStreamPage() {
    const queryClient = useQueryClient();
    const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();
    const theme = outletContext?.theme || 'dark';

    const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
    const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
    const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";
    const inputBgDeep = theme === 'dark' ? "bg-slate-950/50 border-slate-800" : "bg-slate-100 border-slate-200";

    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["admin-decision-stream", filterCategory, filterStatus],
        queryFn: async () => {
            const params: any = {};
            if (filterCategory !== "all") params.category = filterCategory;
            if (filterStatus !== "all") params.status = filterStatus;
            const response = await adminApi.getDecisionStream(params);
            return response.data;
        },
        refetchInterval: 10000, // Real-time feed simulation
    });

    const overrideMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => 
            adminApi.overrideDecision(id, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-decision-stream"] });
            toast.success("Autonomous decision successfully overridden by Supervisor.");
        },
        onError: () => toast.error("Failed to override decision."),
    });

    const handleOverride = (id: string) => {
        const reason = window.prompt("Enter reason for manual override:");
        if (reason) {
            overrideMutation.mutate({ id, reason });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "EXECUTED": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Executed</Badge>;
            case "PENDING": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><RefreshCcw className="w-3 h-3 mr-1 animate-spin" /> Pending</Badge>;
            case "FAILED": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
            case "OVERRIDDEN": return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20"><ShieldAlert className="w-3 h-3 mr-1" /> Overridden</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "RISK": return <ShieldAlert className="w-4 h-4 text-red-500" />;
            case "EXPERIENCE": return <BrainCircuit className="w-4 h-4 text-indigo-500" />;
            case "SLA": return <Activity className="w-4 h-4 text-amber-500" />;
            case "LOGISTICS": return <Truck className="w-4 h-4 text-sky-500" />;
            default: return <Terminal className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn("text-3xl font-bold flex items-center gap-3", textPrimary)}>
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Autonomous Decision Stream
                    </h1>
                    <p className={textSecondary}>Live cognitive feed of TRIVENI-OS-1 system interventions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </Button>
                    <Badge variant="outline" className="px-3 py-1 bg-indigo-500/5 text-indigo-400 border-indigo-500/20 animate-pulse">
                        ● LIVE TRANSMISSION
                    </Badge>
                </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border backdrop-blur-sm", theme === 'dark' ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm")}>
                <div className="relative">
                    <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
                    <Input 
                        placeholder="Search Decision ID or Entity..." 
                        className={cn("pl-9", inputBg, textPrimary)}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className={cn(inputBg, textPrimary)}>
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className={cn(bgCard, textPrimary)}>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="RISK">Risk & Trust</SelectItem>
                        <SelectItem value="EXPERIENCE">Customer Experience</SelectItem>
                        <SelectItem value="SLA">SLA & Performance</SelectItem>
                        <SelectItem value="LOGISTICS">Logistics Autonomy</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className={cn(inputBg, textPrimary)}>
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className={cn(bgCard, textPrimary)}>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="EXECUTED">Executed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="OVERRIDDEN">Overridden</SelectItem>
                    </SelectContent>
                </Select>
                <div className={cn("flex items-center gap-2 px-2 text-xs font-mono", textSecondary)}>
                    <Terminal className="w-3 h-3" />
                    SYSTEM_STATUS: NOMINAL
                </div>
            </div>

            <Card className={cn("overflow-hidden backdrop-blur-xl shadow-2xl", bgCard)}>
                <Table>
                    <TableHeader className={theme === 'dark' ? "bg-slate-900/60" : "bg-slate-50"}>
                        <TableRow className={cn("hover:bg-transparent", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                            <TableHead className={cn("w-[100px]", textSecondary)}>ID</TableHead>
                            <TableHead className={textSecondary}>Cognitive Action</TableHead>
                            <TableHead className={textSecondary}>Entity Context</TableHead>
                            <TableHead className={textSecondary}>Trigger Signal</TableHead>
                            <TableHead className={textSecondary}>Confidence</TableHead>
                            <TableHead className={textSecondary}>Status</TableHead>
                            <TableHead className={cn("text-right", textSecondary)}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
                                        <p className="text-slate-400 font-mono text-sm">DECRYPTING_SIGNAL_STREAM...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                    No autonomous activity recorded in this sector.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.filter((d: any) => 
                                d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                d.entityId?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((decision: any) => (
                                <TableRow key={decision.id} className={cn("group transition-colors", theme === 'dark' ? "border-slate-800 hover:bg-slate-900/30" : "border-slate-100 hover:bg-slate-50")}>
                                    <TableCell className={cn("font-mono text-[10px]", textSecondary)}>
                                        {decision.id.split('-')[0]}...
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getCategoryIcon(decision.triggerSignal)}
                                            <span className={cn("font-medium", textPrimary)}>{decision.actionTaken}</span>
                                        </div>
                                        <div className={cn("text-[10px] italic mt-0.5", textSecondary)}>
                                            v{decision.policyVersion} - {decision.policy?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs">
                                            {decision.entityType === 'USER' ? (
                                                <User className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                                <OrderIcon className="w-3 h-3 text-amber-400" />
                                            )}
                                            <span className={cn("font-mono italic", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>{decision.entityId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="text-[9px] w-fit font-mono py-0 text-slate-400 border-slate-700">
                                                SIG: {decision.triggerSignal}
                                            </Badge>
                                            <div className="text-[8px] text-slate-500 font-mono truncate max-w-[120px]">
                                                {JSON.stringify(decision.triggerPayload).slice(0, 50)}...
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-12 h-1 rounded-full overflow-hidden", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                                                    style={{ width: `${decision.confidenceScore * 100}%` }} 
                                                />
                                            </div>
                                            <span className={cn("text-[10px] font-mono", textSecondary)}>
                                                {(decision.confidenceScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(decision.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400"
                                                onClick={() => handleOverride(decision.id)}
                                                disabled={decision.status === 'OVERRIDDEN' || decision.status === 'FAILED'}
                                                title="Manual Override"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-slate-800 text-slate-400"
                                                title="View Decision Trace"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", textSecondary)}>
                            Total System Actions
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", textPrimary)}>{data?.length || 0}</div>
                        <p className={cn("text-[10px] mt-1", textSecondary)}>+12% from previous cycle</p>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", textSecondary)}>
                            Autonomy Efficiency
                            <BrainCircuit className="w-4 h-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", textPrimary)}>94.2%</div>
                        <p className={cn("text-[10px] mt-1", textSecondary)}>SLA failure reduction metric</p>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", textSecondary)}>
                            Governance Rate
                            <ShieldAlert className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", textPrimary)}>
                            {data?.filter((d: any) => d.status === 'OVERRIDDEN').length || 0}
                        </div>
                        <p className={cn("text-[10px] mt-1", textSecondary)}>Manual overrides required</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
