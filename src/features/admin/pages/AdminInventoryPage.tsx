import { useEffect, useMemo, useState } from "react";
import { Package, AlertTriangle, ArrowUpRight, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useOutletContext } from "react-router-dom";
import { adminAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type InventoryJson = {
  quantity?: number;
  inStock?: boolean;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  status: string;
  category?: { name: string };
  inventory?: InventoryJson | null;
};

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const response = await adminAPI.getProducts({ page: 1, limit: 200, search });
        const data = response.data?.data?.products || [];
        setProducts(data);
      } catch (err) {
        // In Phase 5 we avoid noisy toasts here – inventory remains calm but powerful.
        console.error("Failed to load inventory", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [search]);

  const annotate = (product: InventoryProduct) => {
    const inv = (product.inventory || {}) as InventoryJson;
    const quantity = typeof inv.quantity === "number" ? inv.quantity : 0;
    const inStockFlag =
      typeof inv.inStock === "boolean"
        ? inv.inStock
        : quantity > 0;

    let stockStatus: StockFilter = "IN_STOCK";
    if (!inStockFlag || quantity <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (quantity > 0 && quantity <= 5) {
      stockStatus = "LOW_STOCK";
    }

    return { quantity, inStockFlag, stockStatus };
  };

  const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();
  const theme = outletContext?.theme || 'dark';

  const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
  const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
  const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";

  const { totalSkus, inStockCount, lowStockCount, outOfStockCount } = useMemo(() => {
    const annotated = products.map(annotate);
    return {
      totalSkus: products.length,
      inStockCount: annotated.filter((p) => p.stockStatus === "IN_STOCK").length,
      lowStockCount: annotated.filter((p) => p.stockStatus === "LOW_STOCK").length,
      outOfStockCount: annotated.filter((p) => p.stockStatus === "OUT_OF_STOCK").length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .map((p) => ({ ...p, _meta: annotate(p) }))
      .filter((p) => {
        if (stockFilter !== "ALL" && p._meta.stockStatus !== stockFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.category?.name || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Show most critical stock first: out-of-stock, then low, then others.
        const priority = (s: StockFilter) =>
          s === "OUT_OF_STOCK" ? 0 : s === "LOW_STOCK" ? 1 : 2;
        return priority(a._meta.stockStatus) - priority(b._meta.stockStatus);
      });
  }, [products, search, stockFilter]);

  const stockBadge = (status: StockFilter) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <Badge variant="outline" className="border-red-500/40 text-red-600 bg-red-500/5 text-[10px]">
            Out of Stock
          </Badge>
        );
      case "LOW_STOCK":
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5 text-[10px]">
            Low Stock
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/5 text-[10px]">
            In Stock
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className={cn("text-3xl font-bold mb-2", textPrimary)}>Inventory Command</h1>
        <p className={textSecondary}>
          Live view of stock posture across the catalog – optimized for calm, decisive action.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn("shadow-xl", theme === 'dark' ? "bg-indigo-950/20 border-indigo-500/20 text-white" : "bg-white border-slate-200 text-slate-900")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-70">
              Total SKUs
              <Package className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{totalSkus}</p>
            <p className={cn("text-[10px] mt-1 opacity-60", textSecondary)}>Active catalogue footprint</p>
          </CardContent>
        </Card>

        <Card className={bgCard}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-[10px] uppercase tracking-[0.2em]", textSecondary)}>
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {inStockCount}
            </p>
            <p className={cn("text-[10px] mt-1", textSecondary)}>Healthy nodes</p>
          </CardContent>
        </Card>

        <Card className={bgCard}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-[10px] uppercase tracking-[0.2em]", textSecondary)}>
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              {lowStockCount}
            </p>
            <p className={cn("text-[10px] mt-1", textSecondary)}>Watchlist before campaigns</p>
          </CardContent>
        </Card>

        <Card className={bgCard}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("flex items-center justify-between text-[10px] uppercase tracking-[0.2em]", textSecondary)}>
              Out of Stock
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {outOfStockCount}
            </p>
            <p className={cn("text-[10px] mt-1", textSecondary)}>Immediate attention required</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={bgCard}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className={textPrimary}>Inventory Streams</span>
            <CardDescription className={cn("text-xs", textSecondary)}>
              Filter by SKU, category, or stock posture.
            </CardDescription>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, or category..."
                className={cn("pl-9", inputBg, textPrimary)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className={cn("w-4 h-4", textSecondary)} />
              {(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as StockFilter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={stockFilter === f ? "default" : "outline"}
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.15em]",
                    stockFilter === f
                      ? "bg-indigo-600 text-white"
                      : cn("border-slate-200 dark:border-slate-700", textSecondary)
                  )}
                  onClick={() => setStockFilter(f)}
                >
                  {f === "ALL" ? "All" : f.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className={cn("border rounded-xl overflow-hidden", theme === 'dark' ? "border-slate-800" : "border-slate-100 shadow-sm")}>
              <Table>
                <TableHeader className={theme === 'dark' ? "bg-slate-900/60" : "bg-slate-50"}>
                  <TableRow className="border-none">
                    <TableHead className={cn("text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      SKU / Product
                    </TableHead>
                    <TableHead className={cn("text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      Category
                    </TableHead>
                    <TableHead className={cn("text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      Price
                    </TableHead>
                    <TableHead className={cn("text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      Quantity
                    </TableHead>
                    <TableHead className={cn("text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      Posture
                    </TableHead>
                    <TableHead className={cn("text-right text-[10px] uppercase tracking-[0.16em]", textSecondary)}>
                      Navigate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className={cn("text-center py-10 text-sm", textSecondary)}>
                        No inventory streams match this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className={cn("transition-colors", theme === 'dark' ? "border-slate-800 hover:bg-slate-900/40" : "border-slate-100 hover:bg-slate-50")}>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className={cn("text-xs font-bold", textPrimary)}>
                              {product.name}
                            </span>
                            <span className={cn("text-[9px] font-mono", textSecondary)}>
                              SKU: {product.sku || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          <span className={theme === 'dark' ? "text-slate-300" : "text-slate-600"}>
                            {product.category?.name || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={cn("text-xs font-semibold", textPrimary)}>
                            ₹{product.price.toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono">
                          {annotate(product).quantity ?? 0}
                        </TableCell>
                        <TableCell className="py-3">
                          {stockBadge(annotate(product).stockStatus)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 hover:text-indigo-500", textSecondary)}
                            asChild
                          >
                            <a href={`/admin/products?productId=${product.id}`}>
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
