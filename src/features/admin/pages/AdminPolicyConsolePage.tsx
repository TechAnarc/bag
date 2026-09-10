import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { 
    ShieldCheck, 
    Settings2, 
    Power, 
    ArrowUpRight, 
    BrainCircuit, 
    ShieldAlert, 
    Activity, 
    Truck,
    Info,
    Edit3,
    History,
    Save,
    ChevronRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminPolicyConsolePage() {
    const queryClient = useQueryClient();
    const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();
    const theme = outletContext?.theme || 'dark';

    const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
    const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
    const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";
    const inputBgDeep = theme === 'dark' ? "bg-slate-950/40 border-slate-800" : "bg-slate-100 border-slate-200";

    const [searchQuery, setSearchQuery] = useState("");

    const { data: policies, isLoading } = useQuery({
        queryKey: ["admin-policies"],
        queryFn: async () => {
            const response = await adminApi.getPolicies();
            return response.data;
        },
    });

    const updatePolicyMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => 
            adminApi.updatePolicy(id, data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-policies"] });
            toast.success(`Policy ${res.data.name} updated to version ${res.data.version}.`);
        },
        onError: () => toast.error("Failed to update policy configuration."),
    });

    const togglePolicy = (id: string, currentStatus: boolean) => {
        updatePolicyMutation.mutate({ id, data: { isActive: !currentStatus } });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "RISK": return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case "EXPERIENCE": return <BrainCircuit className="w-5 h-5 text-indigo-500" />;
            case "SLA": return <Activity className="w-5 h-5 text-amber-500" />;
            case "LOGISTICS": return <Truck className="w-5 h-5 text-sky-500" />;
            default: return <Settings2 className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn("text-3xl font-bold flex items-center gap-3", textPrimary)}>
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        Autonomous Policy Control Panel
                    </h1>
                    <p className={textSecondary}>Govern the deterministic logic and cognitive thresholds of TRIVENI-OS-1.</p>
                </div>
                <div className={cn("flex items-center gap-4 p-2 rounded-lg border", theme === 'dark' ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200")}>
                    <div className={cn("flex flex-col items-end pr-4 border-r", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                        <span className={cn("text-[10px] font-mono", textSecondary)}>SYSTEM_GOVERNOR</span>
                        <span className="text-xs font-bold text-emerald-500">ACTIVE_ENFORCEMENT</span>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                         <Save className="w-4 h-4" /> Deploy Global Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={inputBgDeep}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium", textSecondary)}>Active Policies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold", textPrimary)}>
                            {policies?.filter((p: any) => p.isActive).length} / {policies?.length || 0}
                        </div>
                        <div className={cn("mt-4 h-1.5 w-full rounded-full overflow-hidden", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                            <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${(policies?.filter((p: any) => p.isActive).length / policies?.length) * 100}%` }} 
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className={inputBgDeep}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium", textSecondary)}>Confidence Threshold</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold", textPrimary)}>85%</div>
                        <p className={cn("text-xs mt-1", textSecondary)}>Global minimum for autonomous execution</p>
                    </CardContent>
                </Card>
                <Card className={inputBgDeep}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-sm font-medium", textSecondary)}>Policy Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold italic", textPrimary)}>v1.2.0-Alpha</div>
                        <p className={cn("text-xs mt-1", textSecondary)}>Last synchronized: {new Date().toLocaleTimeString()}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
                <Input 
                    placeholder="Search Policies by Name or Category..." 
                    className={cn("pl-10 h-12", inputBg, textPrimary)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    <div className="col-span-2 h-64 flex items-center justify-center">
                        <BrainCircuit className="w-12 h-12 animate-pulse text-emerald-500" />
                    </div>
                ) : policies?.filter((p: any) => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((policy: any) => (
                    <Card key={policy.id} className={cn(
                        "transition-all group overflow-hidden",
                        theme === 'dark' ? "border-slate-800" : "border-slate-200 shadow-sm",
                        policy.isActive ? inputBgDeep : cn("grayscale-[0.5]", theme === 'dark' ? "bg-slate-950/20" : "bg-slate-50")
                    )}>
                        <div className={cn(
                            "h-1.5 w-full",
                            policy.category === 'RISK' ? 'bg-red-500' : 
                            policy.category === 'EXPERIENCE' ? 'bg-indigo-500' :
                            policy.category === 'SLA' ? 'bg-amber-500' : 'bg-sky-500'
                        )} />
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg border", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
                                        {getCategoryIcon(policy.category)}
                                    </div>
                                    <div>
                                        <CardTitle className={cn("text-lg", textPrimary)}>{policy.name.replace(/_/g, ' ')}</CardTitle>
                                        <Badge variant="outline" className={cn("text-[10px] mt-1 font-mono", textSecondary)}>{policy.category}</Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Switch 
                                        checked={policy.isActive} 
                                        onCheckedChange={() => togglePolicy(policy.id, policy.isActive)}
                                    />
                                    <span className={cn("text-[10px] font-mono italic", textSecondary)}>Policy v{policy.version}</span>
                                </div>
                            </div>
                            <CardDescription className={cn("mt-2", textSecondary)}>
                                {policy.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={cn("p-3 rounded-lg border", theme === 'dark' ? "bg-slate-950/80 border-slate-800/50" : "bg-slate-50 border-slate-200")}>
                                <h4 className={cn("text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2", textSecondary)}>
                                    <Settings2 className="w-3 h-3" /> Codified Rules
                                </h4>
                                <div className={cn("font-mono text-xs p-2 rounded", theme === 'dark' ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700")}>
                                    <span className="opacity-50">IF </span> 
                                    {policy.rules.condition} 
                                    <span className="opacity-50"> THEN</span> {policy.rules.action}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className={cn("p-3 rounded-lg border", theme === 'dark' ? "bg-slate-950/80 border-slate-800/50" : "bg-slate-50 border-slate-200")}>
                                    <h4 className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", textSecondary)}>Threshold</h4>
                                    <div className={cn("text-sm font-mono truncate", textPrimary)}>
                                        {JSON.stringify(policy.thresholds)}
                                    </div>
                                </div>
                                <div className={cn("p-3 rounded-lg border", theme === 'dark' ? "bg-slate-950/80 border-slate-800/50" : "bg-slate-50 border-slate-200")}>
                                    <h4 className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", textSecondary)}>Priority</h4>
                                    <div className={cn("text-sm font-mono", textPrimary)}>{policy.priority}</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className={cn("flex justify-between border-t", theme === 'dark' ? "bg-slate-900/40 border-slate-800/50" : "bg-slate-50/50 border-slate-100")}>
                            <div className={cn("flex items-center gap-2 text-[10px]", textSecondary)}>
                                <History className="w-3 h-3" />
                                Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                            </div>
                            <Button variant="ghost" size="sm" className={cn("text-xs gap-1", theme === 'dark' ? "hover:text-emerald-400" : "hover:text-emerald-600 font-bold")}>
                                <Edit3 className="w-3 h-3" /> Edit Intelligence
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className={cn(theme === 'dark' ? "bg-indigo-500/5 border-indigo-500/20" : "bg-indigo-50 border-indigo-200 shadow-sm")}>
                <CardContent className="p-6 flex items-start gap-4">
                    <Info className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className={cn("font-bold", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")}>Governance Law — Phase 3</h4>
                        <p className={cn("text-sm mt-1", textSecondary)}>
                            Autonomous actions are executed only when the signal confidence exceeds the global threshold. 
                            Manual overrides feed directly back into policy tuning (Cognitive Reinforcement).
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
