import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/services/adminApi';
import { Card, PageHeader, EmptyState } from '@/components/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo } from 'react';
import { Edit, Trash, Plus, Search } from 'lucide-react';
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
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
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
        title="Categories" 
        description="Organize your bags by types and collections"
        action={
          <Button onClick={openNewModal} className="bg-gold-500 hover:bg-gold-600 text-ink-900">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-ink-500">{cat.slug}</TableCell>
                    <TableCell>{cat._count?.products || 0}</TableCell>
                    <TableCell>
                      <Badge className={cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'}>
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(cat)}>
                        <Edit className="w-4 h-4 text-ink-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
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
        <DialogContent className="bg-cream-50">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
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
  const [name, setName] = useState(category?.name || '');
  const [isActive, setIsActive] = useState(category ? category.isActive : true);

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; isActive: boolean }) => 
      category ? adminApi.updateCategory(category.id, data) : adminApi.createCategory(data),
    onSuccess: () => {
      toast.success(category ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      onClose();
    },
    onError: () => toast.error('Failed to save category')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    saveMutation.mutate({ name, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tote Bags" />
      </div>
      <div className="space-y-2 flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isActive"
          checked={isActive} 
          onChange={e => setIsActive(e.target.checked)} 
          className="rounded border-ink-300 text-gold-500 focus:ring-gold-500" 
        />
        <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending} className="bg-gold-500 hover:bg-gold-600 text-ink-900">
          {saveMutation.isPending ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
}
