import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/services/adminApi';
import { Card, PageHeader, EmptyState } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Edit, Trash, Plus, Search, Copy, Archive, Upload, Sparkles, Layers, Box } from 'lucide-react';
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
  const [quickStockProduct, setQuickStockProduct] = useState<any>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
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

  const products = productsData?.data?.products || productsData?.products || [];
  const pagination = productsData?.data?.pagination || productsData?.pagination || {};

  const filteredProducts = statusFilter === 'ALL' 
    ? products 
    : products.filter((p: any) => p.status === statusFilter);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete product'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => adminApi.duplicateProduct(id),
    onSuccess: () => {
      toast.success('Product duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to duplicate product'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.archiveProduct(id),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Product status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to archive product'),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adminApi.updateProductStock(id, stock),
    onSuccess: () => {
      toast.success('Stock updated');
      setQuickStockProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update stock'),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
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
        title="Products Studio" 
        description="Manage bag catalog, pricing, inventory stock, materials and bag specifications"
        action={
          <Button onClick={openNewModal} className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-medium">
            <Plus className="w-4 h-4 mr-2" /> New Product
          </Button>
        }
      />

      <Card className="p-4 border-ink-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input 
              placeholder="Search products by name, SKU, tag, or description..." 
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
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-ink-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState 
            title="No products found" 
            description="Try adjusting your search filters or add a new bag product."
            action={
              <Button onClick={openNewModal} variant="outline">Add Product</Button>
            }
          />
        ) : (
          <>
            <div className="rounded-md border border-ink-200 overflow-x-auto">
              <Table>
                <TableHeader className="bg-cream-50">
                  <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => {
                    const currentStock = product.stock ?? (product.inventory?.quantity || 0);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded bg-cream-100 border border-cream-200" />
                          ) : (
                            <div className="w-10 h-10 bg-cream-200 rounded flex items-center justify-center text-xs text-ink-400">
                              <Box className="w-4 h-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.name}</div>
                            {product.shortTagline && (
                              <div className="text-xs text-ink-400 line-clamp-1">{product.shortTagline}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-ink-500 font-mono text-xs">{product.sku}</TableCell>
                        <TableCell className="text-xs text-ink-600">{product.category?.name || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">₹{product.sellingPrice || product.price}</span>
                            {(product.basePrice || product.discountPrice) && (
                              <span className="text-xs text-ink-400 line-through ml-1.5">
                                ₹{product.basePrice || product.discountPrice}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => {
                              setQuickStockProduct(product);
                              setQuickStockValue(currentStock);
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to update stock"
                          >
                            <Badge variant="outline" className={
                              currentStock <= 0 ? 'border-red-500 text-red-700 bg-red-50' :
                              currentStock <= 5 ? 'border-amber-500 text-amber-700 bg-amber-50' :
                              'border-emerald-500 text-emerald-700 bg-emerald-50'
                            }>
                              {currentStock} in stock
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                            product.status === 'INACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-600'
                          }>
                            {product.status || (product.isActive ? 'ACTIVE' : 'INACTIVE')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(product)} title="Edit Product">
                            <Edit className="w-4 h-4 text-ink-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => duplicateMutation.mutate(product.id)}
                            disabled={duplicateMutation.isPending}
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => archiveMutation.mutate(product.id)}
                            disabled={archiveMutation.isPending}
                            title={product.status === 'INACTIVE' ? 'Activate Product' : 'Archive Product'}
                          >
                            <Archive className="w-4 h-4 text-amber-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)} title="Delete Product">
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs text-ink-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total products)
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= pagination.totalPages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Quick Stock Modal */}
      <Dialog open={!!quickStockProduct} onOpenChange={() => setQuickStockProduct(null)}>
        <DialogContent className="bg-cream-50 max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Stock Adjustment</DialogTitle>
            <DialogDescription>{quickStockProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Inventory Quantity</label>
              <Input 
                type="number" 
                min="0" 
                value={quickStockValue} 
                onChange={(e) => setQuickStockValue(Number(e.target.value))} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setQuickStockProduct(null)}>Cancel</Button>
              <Button 
                className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-medium"
                disabled={stockMutation.isPending}
                onClick={() => stockMutation.mutate({ id: quickStockProduct.id, stock: quickStockValue })}
              >
                Save Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit / Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-cream-50">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'New Bag Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product specification & bag attributes' : 'Fill details to add a new bag product directly to PostgreSQL catalog.'}
            </DialogDescription>
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
    categoryId: product?.categoryId || (categories?.[0]?.id || ''),
    status: product?.status || 'ACTIVE',
    basePrice: product?.basePrice || product?.discountPrice || '',
    sellingPrice: product?.sellingPrice || product?.price || '',
    ownerPrice: product?.ownerPrice || '',
    stock: product?.stock ?? (product?.inventory?.quantity || 0),
    lowStockThreshold: product?.lowStockThreshold || 5,
    shortTagline: product?.shortTagline || '',
    description: product?.description || '',
    careInstructions: product?.careInstructions || 'Keep away from sharp objects and extreme heat. Wipe gently with a dry or damp soft cloth. Store in the provided dust bag when not in use.',
    images: product?.images || [],
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

  const [imageUrlInput, setImageUrlInput] = useState('');

  const saveMutation = useMutation({
    mutationFn: (data: any) => product ? adminApi.updateProduct(product.id, data) : adminApi.createProduct(data),
    onSuccess: () => {
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save product')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Product name is required');
    if (!formData.categoryId) return toast.error('Please select a category');
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) return toast.error('Valid selling price is required');
    
    const payload = {
      ...formData,
      basePrice: formData.basePrice ? Number(formData.basePrice) : undefined,
      sellingPrice: Number(formData.sellingPrice),
      price: Number(formData.sellingPrice),
      ownerPrice: formData.ownerPrice ? Number(formData.ownerPrice) : undefined,
      stock: Number(formData.stock),
      lowStockThreshold: Number(formData.lowStockThreshold),
      inventory: { quantity: Number(formData.stock) },
    };
    
    saveMutation.mutate(payload);
  };

  const handleSpecChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value }
    }));
  };

  const addImage = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_: any, i: number) => i !== index) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Name *</label>
          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Executive Leather Tote" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU (Auto-generates if empty)</label>
          <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. BBH-TOT-001" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility / Status</label>
          <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active (Published)</SelectItem>
              <SelectItem value="INACTIVE">Inactive (Hidden)</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-ink-100 pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Price (₹) *</label>
          <Input type="number" required min="1" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Price / MRP (₹)</label>
          <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} placeholder="Compare at price" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Owner Cost Price (₹)</label>
          <Input type="number" value={formData.ownerPrice} onChange={e => setFormData({...formData, ownerPrice: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Count *</label>
          <Input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
        </div>
      </div>

      {/* Bag Native Specifications */}
      <div className="space-y-4 border-t border-ink-100 pt-4">
        <h3 className="font-medium text-ink-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold-500" /> Bag Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Material</label>
            <Input value={formData.specifications.material || ''} onChange={e => handleSpecChange('material', e.target.value)} placeholder="e.g. Genuine Vegan Leather" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity</label>
            <Input value={formData.specifications.capacity || ''} onChange={e => handleSpecChange('capacity', e.target.value)} placeholder="e.g. 18L" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dimensions</label>
            <Input value={formData.specifications.dimensions || ''} onChange={e => handleSpecChange('dimensions', e.target.value)} placeholder="e.g. 38 × 28 × 12 cm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <Input value={formData.specifications.color || ''} onChange={e => handleSpecChange('color', e.target.value)} placeholder="e.g. Tan Brown" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compartments</label>
            <Input type="number" value={formData.specifications.compartments || ''} onChange={e => handleSpecChange('compartments', e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 3" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Closure Type</label>
            <Select value={formData.specifications.closureType || ''} onValueChange={v => handleSpecChange('closureType', v)}>
              <SelectTrigger><SelectValue placeholder="Select Closure" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Zipper">Zipper</SelectItem>
                <SelectItem value="Magnetic Snap">Magnetic Snap</SelectItem>
                <SelectItem value="Buckle">Buckle</SelectItem>
                <SelectItem value="Drawstring">Drawstring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={formData.specifications.laptopCompatible || false} onChange={e => handleSpecChange('laptopCompatible', e.target.checked)} className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" />
            Laptop Compatible (15.6")
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={formData.specifications.waterResistant || false} onChange={e => handleSpecChange('waterResistant', e.target.checked)} className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" />
            Water Resistant
          </label>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="space-y-3 border-t border-ink-100 pt-4">
        <label className="text-sm font-medium">Product Images</label>
        <div className="flex gap-2">
          <Input 
            value={imageUrlInput} 
            onChange={e => setImageUrlInput(e.target.value)} 
            placeholder="Paste image URL (or asset path)..." 
          />
          <Button type="button" onClick={addImage} variant="outline">Add Image</Button>
        </div>
        {formData.images.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-2">
            {formData.images.map((img: string, idx: number) => (
              <div key={idx} className="relative group flex-shrink-0">
                <img src={img} alt={`Product ${idx}`} className="w-16 h-16 object-cover rounded border border-ink-200" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-ink-100 pt-4">
        <label className="text-sm font-medium">Short Tagline</label>
        <Input value={formData.shortTagline} onChange={e => setFormData({...formData, shortTagline: e.target.value})} placeholder="e.g. Handcrafted luxury tote designed for daily elegance" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea 
          className="w-full min-h-[100px] p-3 rounded-md border border-ink-200 bg-white text-sm"
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder="Full product overview and details..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending} className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-medium">
          {saveMutation.isPending ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}
