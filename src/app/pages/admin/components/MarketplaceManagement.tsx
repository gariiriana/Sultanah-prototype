import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Plus, Edit, Trash, ShoppingBag, DollarSign, Package as PackageIcon, Image as ImageIcon, AlertTriangle, Sparkles } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { MarketplaceItem } from '../../../../types/marketplace';
import { compressImage, validateImageFile } from '../../../../utils/imageCompression';

const MarketplaceManagement = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'perlengkapan' as 'perlengkapan' | 'souvenir' | 'makanan' | 'lainnya',
    status: 'active' as 'active' | 'inactive',
    image: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'marketplaceItems'));
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceItem[];
      setItems(itemsData);
    } catch (error) {
      toast.error('Failed to fetch marketplace items');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 400, 0.8);
      setFormData({ ...formData, image: compressed });
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category,
        status: formData.status,
        image: formData.image,
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'marketplaceItems', editingItem.id), itemData);
        toast.success('Item updated successfully');
      } else {
        await addDoc(collection(db, 'marketplaceItems'), {
          ...itemData,
          createdAt: new Date().toISOString(),
        });
        toast.success('Item created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item: MarketplaceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      stock: item.stock.toString(),
      category: item.category,
      status: item.status,
      image: item.image || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteDoc(doc(db, 'marketplaceItems', itemToDelete));
      toast.success('Item deleted successfully');
      fetchItems();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'perlengkapan',
      status: 'active',
      image: '',
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      perlengkapan: '🧳 Perlengkapan',
      souvenir: '🎁 Souvenir',
      makanan: '🍽️ Makanan',
      lainnya: '📦 Lainnya',
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Marketplace Management</h3>
          <p className="text-sm text-gray-500 mt-1">Kelola item marketplace untuk jamaah</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 via-purple-50/95 to-white/95 backdrop-blur-xl border-2 border-purple-200/50 shadow-2xl">
            <DialogHeader className="border-b border-purple-200/30 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                    {editingItem ? 'Edit Marketplace Item' : 'Add New Marketplace Item'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {editingItem ? 'Update item details' : 'Create a new item for marketplace'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <PackageIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Basic Information</h4>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                    placeholder="Mihrab Premium, Tasbih..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                    placeholder="Describe the item..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perlengkapan">🧳 Perlengkapan</SelectItem>
                        <SelectItem value="souvenir">🎁 Souvenir</SelectItem>
                        <SelectItem value="makanan">🍽️ Makanan</SelectItem>
                        <SelectItem value="lainnya">📦 Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">✅ Active</SelectItem>
                        <SelectItem value="inactive">⏸️ Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Pricing & Stock</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Price (IDR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                      placeholder="150000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      min="0"
                      className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Item Photo
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="item-photo-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="item-photo-upload"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all"
                  >
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-purple-600 hover:underline">
                        Choose file
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formData.image ? '✓ Image uploaded' : 'PNG, JPG up to 5MB'}
                      </p>
                    </div>
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-4 relative group">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-xl border-2 border-purple-200 shadow-lg" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm">📸 Preview Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  💡 <strong>Tips:</strong> Item ini akan dijual terpisah dari paket. Jamaah bisa membeli item tambahan melalui marketplace.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-purple-200/30">
                <Button 
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 hover:from-purple-600 hover:via-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {editingItem ? (
                    <>
                      <Edit className="w-5 h-5 mr-2" />
                      Update Item
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Item
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-600 font-medium">No items yet</p>
                    <p className="text-sm text-gray-500">Click "Add Item" to create your first marketplace item</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                  </TableCell>
                  <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    <Badge variant={item.stock > 0 ? 'default' : 'destructive'}>
                      {item.stock} pcs
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-red-50 to-white backdrop-blur-xl border-2 border-red-200/50 shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Confirm deletion of marketplace item
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6 px-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Delete Item?
            </h3>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this marketplace item?
              <br />
              <span className="text-sm text-red-500">This action cannot be undone.</span>
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplaceManagement;
