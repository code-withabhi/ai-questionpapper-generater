import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Chapter } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const chapterSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface ChapterFormProps {
  subjectId: string;
  chapter?: Chapter;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChapterForm({ subjectId, chapter, onSuccess, onCancel }: ChapterFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: chapter?.title || '',
      description: chapter?.description || '',
    },
  });

  const onSubmit = async (data: ChapterFormData) => {
    setSubmitting(true);
    try {
      if (chapter) {
        await api.put(`/chapters/${chapter._id}`, data);
        toast({
          title: 'Success',
          description: 'Chapter updated successfully',
        });
      } else {
        await api.post('/chapters', {
          ...data,
          subjectId,
        });
        toast({
          title: 'Success',
          description: 'Chapter created successfully',
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save chapter',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          Chapter Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Introduction to Programming"
          {...register('title')}
          disabled={submitting}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of this chapter..."
          rows={3}
          {...register('description')}
          disabled={submitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : chapter ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
