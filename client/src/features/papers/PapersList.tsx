import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Paper } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileStack, Plus, Download, Eye, Trash2, Clock, Award, BookOpen } from 'lucide-react';
import PaperGenerateDialog from './PaperGenerateDialog';

export default function PapersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/papers');
      setPapers(res.data.papers || res.data.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load question papers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this question paper?')) return;
    try {
      await api.delete(`/papers/${id}`);
      toast({ title: 'Deleted', description: 'Question paper removed' });
      fetchPapers();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete paper', variant: 'destructive' });
    }
  };

  const handleDownload = async (id: string, type: 'pdf' | 'answer-key', title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/papers/${id}/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${type === 'pdf' ? 'paper' : 'key'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast({ title: 'Download Error', description: 'Failed to export PDF', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileStack className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Question Papers</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Generated papers, answer keys, and PDF exports.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Generate Paper
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : papers.length === 0 ? (
        <div className="p-12 border border-dashed rounded-lg text-center flex flex-col items-center justify-center space-y-3">
          <FileStack className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-sm font-semibold">No Question Papers Yet</div>
          <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Generate Paper</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map(p => {
            const sub = typeof p.subjectId === 'object' && p.subjectId ? p.subjectId : null;
            const qCount = p.sections?.reduce((sum, s) => sum + (s.questionIds?.length || 0), 0) || 0;

            return (
              <Card key={p._id} className="hover:border-primary/50 cursor-pointer" onClick={() => navigate(`/papers/${p._id}`)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base line-clamp-1">{p.title}</h3>
                      {sub && <div className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" /> {sub.name}</div>}
                    </div>
                    <Badge variant={p.status === 'finalized' ? 'success' : 'outline'}>{p.status}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground"><Award className="h-3.5 w-3.5 text-amber-500" /> {p.targetTotalMarks} m</span>
                    <span className="flex items-center gap-1 font-medium text-foreground"><Clock className="h-3.5 w-3.5 text-blue-500" /> {p.durationMinutes} min</span>
                    <span>{qCount} Questions</span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={e => handleDownload(p._id, 'pdf', p.title, e)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Exam PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={e => handleDownload(p._id, 'answer-key', p.title, e)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Key PDF
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/papers/${p._id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={e => handleDelete(p._id, e)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PaperGenerateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={() => fetchPapers()} />
    </div>
  );
}

