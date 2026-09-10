import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/services/adminApi';
import { Card, PageHeader, EmptyState } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Edit, Trash, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/products')({
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin', 'products', page, debouncedSearch, categoryFilter, statusFilter],
    queryFn: () => adminApi.getProducts({
      page,
      limit: 20,
      search: debouncedSearch,
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const products = productsData?.data?.products || [];
  
  const filteredProducts = statusFilter === 'ALL' 
    ? products 
    : products.filter((p: any) => p.status === statusFilter);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Products" 
        description="Manage your bag catalog, pricing, and specifications"
        action={
          <Button onClick={openNewModal} className="bg-gold-500 hover:bg-gold-600 text-ink-900">
            <Plus className="w-4 h-4 mr-2" /> New Product
          </Button>
        }
      />

      <Card className="p-4 border-ink-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categoriesData?.data?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-ink-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState 
            title="No products found" 
            description="Try adjusting your filters or add a new product."
            action={
              <Button onClick={openNewModal} variant="outline">Add Product</Button>
            }
          />
        ) : (
          <div className="rounded-md border border-ink-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-cream-50">
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded bg-cream-100" />
                      ) : (
                        <div className="w-10 h-10 bg-cream-200 rounded flex items-center justify-center text-xs text-ink-400">No Img</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-ink-500">{product.sku}</TableCell>
                    <TableCell>₹{product.sellingPrice}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        product.stock <= 0 ? 'border-red-500 text-red-700' :
                        product.stock <= (product.lowStockThreshold || 5) ? 'border-amber-500 text-amber-700' :
                        'border-emerald-500 text-emerald-700'
                      }>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                        <Edit className="w-4 h-4 text-ink-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-cream-50">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={editingProduct} 
            categories={categoriesData?.data || []}
            onClose={() => setIsModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, categories, onClose }: { product: any, categories: any[], onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    status: product?.status || 'ACTIVE',
    basePrice: product?.basePrice || '',
    sellingPrice: product?.sellingPrice || '',
    ownerPrice: product?.ownerPrice || '',
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    shortTagline: product?.shortTagline || '',
    description: product?.description || '',
    specifications: product?.specifications || {
      material: '',
      capacity: '',
      dimensions: '',
      compartments: '',
      closureType: '',
      strapType: '',
      laptopCompatible: false,
      waterResistant: false,
      color: '',
      weight: '',
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => product ? adminApi.updateProduct(product.id, data) : adminApi.createProduct(data),
    onSuccess: () => {
      toast.success(product ? 'Product updated' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      onClose();
    },
    onError: () => toast.error('Failed to save product')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) return toast.error('Valid selling price is required');
    
    const payload = {
      ...formData,
      basePrice: formData.basePrice ? Number(formData.basePrice) : undefined,
      sellingPrice: Number(formData.sellingPrice),
      ownerPrice: formData.ownerPrice ? Number(formData.ownerPrice) : undefined,
      stock: Number(formData.stock),
      lowStockThreshold: Number(formData.lowStockThreshold),
    };
    
    saveMutation.mutate(payload);
  };

  const handleSpecChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name *</label>
          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU (Auto-generates if empty)</label>
          <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-ink-100 pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Price (MRP) ₹</label>
          <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Price ₹ *</label>
          <Input type="number" required min="1" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Owner Price (Cost) ₹</label>
          <Input type="number" value={formData.ownerPrice} onChange={e => setFormData({...formData, ownerPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock</label>
          <Input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Low Stock Alert At</label>
          <Input type="number" required min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} />
        </div>
      </div>

      <div className="space-y-4 border-t border-ink-100 pt-4">
        <h3 className="font-medium text-ink-900">Bag Attributes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Material</label>
            <Input value={formData.specifications.material} onChange={e => handleSpecChange('material', e.target.value)} placeholder="e.g. Canvas, Leather" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity</label>
            <Input value={formData.specifications.capacity} onChange={e => handleSpecChange('capacity', e.target.value)} placeholder="e.g. 15L" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dimensions</label>
            <Input value={formData.specifications.dimensions} onChange={e => handleSpecChange('dimensions', e.target.value)} placeholder="e.g. 30×20×10 cm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <Input value={formData.specifications.color} onChange={e => handleSpecChange('color', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Weight</label>
            <Input value={formData.specifications.weight} onChange={e => handleSpecChange('weight', e.target.value)} placeholder="e.g. 500g" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compartments</label>
            <Input type="number" value={formData.specifications.compartments} onChange={e => handleSpecChange('compartments', e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Closure Type</label>
            <Select value={formData.specifications.closureType} onValueChange={v => handleSpecChange('closureType', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Zipper">Zipper</SelectItem>
                <SelectItem value="Magnetic">Magnetic</SelectItem>
                <SelectItem value="Buckle">Buckle</SelectItem>
                <SelectItem value="Drawstring">Drawstring</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Strap Type</label>
            <Select value={formData.specifications.strapType} onValueChange={v => handleSpecChange('strapType', v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Double">Double</SelectItem>
                <SelectItem value="Adjustable Strap">Adjustable Strap</SelectItem>
                <SelectItem value="Removable Strap">Removable Strap</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={formData.specifications.laptopCompatible} onChange={e => handleSpecChange('laptopCompatible', e.target.checked)} className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" />
            Laptop Compatible
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={formData.specifications.waterResistant} onChange={e => handleSpecChange('waterResistant', e.target.checked)} className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" />
            Water Resistant
          </label>
        </div>
      </div>

      <div className="space-y-2 border-t border-ink-100 pt-4">
        <label className="text-sm font-medium">Short Tagline</label>
        <Input value={formData.shortTagline} onChange={e => setFormData({...formData, shortTagline: e.target.value})} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea 
          className="w-full min-h-[100px] p-3 rounded-md border border-ink-200 bg-white"
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending} className="bg-gold-500 hover:bg-gold-600 text-ink-900">
          {saveMutation.isPending ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}
