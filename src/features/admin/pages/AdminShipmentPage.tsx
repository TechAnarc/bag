import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import { 
    Truck, 
    ShieldCheck, 
    Activity, 
    ArrowUpRight, 
    Package, 
    Globe, 
    Zap, 
    BarChart3,
    Settings2,
    Search,
    Plus,
    ExternalLink,
    MapPin,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function AdminShipmentPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: partners, isLoading } = useQuery({
        queryKey: ["admin-logistics-partners"],
        queryFn: async () => {
            const response = await adminApi.getLogisticsPartners();
            return response.data;
        },
    });

    const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();
    const theme = outletContext?.theme || 'dark';

    const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
    const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
    const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";

    const getReliabilityColor = (score: number) => {
        if (score >= 0.95) return "text-emerald-500";
        if (score >= 0.90) return "text-amber-500";
        return "text-red-500";
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "DOMESTIC": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Domestic</Badge>;
            case "INTERNATIONAL": return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20"><Globe className="w-3 h-3 mr-1" /> International</Badge>;
            case "HYPERLOCAL": return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20"><Zap className="w-3 h-3 mr-1" /> Hyperlocal</Badge>;
            case "AGGREGATOR": return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Aggregator</Badge>;
            default: return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn("text-3xl font-bold flex items-center gap-3", textPrimary)}>
                        <Truck className="w-8 h-8 text-blue-500" />
                        Logistics Partner Network
                    </h1>
                    <p className={textSecondary}>Manage 15+ tier-1 delivery partners and cognitive routing performance.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Add Logistics Partner
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-xs font-medium uppercase", textSecondary)}>Active Carriers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", textPrimary)}>{partners?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-xs font-medium uppercase", textSecondary)}>Avg Reliability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">94.8%</div>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-xs font-medium uppercase", textSecondary)}>Express Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">82%</div>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader className="pb-2">
                        <CardTitle className={cn("text-xs font-medium uppercase", textSecondary)}>Active Shipments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", textPrimary)}>1,284</div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
                <Input 
                    placeholder="Search Partners by Name, Code or Type..." 
                    className={cn("pl-10", inputBg, textPrimary)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card className={cn(bgCard, "bg-opacity-40 backdrop-blur-xl overflow-hidden")}>
                <Table>
                    <TableHeader className={theme === 'dark' ? "bg-slate-900/60" : "bg-slate-50"}>
                        <TableRow className={cn("hover:bg-transparent", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                            <TableHead className={textSecondary}>Partner</TableHead>
                            <TableHead className={textSecondary}>Type</TableHead>
                            <TableHead className={textSecondary}>Capabilities</TableHead>
                            <TableHead className={textSecondary}>Reliability Score</TableHead>
                            <TableHead className={textSecondary}>Status</TableHead>
                            <TableHead className={cn("text-right", textSecondary)}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Truck className="w-8 h-8 animate-bounce mx-auto text-blue-500 mb-2" />
                                    <p className={textSecondary}>Scanning logistics network...</p>
                                </TableCell>
                            </TableRow>
                        ) : partners?.filter((p: any) => 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((partner: any) => (
                            <TableRow key={partner.id} className={cn("transition-colors", theme === 'dark' ? "border-slate-800 hover:bg-slate-900/40" : "border-slate-100 hover:bg-slate-50")}>
                                <TableCell>
                                    <div className={cn("font-bold", textPrimary)}>{partner.name}</div>
                                    <div className={cn("text-[10px] font-mono tracking-tighter", textSecondary)}>{partner.code}</div>
                                </TableCell>
                                <TableCell>
                                    {getTypeBadge(partner.type)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {Object.entries(partner.capabilities).map(([key, value]) => value ? (
                                            <Badge key={key} variant="outline" className={cn("text-[9px] capitalize whitespace-nowrap", theme === 'dark' ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500")}>
                                                {key}
                                            </Badge>
                                        ) : null)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className={cn("w-4 h-4", getReliabilityColor(partner.reliabilityScore))} />
                                        <span className={cn("font-bold", getReliabilityColor(partner.reliabilityScore))}>
                                            {(partner.reliabilityScore * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={partner.isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}>
                                        {partner.isActive ? "Operational" : "Offline"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 text-blue-500">
                                            <Activity className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", theme === 'dark' ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={bgCard}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                            <MapPin className="w-5 h-5 text-indigo-400" /> Regional Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={cn("h-48 flex items-center justify-center border-t", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                         <div className="text-center">
                            <Globe className={cn("w-12 h-12 mx-auto mb-2 opacity-20", theme === 'dark' ? "text-slate-100" : "text-slate-800")} />
                            <p className={cn("text-sm italic", textSecondary)}>Spatial coverage map initializing...</p>
                         </div>
                    </CardContent>
                </Card>
                <Card className={bgCard}>
                    <CardHeader>
                        <CardTitle className={cn("text-lg flex items-center gap-2", textPrimary)}>
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Cognitive Remediation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={cn("p-4 m-4 rounded-lg border", theme === 'dark' ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200")}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className={cn("font-mono italic", textSecondary)}>SLA_REMEDIATION_ACTIVE</span>
                                <Badge className="bg-amber-500/10 text-amber-500 border-none">Auto-Enforced</Badge>
                            </div>
                            <div className={cn("h-2 w-full rounded-full overflow-hidden", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                                <div className="h-full bg-amber-500 w-[65%]" />
                            </div>
                            <p className={cn("text-[10px]", textSecondary)}>
                                ADE is currently re-routing 12 orders due to delays in North Hub.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
