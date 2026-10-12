import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, Target, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Topic } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import TopicForm from './TopicForm';
import QuestionDialog from '@/features/questions/QuestionDialog';

interface TopicsListProps {
  chapterId: string;
  subjectId?: string;
  topics: Topic[];
  onTopicsChange: () => void;
}

export default function TopicsList({ chapterId, subjectId, topics, onTopicsChange }: TopicsListProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addQuestionTopic, setAddQuestionTopic] = useState<Topic | null>(null);

  const handleDelete = async () => {
    if (!deletingTopic) return;
    setDeleting(true);
    try {
      await api.delete(`/topics/${deletingTopic._id}`);
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      onTopicsChange();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete topic', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeletingTopic(null);
    }
  };

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-muted-foreground mb-4">No topics yet</p>
        <Button onClick={() => setCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Topic</Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Topic</DialogTitle></DialogHeader>
            <TopicForm chapterId={chapterId} onSuccess={() => { setCreateDialogOpen(false); onTopicsChange(); }} onCancel={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Topic</Button>
      </div>
      {topics.map((topic, index) => (
        <div key={topic._id} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <Badge variant="outline">{index + 1}</Badge>
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-base">{topic.title}</h4>
              {topic.description && <p className="text-sm text-muted-foreground">{topic.description}</p>}
              {topic.learningObjectives && topic.learningObjectives.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />Learning Objectives:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                    {topic.learningObjectives.map((obj, idx) => (<li key={idx} className="list-disc">{obj}</li>))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-4">
            {subjectId && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/questions?subjectId=${subjectId}&chapterId=${chapterId}&topicId=${topic._id}`}>
                    <FileQuestion className="h-3.5 w-3.5 mr-1" />Questions
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAddQuestionTopic(topic)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Q
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setEditingTopic(topic)} title="Edit Topic">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeletingTopic(topic)} title="Delete Topic" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Topic</DialogTitle></DialogHeader>
          <TopicForm chapterId={chapterId} onSuccess={() => { setCreateDialogOpen(false); onTopicsChange(); }} onCancel={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      {editingTopic && (
        <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Edit Topic</DialogTitle></DialogHeader>
            <TopicForm chapterId={chapterId} topic={editingTopic} onSuccess={() => { setEditingTopic(null); onTopicsChange(); }} onCancel={() => setEditingTopic(null)} />
          </DialogContent>
        </Dialog>
      )}
      {deletingTopic && (
        <Dialog open={!!deletingTopic} onOpenChange={() => setDeletingTopic(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Topic</DialogTitle>
              <DialogDescription>Are you sure you want to delete "{deletingTopic.title}"?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingTopic(null)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {addQuestionTopic && (
        <QuestionDialog
          open={!!addQuestionTopic}
          subjectId={subjectId}
          chapterId={chapterId}
          topicId={addQuestionTopic._id}
          onClose={() => setAddQuestionTopic(null)}
          onSuccess={() => {
            setAddQuestionTopic(null);
            onTopicsChange();
          }}
        />
      )}
    </div>
  );
}
