import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Subject } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (newPaper: any) => void;
}

export default function PaperGenerateDialog({ open, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [targetTotalMarks, setTargetTotalMarks] = useState(50);
  const [instructions, setInstructions] = useState('All questions are compulsory.');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/subjects').then(res => setSubjects(res.data.subjects || res.data.data || [])).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title.trim()) {
      toast({ title: 'Validation', description: 'Title and Subject are required', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/papers/generate-dsa', {
        title: title.trim(),
        subjectId,
        durationMinutes: Number(durationMinutes),
        targetTotalMarks: Number(targetTotalMarks),
        instructions,
      });
      toast({ title: 'Paper Generated', description: 'Created balanced question paper successfully' });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.response?.data?.message || 'Failed to generate paper. Make sure your subject question bank has questions.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Paper with DSA Engine
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Examination Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Examination 2026" required />
          </div>
          <div className="space-y-1">
            <Label>Subject *</Label>
            <Select value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Total Marks</Label>
              <Input type="number" min={10} max={200} value={targetTotalMarks} onChange={e => setTargetTotalMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Duration (Mins)</Label>
              <Input type="number" min={15} max={300} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Instructions</Label>
            <Input value={instructions} onChange={e => setInstructions(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={generating}>Cancel</Button>
            <Button type="submit" disabled={generating}>
              {generating ? <span className="flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" /> Generating...</span> : 'Generate Paper'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
