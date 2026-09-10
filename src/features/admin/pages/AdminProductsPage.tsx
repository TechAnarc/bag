import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, productsAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, Filter, CheckCircle, XCircle, Eye, EyeOff, Package, Layers, Grid, ArrowRight, ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { CATEGORY_MASTER, getCategoryById } from '@/constants/categories';
import { SmartTaglineField } from '../components/SmartTaglineField';
import { SmartDescriptionField } from '../components/SmartDescriptionField';
import { ProductImageUploader } from '../components/ProductImageUploader';

interface Category {
  id: string;
  name: string;
  gender?: string;
  skuPrefix?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  basePrice?: number;
  ownerPrice?: number;
  sellingPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  categoryId: string;
  category?: Category;
  images: string[];
  description: string;
  shortTagline?: string;
  platingType?: string;
  specifications?: any;
  inventory?: any;
}

export default function AdminProductsPage() {
  // Round a price up to nearest "pretty" last-two-digit: 20, 50, 80, or 00 (hundred)
  const roundUpToPrettyPrice = (price: number): number => {
    const base = Math.floor(price / 100) * 100;
    const remainder = price - base;
    if (remainder <= 0) return price;
    if (remainder <= 20) return base + 20;
    if (remainder <= 50) return base + 50;
    if (remainder <= 80) return base + 80;
    return base + 100;
  };

  const calcSellingPrice = (ownerPrice: number): number => {
    if (!ownerPrice || ownerPrice <= 0) return 0;
    // Step 1: Calculate Platform Charges (Owner Price * 1.06)
    const subtotal = ownerPrice * 1.06;
    // Step 2 & 3: Apply Razorpay Charges (Subtotal * 1.02)
    const raw = subtotal * 1.02;
    return roundUpToPrettyPrice(Math.ceil(raw));
  };

  const getInitialFormData = () => ({
    name: '',
    price: 0,
    basePrice: 0,
    ownerPrice: 0,
    sellingPrice: 0,
    categoryId: '',
    sku: '',
    slug: '',
    description: '',
    shortTagline: '',
    platingType: '1 Gram Gold Plated',
    images: [],
    specifications: {
      weight: '',
      material: '',
      surfaceFinish: '',
      occasion: '',
      brand: 'Triveni Jewellers',
      packageContents: ''
    },
    inventory: {
      quantity: 0,
      inStock: true
    },
    gender: 'FEMALE',
    status: 'ACTIVE'
  });

  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openCatPopover, setOpenCatPopover] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();

  useEffect(() => {
    if (location.pathname === '/admin/products/new') {
      setEditingProduct(null);
      setFormData(getInitialFormData());
      setActiveTab('basic');
      setIsDialogOpen(true);
    } else if (isDialogOpen && !editingProduct) {
      // Close dialog if we navigated away from /new and we're not currently editing an existing product
      setIsDialogOpen(false);
    }
  }, [location.pathname]);

  // Track if the dialog has been opened so we only redirect on open -> close transition
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isDialogOpen) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (location.pathname === '/admin/products/new') {
        navigate('/admin/products');
      }
    }
  }, [isDialogOpen, location.pathname, navigate]);

  const [formData, setFormData] = useState<any>(getInitialFormData());
  const [activeTab, setActiveTab] = useState('basic');
  const TABS = ['basic', 'pricing', 'details', 'media'];

  const handleNext = () => {
    if (activeTab === 'basic' && (!formData.sku || formData.sku === 'GENERATING...')) {
      if (!formData.categoryId) {
        toast.error('Please select a category to proceed');
      } else {
        toast.error('Waiting for SKU generation...');
      }
      return;
    }
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  };

  const theme = outletContext?.theme || 'dark';

  const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
  const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
  const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        adminAPI.getProducts({ search: searchTerm, limit, page }),
        categoriesAPI.getAll()
      ]);
      setProducts(prodRes.data.data.products || []);
      setPagination({
        total: prodRes.data.data.pagination.total,
        totalPages: prodRes.data.data.pagination.totalPages
      });
      setCategories(catRes.data.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, page, limit]);

  // Handle auto-SKU generation
  useEffect(() => {
    let isMounted = true;
    const handleAutoSku = async () => {
      // Only generate for new products when a category is selected
      if (!formData.categoryId || editingProduct) return;

      try {
        if (isMounted) setFormData(prev => ({ ...prev, sku: 'GENERATING...' }));
        console.log('[SKU] Requesting SKU for category:', formData.categoryId);
        const res = await adminAPI.generateSku(formData.categoryId);
        console.log('[SKU] Response:', res.data);
        if (isMounted && res.data?.success && res.data?.data?.sku) {
          setFormData(prev => ({ ...prev, sku: res.data.data.sku }));
        } else if (isMounted) {
          console.error('[SKU] Unexpected response format:', res.data);
          setFormData(prev => ({ ...prev, sku: '' }));
        }
      } catch (error: any) {
        console.error('[SKU] Auto-SKU generation failed:', error?.response?.data || error?.message || error);
        toast.error('Automated SKU generation failed. Please check connection or select category again.');
        if (isMounted) setFormData(prev => ({ ...prev, sku: '' }));
      }
    };
    handleAutoSku();
    return () => { isMounted = false; };
  }, [formData.categoryId, editingProduct]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const computedSP = calcSellingPrice(parseFloat(formData.ownerPrice) || 0);

      // Filter out empty image slots before sending to backend
      const uploadedImages = (formData.images || []).filter(
        (img: string) => img && typeof img === 'string' && img.trim() !== '' && img.startsWith('http')
      );

      if (uploadedImages.length === 0 && !editingProduct) {
        toast.error('Please upload at least the Main Image (Slot 1) for the new product.');
        return;
      }

      // Sanitized payload — only send fields the backend schema expects
      const payload: Record<string, any> = {
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description,
        shortTagline: formData.shortTagline,
        platingType: formData.platingType,
        price: computedSP || parseFloat(formData.sellingPrice || formData.price) || 0,
        basePrice: parseFloat(formData.basePrice) || 0,
        ownerPrice: parseFloat(formData.ownerPrice) || 0,
        sellingPrice: computedSP || parseFloat(formData.sellingPrice) || 0,
        images: uploadedImages,
        specifications: formData.specifications || {},
        inventory: formData.inventory || {},
        status: formData.status || 'ACTIVE',
      };

      // Include sku/slug only for new products
      if (!editingProduct) {
        if (formData.sku) payload.sku = formData.sku;
      }

      console.log('[PRODUCT_SUBMIT] Payload being sent:', JSON.stringify(payload, null, 2));

      if (editingProduct) {
        const res = await adminAPI.updateProduct(editingProduct.id, payload);
        console.log('[PRODUCT_SUBMIT] Update response:', res.data);
        toast.success('Product updated successfully');
      } else {
        const res = await adminAPI.createProduct(payload);
        console.log('[PRODUCT_SUBMIT] Create response:', res.data);
        toast.success('Product created successfully');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('[PRODUCT_SUBMIT] Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        error.message ||
        'Operation failed';
      toast.error(errMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = async (product: Product) => {
    try {
      toast.loading('Fetching full product details...');
      
      // Use the admin API which has full access including inactive products
      // Fallback to the product data already in the list if the fetch fails
      let fullProduct: any = null;
      try {
        const res = await adminAPI.getProducts({ search: product.sku || product.id, limit: 1 });
        const found = res.data?.products?.find((p: any) => p.id === product.id);
        if (found) fullProduct = found;
      } catch (_) {}

      // Fallback: try the public endpoint
      if (!fullProduct) {
        try {
          const res = await productsAPI.getById(product.id);
          fullProduct = res.data?.data || null;
        } catch (_) {}
      }

      // Last resort: use the product object we already have from the list
      if (!fullProduct) {
        fullProduct = product;
      }

      console.log('[EDIT] Initializing state with full product:', fullProduct);
      
      const opVal = fullProduct.ownerPrice;
      const spVal = parseFloat(fullProduct.sellingPrice || fullProduct.price) || 0;
      
      let recoveredOwnerPrice = opVal;
      const isOwnerPriceInvalid = opVal === undefined || 
                                   opVal === null || 
                                   opVal === "" ||
                                   parseFloat(opVal) === 0 || 
                                   Number.isNaN(parseFloat(opVal));
                                   
      if (isOwnerPriceInvalid) {
        if (spVal <= 0) {
          console.warn(`[PRODUCT_EDIT] ⚠️ Invalid pricing data for product ${fullProduct.id}: sellingPrice is ${spVal}. Skipping auto-recovery of ownerPrice.`);
          recoveredOwnerPrice = 0;
        } else {
          recoveredOwnerPrice = Math.round(spVal / 1.0812);
          console.log(`[PRODUCT_EDIT] 🔄 Auto-recovered ownerPrice for legacy product ${fullProduct.id}: computed ${recoveredOwnerPrice} from sellingPrice ${spVal}.`);
        }
      }

      setEditingProduct(fullProduct);
      
      setFormData({
        ...getInitialFormData(),
        ...fullProduct,
        ownerPrice: recoveredOwnerPrice,
        specifications: fullProduct.specifications || getInitialFormData().specifications,
        inventory: fullProduct.inventory || getInitialFormData().inventory,
      });
      
      setActiveTab('basic');
      setIsDialogOpen(true);
      toast.dismiss();
    } catch (error: any) {
      console.error('[EDIT] Failed to load product:', error);
      toast.error('Failed to load full product data. Please try again.');
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminAPI.updateProduct(product.id, { status: newStatus });
      toast.success(`Product ${newStatus.toLowerCase()}d`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const sanitizeUrl = (url: any) => {
    if (typeof url !== 'string' || !url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    if (path.startsWith('/uploads/') || path.startsWith('/assets/')) {
      const backendRoot = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
      return `${backendRoot}${path}`;
    }
    return path;
  };

  return (
    <div className="pb-20">
      {view === 'dashboard' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h1 className={cn("text-3xl font-bold mb-2", textPrimary)}>Product Management</h1>
            <p className={textSecondary}>Overview and management of your product catalog</p>
          </div>

          <div className="relative max-w-2xl">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", textSecondary)} />
            <Input
              placeholder="Search any product by Name, SKU, ID..."
              className={cn("pl-12 h-14 text-lg shadow-lg", inputBg, textPrimary)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.length > 2) setView('list');
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className={cn("hover:border-indigo-500 transition-all cursor-pointer group", bgCard)} onClick={() => setView('list')}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("flex justify-between items-center text-xl", textPrimary)}>
                  All Products
                  <Package className="w-6 h-6 text-indigo-500" />
                </CardTitle>
                <CardDescription className={textSecondary}>View and manage full inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-indigo-500 mb-2">{pagination.total}</div>
                <p className={cn("text-sm", textSecondary)}>Total products listed</p>
              </CardContent>
              <CardFooter className="pt-0">
                <span className="text-sm text-indigo-500 group-hover:underline flex items-center gap-1">
                  View List <ArrowRight className="w-4 h-4" />
                </span>
              </CardFooter>
            </Card>

            <Card className={cn("hover:border-purple-500 transition-all cursor-pointer group", bgCard)} onClick={() => navigate('/admin/categories')}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("flex justify-between items-center text-xl", textPrimary)}>
                  Categories
                  <Layers className="w-6 h-6 text-purple-500" />
                </CardTitle>
                <CardDescription className={textSecondary}>Manage product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-500 mb-2">{categories.length}</div>
                <p className={cn("text-sm", textSecondary)}>Active categories</p>
              </CardContent>
              <CardFooter className="pt-0">
                <span className="text-sm text-purple-500 group-hover:underline flex items-center gap-1">
                  Manage <ArrowRight className="w-4 h-4" />
                </span>
              </CardFooter>
            </Card>

            <Card className={cn("hover:border-emerald-500 transition-all cursor-pointer group", bgCard)}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("flex justify-between items-center text-xl", textPrimary)}>
                  Quick Actions
                  <Grid className="w-6 h-6 text-emerald-500" />
                </CardTitle>
                <CardDescription className={textSecondary}>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/products/new')}>
                  <Plus className="w-4 h-4 mr-2 text-emerald-500" /> Add New Product
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/categories')}>
                  <Plus className="w-4 h-4 mr-2 text-purple-500" /> Add New Category
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setView('dashboard')} className={textSecondary}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <h1 className={cn("text-3xl font-bold mb-2", textPrimary)}>All Products</h1>
                <p className={textSecondary}>Manage {pagination.total} listed items</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/products/new')} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
              <Input
                placeholder="Search by name, SKU, or ID..."
                className={cn("pl-10", inputBg, textPrimary)}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" className={cn(bgCard, textPrimary)}>
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <Card className={cn("overflow-hidden shadow-xl", bgCard)}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={cn("border-b", theme === 'dark' ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500")}>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Product</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Category</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Price</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Inventory</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", theme === 'dark' ? "divide-slate-800 text-white" : "divide-slate-200 text-slate-900")}>
                  {loading ? (
                    Array(limit).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="py-4 px-6"><Skeleton className="h-10 w-full opacity-20" /></td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Package className="w-12 h-12 text-slate-700 opacity-20" />
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-slate-400">No Inventory Nodes Found</p>
                            <p className="text-sm text-slate-500">Your product catalog is currently empty or matches no search criteria.</p>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-4 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                            onClick={() => navigate('/admin/products/new')}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Product
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className={cn("transition-colors group", theme === 'dark' ? "hover:bg-slate-800/30" : "hover:bg-slate-50")}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded border overflow-hidden flex-shrink-0", theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200")}>
                              {product.images?.[0] ? (
                                <img src={sanitizeUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600"><Package className="w-6 h-6" /></div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold group-hover:text-indigo-500 transition-colors">{product.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className={cn("py-4 px-6 text-xs", textSecondary)}>{product.category?.name || 'Uncategorized'}</td>
                        <td className="py-4 px-6 font-mono text-sm font-bold">₹{product.price}</td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={cn("text-[10px] font-bold", (product as any).inventory?.quantity > 10 ? "text-emerald-500 border-emerald-500/20" : "text-amber-500 border-amber-500/20")}>
                            {(product as any).inventory?.quantity || 0} UNITS
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <button onClick={() => toggleStatus(product)} className="flex items-center hover:opacity-80 transition-opacity">
                            {product.status === 'ACTIVE' ? (
                              <span className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Published
                              </span>
                            ) : (
                              <span className="flex items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-slate-500 mr-2" /> Draft
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="hover:bg-indigo-500/10 text-indigo-500">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="hover:bg-rose-500/10 text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={cn("p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4", theme === 'dark' ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50")}>
              <div className="flex items-center gap-4">
                <p className={cn("text-xs font-mono", textSecondary)}>
                  SHOWING <span className="text-indigo-500 font-bold">{(page - 1) * limit + 1}</span> - <span className="text-indigo-500 font-bold">{Math.min(page * limit, pagination.total)}</span> OF <span className="text-indigo-500 font-bold">{pagination.total}</span> NODES
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", textSecondary)}>PER_PAGE:</span>
                  <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}>
                    <SelectTrigger className={cn("h-7 w-[70px] text-[10px] font-bold", inputBg, textPrimary)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={cn("border-slate-800", bgCard, textPrimary)}>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-slate-950 border-slate-800 disabled:opacity-30"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum = page;
                    if (pagination.totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <Button
                        key={i}
                        variant={page === pageNum ? "default" : "outline"}
                        className={cn("h-8 w-8 text-[10px] font-bold", page === pageNum ? "bg-indigo-600 text-white" : cn(bgCard, textPrimary))}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-slate-950 border-slate-800 disabled:opacity-30"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages || loading}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", bgCard, textPrimary)}>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription className={textSecondary}>
              {editingProduct ? 'Update the product specifications and details below.' : 'Fill in the technical details for the new product listing.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-8 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={cn("w-full justify-start overflow-x-auto", theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200")}>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="details">Specs & Design</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prod-name">Product Name</Label>
                    <Input id="prod-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required className={inputBg} />
                  </div>
                  <div className="space-y-2 text-indigo-500">
                    <Label htmlFor="prod-sku">VIRTUAL SKU ID</Label>
                    <Input id="prod-sku" value={formData.sku} readOnly className={cn(inputBg, "font-mono bg-indigo-500/10 border-indigo-500/30 cursor-not-allowed")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-cat">Category Master List</Label>
                  <Popover open={openCatPopover} onOpenChange={setOpenCatPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        id="prod-cat"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCatPopover}
                        className={cn("w-full justify-between font-normal h-10 px-3 border", inputBg, textPrimary)}
                      >
                        {formData.categoryId
                          ? (() => {
                              const cat = categories.find((c) => c.id === formData.categoryId);
                              return cat ? `${cat.name} ${cat.skuPrefix ? `(${cat.skuPrefix})` : ''}` : "Select Category...";
                            })()
                          : "Select Category..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", bgCard)} align="start">
                      <Command className={bgCard}>
                        <CommandInput placeholder="Search category by name or SKU..." className="h-9" />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup className="max-h-[250px] overflow-y-auto">
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat.id}
                              value={`${cat.name} ${cat.skuPrefix || ''}`}
                              onSelect={() => {
                                setFormData((prev: any) => ({ ...prev, categoryId: cat.id, sku: '' }));
                                setOpenCatPopover(false);
                              }}
                              className={cn(
                                "flex items-center justify-between cursor-pointer py-2 px-3 text-sm hover:bg-indigo-600/20 data-[selected=true]:bg-indigo-600/20 data-[selected=true]:text-white",
                                formData.categoryId === cat.id && "bg-indigo-600/30 text-indigo-400 font-medium"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                {cat.name}
                                {cat.skuPrefix && (
                                  <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">
                                    {cat.skuPrefix}
                                  </span>
                                )}
                              </span>
                              {formData.categoryId === cat.id && <Check className="h-4 w-4 text-indigo-500" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <SmartTaglineField
                  productName={formData.name}
                  categoryId={formData.categoryId}
                  value={formData.shortTagline}
                  onChange={(val) => setFormData(prev => ({ ...prev, shortTagline: val }))}
                  theme={theme}
                />
                <SmartDescriptionField
                  productName={formData.name}
                  categoryId={formData.categoryId}
                  tagline={formData.shortTagline}
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                  theme={theme}
                  platingType={formData.platingType}
                  material={formData.specifications?.material}
                />
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 pt-4">
                {/* Row 1: Base Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prod-mrp">Base Price (MRP)</Label>
                    <Input id="prod-mrp" type="number" value={formData.basePrice} onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))} required className={inputBg} />
                  </div>
                  {/* Stock Quantity beside Base Price */}
                  <div className="space-y-2">
                    <Label htmlFor="prod-qty">Stock Quantity</Label>
                    <Input id="prod-qty" type="number" value={formData.inventory?.quantity} onChange={(e) => setFormData(prev => ({ ...prev, inventory: { ...prev.inventory, quantity: parseInt(e.target.value) } }))} className={inputBg} />
                  </div>
                </div>

                {/* Row 2: Owner's Price + Auto Selling Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prod-owner-price">Owner's Price</Label>
                    <Input
                      id="prod-owner-price"
                      type="number"
                      value={formData.ownerPrice}
                      onChange={(e) => {
                        const op = parseFloat(e.target.value) || 0;
                        const sp = calcSellingPrice(op);
                        setFormData(prev => ({ ...prev, ownerPrice: e.target.value, sellingPrice: sp }));
                      }}
                      required
                      className={inputBg}
                      placeholder="Enter owner's price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod-sp">Selling Price</Label>
                    <div className="relative">
                      <Input
                        id="prod-sp"
                        type="number"
                        value={formData.sellingPrice || calcSellingPrice(parseFloat(formData.ownerPrice) || 0)}
                        readOnly
                        className={cn(inputBg, "cursor-not-allowed opacity-80 font-bold text-emerald-500 bg-emerald-500/10 border-emerald-500/30")}
                        placeholder="Auto-calculated"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase">LOCKED</div>
                    </div>
                    {(parseFloat(formData.ownerPrice) > 0) && (() => {
                      const op = parseFloat(formData.ownerPrice) || 0;
                      const sp = formData.sellingPrice || calcSellingPrice(op);
                      const baseGst = Math.round(op * 0.03);
                      const techAnarc = Math.round(op * 0.03);
                      const subtotal = op + baseGst + techAnarc;
                      const pgCharges = Math.round(subtotal * 0.02);
                      
                      return (
                        <div className={cn("text-[11px] mt-2 p-3 rounded-lg border space-y-2 shadow-sm", 
                          theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                        )}>
                          <div className="flex justify-between items-center border-b pb-1.5 border-slate-700/30">
                            <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">Pricing Breakdown</span>
                            <span className="font-mono text-xs font-bold text-emerald-400">SP = ₹{sp}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Owner Price:</span>
                              <span className="font-semibold">₹{op}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">GST (3% of Owner):</span>
                              <span className="font-semibold">₹{baseGst}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">TechAnarc (3% of Owner):</span>
                              <span className="font-semibold">₹{techAnarc}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 border-slate-700/20">
                              <span className="text-slate-400">Subtotal:</span>
                              <span className="font-semibold">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 border-slate-700/20 text-[10px]">
                              <span className="text-slate-400">Razorpay Charges (2%):</span>
                              <span className="font-semibold">₹{pgCharges}</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-500 pt-1 leading-normal border-t border-slate-700/20">
                            <strong>Formula:</strong> <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-slate-400">SP = Subtotal * 1.02</code> (where Subtotal = Owner * 1.06).
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-8 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="instock"
                      checked={formData.inventory?.inStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, inventory: { ...prev.inventory, inStock: e.target.checked } }))}
                      className={cn(
                        "w-4 h-4 rounded text-indigo-600 transition-colors",
                        theme === 'dark' ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                      )}
                    />
                    <Label htmlFor="instock">Currently In Stock</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spec-weight">Weight (e.g. 15-20 Gram)</Label>
                    <Input id="spec-weight" value={formData.specifications?.weight} onChange={(e) => setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, weight: e.target.value } }))} className={inputBg} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spec-mat">Material Smart Suggestion</Label>
                    <Input id="spec-mat" value={formData.specifications?.material} onChange={(e) => setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, material: e.target.value } }))} placeholder="e.g. Copper Alloy with Gold Plating" className={inputBg} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spec-occ">Occasion</Label>
                    <Input id="spec-occ" value={formData.specifications?.occasion} onChange={(e) => setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, occasion: e.target.value } }))} className={inputBg} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-plating">Plating Type</Label>
                  <Select value={formData.platingType} onValueChange={(val) => setFormData(prev => ({ ...prev, platingType: val }))}>
                    <SelectTrigger className={inputBg}>
                      <SelectValue placeholder="Select Plating" />
                    </SelectTrigger>
                    <SelectContent className={bgCard}>
                      <SelectItem value="1 Gram Gold Plated">1 Gram Gold Plated</SelectItem>
                      <SelectItem value="2 Gram Gold Plated">2 Gram Gold Plated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 pt-4">
                <ProductImageUploader
                  sku={formData.sku}
                  onImagesChange={(urls) => setFormData((prev: any) => ({ ...prev, images: urls }))}
                  existingImages={formData.images}
                  theme={theme}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className={cn("border-t pt-6", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
              <div className="flex justify-between items-center w-full">
                <div className="flex gap-2">
                  {activeTab !== 'basic' && (
                    <Button type="button" variant="outline" onClick={handleBack} className={textSecondary}>
                      Back
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className={textSecondary}>Cancel</Button>
                </div>

                <div className="flex gap-2">
                  {activeTab !== 'media' ? (
                    <Button type="button" onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                      {editingProduct ? 'Update Product' : 'Add a Product'}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
