import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Question } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const shortAnswerSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  chapterId: z.string().min(1, 'Chapter is required'),
  topicId: z.string().min(1, 'Topic is required'),
  text: z.string().min(10).max(2000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().min(1).max(100),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional(),
  sampleAnswer: z.string().max(5000).optional(),
  explanation: z.string().max(2000).optional(),
  tags: z.string().optional(),
});

type ShortAnswerFormData = z.infer<typeof shortAnswerSchema>;

interface ShortAnswerQuestionFormProps {
  question?: Question;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ShortAnswerQuestionForm({ question, subjectId, chapterId, topicId, onSuccess, onCancel }: ShortAnswerQuestionFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const getId = (v: any, fallback?: string) =>
    (typeof v === 'object' && v !== null ? v._id : v) || fallback || '';

  const { register, handleSubmit, formState: { errors } } = useForm<ShortAnswerFormData>({
    resolver: zodResolver(shortAnswerSchema),
    defaultValues: {
      subjectId: getId(question?.subjectId, subjectId),
      chapterId: getId(question?.chapterId, chapterId),
      topicId: getId(question?.topicId, topicId),
      text: question?.text || '',
      difficulty: question?.difficulty || 'medium',
      marks: question?.marks || 2,
      bloomLevel: question?.bloomLevel,
      sampleAnswer: question?.sampleAnswer || '',
      explanation: question?.explanation || '',
      tags: question?.tags?.join(', ') || '',
    },
  });

  const onSubmit = async (data: ShortAnswerFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        subjectId: data.subjectId || subjectId,
        chapterId: data.chapterId || chapterId,
        topicId: data.topicId || topicId,
        type: 'short-answer',
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };

      if (question) {
        await api.put(`/questions/${question._id}`, payload);
        toast({ title: 'Success', description: 'Question updated successfully' });
      } else {
        await api.post('/questions', payload);
        toast({ title: 'Success', description: 'Question created successfully' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save question', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('subjectId')} />
      <input type="hidden" {...register('chapterId')} />
      <input type="hidden" {...register('topicId')} />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty *</Label>
          <Select id="difficulty" {...register('difficulty')} disabled={submitting}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marks">Marks *</Label>
          <Input id="marks" type="number" {...register('marks', { valueAsNumber: true })} disabled={submitting} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloomLevel">Bloom Level</Label>
          <Select id="bloomLevel" {...register('bloomLevel')} disabled={submitting}>
            <option value="">Select...</option>
            <option value="remember">Remember</option>
            <option value="understand">Understand</option>
            <option value="apply">Apply</option>
            <option value="analyze">Analyze</option>
            <option value="evaluate">Evaluate</option>
            <option value="create">Create</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Question *</Label>
        <Textarea id="text" placeholder="Enter your question..." rows={4} {...register('text')} disabled={submitting} />
        {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sampleAnswer">Sample Answer (Optional)</Label>
        <Textarea id="sampleAnswer" placeholder="Provide a sample answer for reference..." rows={4} {...register('sampleAnswer')} disabled={submitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation (Optional)</Label>
        <Textarea id="explanation" placeholder="Additional notes or rubric..." rows={3} {...register('explanation')} disabled={submitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <Input id="tags" placeholder="tag1, tag2, tag3" {...register('tags')} disabled={submitting} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : question ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
