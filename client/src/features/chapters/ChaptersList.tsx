import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chapter } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ChapterForm from './ChapterForm';

interface ChaptersListProps {
  subjectId: string;
  chapters: Chapter[];
  onChaptersChange: () => void;
}

export default function ChaptersList({ subjectId, chapters, onChaptersChange }: ChaptersListProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingChapter) return;
    setDeleting(true);
    try {
      await api.delete(`/chapters/${deletingChapter._id}`);
      toast({ title: 'Success', description: 'Chapter deleted successfully' });
      onChaptersChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete chapter',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeletingChapter(null);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground mb-4">No chapters yet</p>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add First Chapter
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chapter</DialogTitle>
            </DialogHeader>
            <ChapterForm
              subjectId={subjectId}
              onSuccess={() => { setCreateDialogOpen(false); onChaptersChange(); }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      {chapters.map((chapter, index) => (
        <div
          key={chapter._id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer group"
        >
          <Link to={`/subjects/${subjectId}/chapters/${chapter._id}`} className="flex items-center gap-3 flex-1">
            <Badge variant="outline">{index + 1}</Badge>
            <div className="flex-1">
              <h4 className="font-medium">{chapter.title}</h4>
              {chapter.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">{chapter.description}</p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditingChapter(chapter)} className="opacity-0 group-hover:opacity-100">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeletingChapter(chapter)} className="opacity-0 group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      ))}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Chapter</DialogTitle>
          </DialogHeader>
          <ChapterForm
            subjectId={subjectId}
            onSuccess={() => { setCreateDialogOpen(false); onChaptersChange(); }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {editingChapter && (
        <Dialog open={!!editingChapter} onOpenChange={() => setEditingChapter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Chapter</DialogTitle>
            </DialogHeader>
            <ChapterForm
              subjectId={subjectId}
              chapter={editingChapter}
              onSuccess={() => { setEditingChapter(null); onChaptersChange(); }}
              onCancel={() => setEditingChapter(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {deletingChapter && (
        <Dialog open={!!deletingChapter} onOpenChange={() => setDeletingChapter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chapter</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingChapter.title}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingChapter(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
