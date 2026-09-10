import React, { useState, useEffect } from 'react';
import { adminAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useOutletContext } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  gender?: string;
  skuPrefix?: string;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', isActive: true, gender: 'UNISEX', skuPrefix: '' });

  const outletContext = useOutletContext<{ theme: 'light' | 'dark' }>();
  const theme = outletContext?.theme || 'dark';

  const bgCard = theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = theme === 'dark' ? "text-white" : "text-slate-900";
  const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
  const inputBg = theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";

  const fetchCategories = async () => {
    try {
      console.log('[AdminCategories] Fetching categories...');
      setLoading(true);
      const res = await categoriesAPI.getAll();
      console.log('[AdminCategories] Categories fetched:', res.data);
      setCategories(res.data.data || []);
    } catch (error: any) {
      console.error('[AdminCategories] Fetch error:', error);
      toast.error(`Failed to fetch categories: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('[AdminCategories] Submitting category:', formData);

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        const response = await adminAPI.createCategory(formData);
        console.log('[AdminCategories] Create response:', response);
        toast.success('Category created successfully');
      }
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', isActive: true, gender: 'UNISEX', skuPrefix: '' });
      fetchCategories();
    } catch (error: any) {
      console.error('[AdminCategories] Submit error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Action failed';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={cn("text-3xl font-bold mb-2", textPrimary)}>Category Management</h1>
          <p className={textSecondary}>Manage your product categories</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', isActive: true, gender: 'UNISEX', skuPrefix: '' }); setIsDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className={bgCard}>
        <CardHeader>
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", textSecondary)} />
            <Input
              placeholder="Search categories..."
              className={cn("pl-10", inputBg, textPrimary)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={cn("border-b", theme === 'dark' ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500")}>
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Slug</th>
                  <th className="py-4 px-4">Products</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", theme === 'dark' ? "divide-slate-800" : "divide-slate-200")}>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No categories found</td></tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className={cn("transition-colors", theme === 'dark' ? "text-white hover:bg-slate-800/50" : "text-slate-900 hover:bg-slate-50")}>
                      <td className="py-4 px-4 font-medium">{category.name}</td>
                      <td className={cn("py-4 px-4", textSecondary)}>{category.slug}</td>
                      <td className={cn("py-4 px-4", textSecondary)}>{category._count?.products || 0}</td>
                      <td className="py-4 px-4">
                        {category.isActive ? (
                          <span className="flex items-center text-emerald-500 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-rose-500 text-sm">
                            <XCircle className="w-4 h-4 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(category); setFormData({ name: category.name, isActive: category.isActive, gender: category.gender || 'UNISEX', skuPrefix: category.skuPrefix || '' }); setIsDialogOpen(true); }}>
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn(bgCard, textPrimary)} aria-describedby="category-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription id="category-dialog-description">
              {editingCategory ? 'Update the category information below' : 'Create a new category by filling in the details below'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={cn(inputBg, textPrimary)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skuPrefix">SKU Prefix (3 Letters)</Label>
                <Input
                  id="skuPrefix"
                  value={formData.skuPrefix}
                  onChange={(e) => setFormData({ ...formData, skuPrefix: e.target.value.toUpperCase().slice(0, 3) })}
                  placeholder="e.g. ANK"
                  maxLength={3}
                  required
                  className={cn(inputBg, textPrimary)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Target Gender</Label>
                <select
                  id="gender"
                  value={formData.gender || 'UNISEX'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={cn("w-full h-10 px-3 rounded-md", inputBg, textPrimary)}
                >
                  <option value="UNISEX">Unisex / Both</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className={textSecondary}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingCategory ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
