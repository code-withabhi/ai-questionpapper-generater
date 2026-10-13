import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Question } from '@/types';
import { Check, Edit, Trash2, BookOpen, Layers } from 'lucide-react';

interface Props {
  question: Question | null;
  open: boolean;
  onClose: () => void;
  onEdit: (q: Question) => void;
  onDelete: (q: Question) => void;
}

export default function QuestionPreviewDialog({ question, open, onClose, onEdit, onDelete }: Props) {
  if (!question) return null;

  const subject = typeof question.subjectId === 'object' && question.subjectId ? question.subjectId.name : null;
  const topic = typeof question.topicId === 'object' && question.topicId ? question.topicId.title : null;
  const qText = question.text || (question as any).questionText;
  const qType = question.type || (question as any).questionType;

  const getDifficultyBadge = (diff: string) => {
    if (diff === 'easy') return <Badge variant="success">Easy</Badge>;
    if (diff === 'medium') return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="destructive">Hard</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold">Question Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(question); }}>
                <Edit className="h-4 w-4 mr-1" />Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { onClose(); onDelete(question); }}>
                <Trash2 className="h-4 w-4 mr-1" />Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {getDifficultyBadge(question.difficulty)}
            <Badge variant="outline" className="capitalize">{qType}</Badge>
            <Badge variant="secondary">{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}</Badge>
            {question.bloomLevel && <Badge variant="outline">Bloom: {question.bloomLevel}</Badge>}
          </div>

          {(subject || topic) && (
            <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/40 p-3 rounded-lg border">
              {subject && <span className="flex items-center gap-1 font-medium"><BookOpen className="h-4 w-4 text-primary" />{subject}</span>}
              {topic && <span className="flex items-center gap-1 font-medium"><Layers className="h-4 w-4 text-primary" />{topic}</span>}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Question</h4>
            <div className="p-4 bg-muted/20 border rounded-lg whitespace-pre-wrap text-base font-medium">{qText}</div>
          </div>

          {(qType === 'multiple-choice' || (qType as string) === 'mcq-single' || (qType as string) === 'mcq-multiple') && question.options && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Options</h4>
              <div className="space-y-2">
                {question.options.map((opt, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${opt.isCorrect ? 'border-green-500 bg-green-50/50' : 'border-border'}`}>
                    <span className="font-semibold text-xs mt-0.5">{String.fromCharCode(65 + idx)}.</span>
                    <span className="flex-1 text-sm">{opt.text}</span>
                    {opt.isCorrect && <span className="text-xs font-medium text-green-600 flex items-center gap-1"><Check className="h-4 w-4" />Correct</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === 'true-false' && question.correctAnswer && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Correct Answer</h4>
              <div className="p-3 border rounded-lg bg-green-50/50 border-green-500 text-sm font-semibold capitalize flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />{question.correctAnswer}
              </div>
            </div>
          )}

          {question.sampleAnswer && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                {question.type === 'essay' ? 'Model Answer / Rubric' : 'Sample Answer'}
              </h4>
              <div className="p-4 bg-muted/20 border rounded-lg whitespace-pre-wrap text-sm">{question.sampleAnswer}</div>
            </div>
          )}

          {question.explanation && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Explanation</h4>
              <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-lg text-sm whitespace-pre-wrap">{question.explanation}</div>
            </div>
          )}

          {question.tags && question.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {question.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
