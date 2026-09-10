import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/services/adminApi';
import { Card, PageHeader } from '@/components/admin-shell';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { Search, PackageOpen, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/inventory')({
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', 'inventory'],
    queryFn: () => adminApi.getProducts({ limit: 200 }),
  });

  const products = data?.data?.products || [];

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock <= 0) return 'OUT_OF_STOCK';
    if (stock <= (threshold || 5)) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const stats = useMemo(() => {
    return products.reduce((acc: any, p: any) => {
      acc.total++;
      const status = getStockStatus(p.stock, p.lowStockThreshold);
      if (status === 'IN_STOCK') acc.inStock++;
      if (status === 'LOW_STOCK') acc.lowStock++;
      if (status === 'OUT_OF_STOCK') acc.outOfStock++;
      return acc;
    }, { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p: any) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    if (filterTab !== 'ALL') {
      result = result.filter((p: any) => getStockStatus(p.stock, p.lowStockThreshold) === filterTab);
    }
    
    // Sort: OUT_OF_STOCK > LOW_STOCK > IN_STOCK
    return result.sort((a: any, b: any) => {
      const val = { 'OUT_OF_STOCK': 0, 'LOW_STOCK': 1, 'IN_STOCK': 2 };
      const statusA = getStockStatus(a.stock, a.lowStockThreshold);
      const statusB = getStockStatus(b.stock, b.lowStockThreshold);
      return val[statusA] - val[statusB];
    });
  }, [products, search, filterTab]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory Tracking" 
        description="Monitor stock levels across all your products"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total SKUs" value={stats.total} icon={<PackageOpen className="text-ink-500" />} />
        <StatCard title="In Stock" value={stats.inStock} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Low Stock" value={stats.lowStock} icon={<AlertTriangle className="text-amber-500" />} />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={<XCircle className="text-red-500" />} />
      </div>

      <Card className="p-4 border-ink-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2 p-1 bg-ink-100 rounded-md">
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  filterTab === tab ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input 
              placeholder="Search inventory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-ink-500">Loading inventory...</div>
        ) : (
          <div className="rounded-md border border-ink-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-cream-50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Low Threshold</TableHead>
                  <TableHead className="w-[200px]">Quick Adjust Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((product: any) => (
                  <InventoryRow key={product.id} product={product} />
                ))}
                {filteredAndSorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-ink-500">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="p-4 border-ink-200 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink-500">{title}</p>
        <p className="text-2xl font-bold text-ink-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-cream-100 rounded-full">
        {icon}
      </div>
    </Card>
  );
}

function InventoryRow({ product }: { product: any }) {
  const queryClient = useQueryClient();
  const [stock, setStock] = useState(product.stock);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if product changes externally
  useEffect(() => {
    setStock(product.stock);
  }, [product.stock]);

  const updateMutation = useMutation({
    mutationFn: (newStock: number) => adminApi.updateProduct(product.id, { stock: newStock }),
    onSuccess: () => {
      toast.success(`Stock updated for ${product.name}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'inventory'] });
      setIsUpdating(false);
    },
    onError: () => {
      toast.error('Failed to update stock');
      setStock(product.stock); // Revert
      setIsUpdating(false);
    }
  });

  const handleUpdate = () => {
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) return toast.error('Invalid stock number');
    if (numStock === product.stock) return;
    
    setIsUpdating(true);
    updateMutation.mutate(numStock);
  };

  const getStatusBadge = () => {
    if (product.stock <= 0) return <Badge variant="outline" className="border-red-500 bg-red-50 text-red-700">Out of Stock</Badge>;
    if (product.stock <= (product.lowStockThreshold || 5)) return <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700">Low Stock</Badge>;
    return <Badge variant="outline" className="border-emerald-500 bg-emerald-50 text-emerald-700">In Stock</Badge>;
  };

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-ink-900">{product.name}</p>
        <p className="text-xs text-ink-500">{product.sku}</p>
      </TableCell>
      <TableCell className="text-ink-600">{product.category?.name || '-'}</TableCell>
      <TableCell>₹{product.sellingPrice}</TableCell>
      <TableCell>{getStatusBadge()}</TableCell>
      <TableCell className="text-ink-600">{product.lowStockThreshold || 5}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            min="0" 
            className="w-20 h-8"
            value={stock} 
            onChange={e => setStock(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            disabled={isUpdating}
          />
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-2 bg-gold-50 hover:bg-gold-100 text-gold-900 border-gold-200"
            onClick={handleUpdate}
            disabled={isUpdating || Number(stock) === product.stock}
          >
            {isUpdating ? '...' : 'Save'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
