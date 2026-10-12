import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { Topic } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const topicSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
  learningObjectives: z.array(z.object({ value: z.string() })),
});

type TopicFormData = z.infer<typeof topicSchema>;

interface TopicFormProps {
  chapterId: string;
  topic?: Topic;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TopicForm({ chapterId, topic, onSuccess, onCancel }: TopicFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<TopicFormData>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: topic?.title || '',
      description: topic?.description || '',
      learningObjectives: topic?.learningObjectives && topic.learningObjectives.length > 0 
        ? topic.learningObjectives.map(obj => ({ value: obj }))
        : [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'learningObjectives' });

  const onSubmit = async (data: TopicFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        learningObjectives: data.learningObjectives.map(obj => obj.value).filter(obj => obj.trim() !== ''),
      };
      if (topic) {
        await api.put(`/topics/${topic._id}`, payload);
        toast({ title: 'Success', description: 'Topic updated successfully' });
      } else {
        await api.post('/topics', { ...payload, chapterId });
        toast({ title: 'Success', description: 'Topic created successfully' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save topic', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Topic Title <span className="text-destructive">*</span></Label>
        <Input id="title" placeholder="e.g., Variables and Data Types" {...register('title')} disabled={submitting} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Brief description..." rows={3} {...register('description')} disabled={submitting} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Learning Objectives</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })} disabled={submitting}>
            <Plus className="h-4 w-4 mr-1" />Add Objective
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input placeholder={`Learning objective ${index + 1}`} {...register(`learningObjectives.${index}.value`)} disabled={submitting} />
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={submitting}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : topic ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
