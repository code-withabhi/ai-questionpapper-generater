import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Question, PaginatedResponse } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import QuestionFilters from './QuestionFilters';
import QuestionDialog from './QuestionDialog';
import QuestionPreviewDialog from './QuestionPreviewDialog';

export default function QuestionsList() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const initialUrlFilters = {
    subjectId: searchParams.get('subjectId') || '',
    chapterId: searchParams.get('chapterId') || '',
    topicId: searchParams.get('topicId') || '',
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (initialUrlFilters.subjectId) init.subjectId = initialUrlFilters.subjectId;
    if (initialUrlFilters.chapterId) init.chapterId = initialUrlFilters.chapterId;
    if (initialUrlFilters.topicId) init.topicId = initialUrlFilters.topicId;
    return init;
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [pagination.page, filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });
      const res = await api.get<PaginatedResponse<Question>>(`/questions?${params}`);
      setQuestions(res.data.questions);
      setPagination(res.data.pagination);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load questions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;
    setDeleting(true);
    try {
      await api.delete(`/questions/${deletingQuestion._id}`);
      toast({ title: 'Success', description: 'Question deleted successfully' });
      setDeletingQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete question', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return 'success';
    if (diff === 'medium') return 'warning';
    return 'destructive';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'MCQ';
      case 'true-false': return 'T/F';
      case 'short-answer': return 'Short';
      case 'essay': return 'Essay';
      default: return type;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <QuestionFilters initialFilters={initialUrlFilters} onApplyFilters={handleApplyFilters} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-card">
          <div>
            <h1 className="text-2xl font-bold">Question Bank</h1>
            <p className="text-xs text-muted-foreground">{pagination.total} questions found</p>
          </div>
          <Button onClick={() => { setEditingQuestion(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Create Question
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && questions.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-14 w-14 text-muted-foreground/60 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No questions found</h3>
              <p className="text-sm text-muted-foreground mb-4">Adjust your filters or add a new question to the bank.</p>
              <Button onClick={() => { setEditingQuestion(undefined); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Create Question
              </Button>
            </div>
          ) : (
            questions.map(q => {
              const sub = typeof q.subjectId === 'object' && q.subjectId ? q.subjectId.name : null;
              const top = typeof q.topicId === 'object' && q.topicId ? q.topicId.title : null;
              return (
                <Card key={q._id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2 cursor-pointer" onClick={() => setPreviewQuestion(q)}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getDifficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                          <Badge variant="outline">{getTypeLabel(q.type)}</Badge>
                          <Badge variant="secondary">{q.marks} m</Badge>
                          {q.bloomLevel && <Badge variant="outline" className="text-xs">{q.bloomLevel}</Badge>}
                          {sub && <span className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" />{sub}</span>}
                          {top && <span className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" />{top}</span>}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{q.text}</p>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {q.tags.map(t => <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{t}</span>)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" title="Preview" onClick={() => setPreviewQuestion(q)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditingQuestion(q); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeletingQuestion(q)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-3 border-t flex items-center justify-center gap-3 bg-card">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        )}
      </div>

      <QuestionDialog
        open={dialogOpen}
        question={editingQuestion}
        onClose={() => { setDialogOpen(false); setEditingQuestion(undefined); }}
        onSuccess={fetchQuestions}
      />

      <QuestionPreviewDialog
        question={previewQuestion}
        open={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        onEdit={q => { setEditingQuestion(q); setDialogOpen(true); }}
        onDelete={q => setDeletingQuestion(q)}
      />

      {deletingQuestion && (
        <Dialog open={!!deletingQuestion} onOpenChange={() => setDeletingQuestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-muted rounded text-sm line-clamp-3 italic">
              "{deletingQuestion.text}"
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingQuestion(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Delete Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
