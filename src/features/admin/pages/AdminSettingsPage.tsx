import { useState, useEffect } from "react";
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  Palette, 
  FileText, 
  Save, 
  RefreshCcw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { adminApi } from "../services/adminApi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getBusinessConfig();
      setConfig(response.data || getDefaultConfig());
    } catch (error) {
      toast.error("Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultConfig = () => ({
    businessName: "Triveni 1 Gram",
    email: "triveni1gram@gmail.com",
    phone: "+91 75738 33682",
    gstin: "",
    registeredAddress: { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" },
    brandColorPrimary: "#D4AF37",
    brandColorSecondary: "#1A1A1A",
    jurisdiction: "Gujarat",
    returnPolicyDays: 7
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateBusinessConfig(config);
      toast.success("System configuration updated successfully", {
        description: "All changes are now active across the platform.",
        icon: <Zap className="w-4 h-4 text-amber-500" />
      });
    } catch (error) {
      toast.error("Failed to update configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedField = (path: string, value: any) => {
    const newConfig = { ...config };
    const parts = path.split('.');
    let current = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    setConfig(newConfig);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
            Control <span className="text-indigo-500">Center</span>
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">
            Global System Variables & Authority Protocols
          </p>
        </div>
        <Button 
          disabled={isSaving} 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-500/20"
        >
          {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          COMMIT_CHANGES
        </Button>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-auto border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="identity" className="px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2 text-indigo-500" /> Identity
          </TabsTrigger>
          <TabsTrigger value="branding" className="px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-2 text-amber-500" /> Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" /> Security
          </TabsTrigger>
          <TabsTrigger value="compliance" className="px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4 mr-2 text-rose-500" /> Compliance
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="identity" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Building2 size={80} />
                   </div>
                  <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Entity Information</CardTitle>
                    <CardDescription>Primary business details and communication nodes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Legal Name</Label>
                       <Input 
                        value={config.businessName} 
                        onChange={(e) => setConfig({...config, businessName: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-950 font-medium"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Mail_Node</Label>
                          <Input 
                            value={config.email} 
                            onChange={(e) => setConfig({...config, email: e.target.value})}
                          />
                       </div>
                       <div className="grid gap-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Comms_Node</Label>
                          <Input 
                            value={config.phone} 
                            onChange={(e) => setConfig({...config, phone: e.target.value})}
                          />
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Operational Hub</CardTitle>
                    <CardDescription>Registered headquarters and tax geography.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Address Line 1</Label>
                       <Input 
                        value={config.registeredAddress.line1} 
                        onChange={(e) => updateNestedField('registeredAddress.line1', e.target.value)}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">City</Label>
                          <Input 
                            value={config.registeredAddress.city} 
                            onChange={(e) => updateNestedField('registeredAddress.city', e.target.value)}
                          />
                       </div>
                       <div className="grid gap-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">State</Label>
                          <Input 
                            value={config.registeredAddress.state} 
                            onChange={(e) => updateNestedField('registeredAddress.state', e.target.value)}
                          />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="branding" className="mt-6 text-slate-900 dark:text-white">
             <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Visual Identity Core</CardTitle>
                  <CardDescription>Define the aesthetic parameters of the Triveni experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-6">
                      <div 
                        className="w-24 h-24 rounded-2xl border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: config.brandColorPrimary }}
                       >
                         <span className="text-xs font-black text-white mix-blend-difference uppercase tracking-tighter">Preview</span>
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Primary Branding Color (HEX)</Label>
                            <div className="flex gap-2">
                               <Input 
                                  value={config.brandColorPrimary} 
                                  onChange={(e) => setConfig({...config, brandColorPrimary: e.target.value})}
                                  className="font-mono uppercase"
                               />
                               <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                                  <input 
                                    type="color" 
                                    className="w-full h-full cursor-pointer scale-150"
                                    value={config.brandColorPrimary}
                                    onChange={(e) => setConfig({...config, brandColorPrimary: e.target.value})}
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
             <Card className="bg-white border-indigo-500/20 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                <CardHeader>
                  <CardTitle className="text-xl font-normal tracking-tight flex items-center gap-3">
                     <ShieldCheck className="text-emerald-500" /> AUTH_PROTOCOL_SECURE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="p-4 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">HTTP_ONLY_COOKIES</span>
                         </div>
                         <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0 uppercase text-[9px]">Enforced</Badge>
                      </div>
                      <Separator className="bg-slate-200 dark:bg-slate-800" />
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">JWT_REFRESH_ROTATION</span>
                         </div>
                         <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0 uppercase text-[9px]">Active</Badge>
                      </div>
                   </div>
                   
                   <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                      Security parameters are currently locked to Global Kernel Standards. 
                      To modify JWT_EXPIRY or CORS_ORIGIN, please contact the System Administrator or modify environmental variables directly.
                   </p>
                </CardContent>
             </Card>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
