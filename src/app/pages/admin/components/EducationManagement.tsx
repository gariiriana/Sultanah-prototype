import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Plus, Edit, Trash, BookOpen, Image as ImageIcon, FileText, AlertTriangle, Eye } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { compressImage, validateImageFile } from '../../../../utils/imageCompression';
import { useAuth } from '../../../../contexts/AuthContext';

interface Education {
  id?: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  content: string;
  imageUrl: string;
  backgroundColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  status: 'active' | 'inactive';
  createdAt: any;
  createdBy: string;
  updatedAt: any;
}

const EducationManagement = () => {
  const { currentUser } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [educationToDelete, setEducationToDelete] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'umrah-guide' as string,
    emoji: '📖',
    content: '',
    imageUrl: '',
    backgroundColor: '#E3F2FD',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchEducations();
  }, []);

  const fetchEducations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'education'));
      const educationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Education[];
      
      // Sort by createdAt descending
      educationsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setEducations(educationsData);
    } catch (error) {
      toast.error('Failed to fetch education resources');
      console.error(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 600, 0.8);
      setFormData({ ...formData, imageUrl: compressed });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const categoryPresets: Record<string, Partial<typeof formData>> = {
    'umrah-guide': {
      emoji: '📖',
      backgroundColor: '#E3F2FD',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    'dua-prayers': {
      emoji: '🤲',
      backgroundColor: '#E8F5E9',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    'sacred-sites': {
      emoji: '🕋',
      backgroundColor: '#FFF8E1',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    'travel-tips': {
      emoji: '✈️',
      backgroundColor: '#F3E5F5',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    'islamic-history': {
      emoji: '🕌',
      backgroundColor: '#FCE4EC',
      borderColor: 'border-pink-200',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
  };

  const handleCategoryChange = (category: string) => {
    const preset = categoryPresets[category] || {};
    setFormData({ ...formData, category, ...preset });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const educationData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        emoji: formData.emoji,
        content: formData.content,
        imageUrl: formData.imageUrl,
        backgroundColor: formData.backgroundColor,
        borderColor: formData.borderColor,
        iconBg: formData.iconBg,
        iconColor: formData.iconColor,
        status: formData.status,
        updatedAt: Timestamp.now(),
      };

      if (editingEducation) {
        await updateDoc(doc(db, 'education', editingEducation.id!), educationData);
        toast.success('Education resource updated successfully!');
      } else {
        await addDoc(collection(db, 'education'), {
          ...educationData,
          createdAt: Timestamp.now(),
          createdBy: currentUser?.uid || 'admin',
        });
        toast.success('Education resource added successfully!');
      }

      resetForm();
      setDialogOpen(false);
      fetchEducations();
    } catch (error) {
      toast.error('Failed to save education resource');
      console.error(error);
    }
  };

  const handleEdit = (education: Education) => {
    setEditingEducation(education);
    setFormData({
      title: education.title,
      description: education.description,
      category: education.category,
      emoji: education.emoji,
      content: education.content,
      imageUrl: education.imageUrl,
      backgroundColor: education.backgroundColor,
      borderColor: education.borderColor,
      iconBg: education.iconBg,
      iconColor: education.iconColor,
      status: education.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!educationToDelete) return;

    try {
      await deleteDoc(doc(db, 'education', educationToDelete));
      toast.success('Education resource deleted successfully!');
      setDeleteDialogOpen(false);
      setEducationToDelete(null);
      fetchEducations();
    } catch (error) {
      toast.error('Failed to delete education resource');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'umrah-guide',
      emoji: '📖',
      content: '',
      imageUrl: '',
      backgroundColor: '#E3F2FD',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      status: 'active',
    });
    setEditingEducation(null);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'umrah-guide': 'Umrah Guide',
      'dua-prayers': 'Dua & Prayers',
      'sacred-sites': 'Sacred Sites',
      'travel-tips': 'Travel Tips',
      'islamic-history': 'Islamic History',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
            Education Resources
          </h3>
          <p className="text-gray-600 mt-1">Manage educational content for users</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Education Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
                {editingEducation ? 'Edit Education Resource' : 'Add New Education Resource'}
              </DialogTitle>
              <DialogDescription>
                Create educational content to help users prepare for their spiritual journey
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="umrah-guide">📖 Umrah Guide</SelectItem>
                    <SelectItem value="dua-prayers">🤲 Dua & Prayers</SelectItem>
                    <SelectItem value="sacred-sites">🕋 Sacred Sites</SelectItem>
                    <SelectItem value="travel-tips">✈️ Travel Tips</SelectItem>
                    <SelectItem value="islamic-history">🕌 Islamic History</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Umrah Rituals Guide"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of this educational resource..."
                  rows={2}
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Full Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed educational content... (You can use paragraphs, bullet points, etc.)"
                  rows={8}
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Cover Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                  />
                  {formData.imageUrl && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Maximum 5MB. JPG, PNG or WebP format.</p>
              </div>

              {/* Emoji */}
              <div className="space-y-2">
                <Label htmlFor="emoji">Icon Emoji</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="📖"
                  className="text-2xl"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90"
                >
                  {editingEducation ? 'Update Resource' : 'Add Resource'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                <TableHead className="font-bold min-w-[300px] max-w-[400px]">Title</TableHead>
                <TableHead className="font-bold w-[140px]">Category</TableHead>
                <TableHead className="font-bold w-[100px]">Status</TableHead>
                <TableHead className="font-bold w-[120px]">Created</TableHead>
                <TableHead className="font-bold text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">No Education Resources Yet</p>
                        <p className="text-sm text-gray-500">Click "Add Education Resource" to create your first resource</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                educations.map((education) => (
                  <TableRow key={education.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="min-w-[300px] max-w-[400px]">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">{education.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{education.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">{education.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <Badge variant="outline" className="font-medium whitespace-nowrap">
                        {getCategoryLabel(education.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      {education.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 whitespace-nowrap">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 whitespace-nowrap">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 w-[120px] whitespace-nowrap">
                      {education.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right w-[100px]">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(education)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEducationToDelete(education.id!);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Education Resource
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this education resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EducationManagement;