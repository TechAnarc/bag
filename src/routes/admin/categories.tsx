import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/services/adminApi';
import { Card, PageHeader, EmptyState } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Edit, Trash, Plus, Search, ArrowUp, ArrowDown, Power, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const categories = data?.data || [];

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete category'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleCategoryActive(id),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Category status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to toggle status'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => adminApi.reorderCategories(items),
    onSuccess: () => {
      toast.success('Category order saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => toast.error('Failed to reorder categories'),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? Products will be safely moved to Uncategorized.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...filteredCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((cat: any, idx: number) => ({
      id: cat.id,
      sortOrder: idx + 1,
    }));

    reorderMutation.mutate(payload);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categories Studio" 
        description="Create, edit, reorder, activate/deactivate bag categories and collections"
        action={
          <Button onClick={openNewModal} className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-medium">
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        }
      />

      <Card className="p-4 border-ink-200">
        <div className="flex mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-ink-500">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState 
            title="No categories found" 
            description="Create a category to organize your products."
            action={
              <Button onClick={openNewModal} variant="outline">Add Category</Button>
            }
          />
        ) : (
          <div className="rounded-md border border-ink-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-cream-50">
                <TableRow>
                  <TableHead className="w-[60px]">Order</TableHead>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat: any, idx: number) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono text-xs text-ink-500">
                      <div className="flex items-center gap-1">
                        <span>#{cat.sortOrder || idx + 1}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0 || reorderMutation.isPending}
                            onClick={() => handleMove(idx, 'up')}
                            className="text-ink-400 hover:text-ink-900 disabled:opacity-30 p-0.5"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === filteredCategories.length - 1 || reorderMutation.isPending}
                            onClick={() => handleMove(idx, 'down')}
                            className="text-ink-400 hover:text-ink-900 disabled:opacity-30 p-0.5"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-9 h-9 object-cover rounded bg-cream-100 border border-cream-200" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-cream-200 flex items-center justify-center text-ink-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-ink-500 font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell>{cat._count?.products || 0}</TableCell>
                    <TableCell className="text-xs uppercase text-ink-500">{cat.gender || 'UNISEX'}</TableCell>
                    <TableCell>
                      <Badge className={cat.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-ink-100 text-ink-600 border-ink-300'}>
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleMutation.mutate(cat.id)}
                        disabled={toggleMutation.isPending}
                        title={cat.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power className={`w-4 h-4 ${cat.isActive ? 'text-emerald-600' : 'text-ink-400'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(cat)}>
                        <Edit className="w-4 h-4 text-ink-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id, cat.name)}>
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
        <DialogContent className="bg-cream-50 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Modify category properties' : 'Create a new bag category. Changes will reflect instantly.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            category={editingCategory} 
            onClose={() => setIsModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ category, onClose }: { category: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image: category?.image || '',
    icon: category?.icon || '',
    gender: category?.gender || 'UNISEX',
    skuPrefix: category?.skuPrefix || '',
    sortOrder: category?.sortOrder || 0,
    isActive: category ? category.isActive : true,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      category ? adminApi.updateCategory(category.id, data) : adminApi.createCategory(data),
    onSuccess: () => {
      toast.success(category ? 'Category updated successfully' : 'Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save category')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Category name is required');
    saveMutation.mutate({
      ...formData,
      sortOrder: Number(formData.sortOrder) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category Name *</label>
        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Tote Bags" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU Prefix (3 Letters)</label>
          <Input 
            value={formData.skuPrefix} 
            onChange={e => setFormData({ ...formData, skuPrefix: e.target.value.toUpperCase().slice(0, 4) })} 
            placeholder="e.g. TOT" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Gender</label>
          <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UNISEX">Unisex / All</SelectItem>
              <SelectItem value="FEMALE">Women</SelectItem>
              <SelectItem value="MALE">Men</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category Image URL</label>
        <Input 
          value={formData.image} 
          onChange={e => setFormData({ ...formData, image: e.target.value })} 
          placeholder="https://... or /assets/cat-women.jpg" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea 
          className="w-full min-h-[80px] p-3 rounded-md border border-ink-200 bg-white text-sm"
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })} 
          placeholder="Short category description for storefront..."
        />
      </div>

      <div className="flex items-center justify-between border-t border-ink-100 pt-3">
        <label htmlFor="isActive" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            id="isActive"
            checked={formData.isActive} 
            onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
            className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" 
          />
          Active (Visible in Storefront)
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending} className="bg-gold-500 hover:bg-gold-600 text-ink-900 font-medium">
          {saveMutation.isPending ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
}
