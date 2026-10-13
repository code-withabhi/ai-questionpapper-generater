import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Subject } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const subjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  code: z.string().max(50).optional(),
  course: z.string().min(2, 'Course must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  shared: z.boolean().default(false),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subject?: Subject | null;
}

export default function SubjectDialog({
  open,
  onClose,
  onSuccess,
  subject,
}: SubjectDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      code: '',
      course: '',
      description: '',
      shared: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (subject) {
        reset({
          name: subject.name,
          code: subject.code || '',
          course: subject.course,
          description: subject.description || '',
          shared: subject.shared || false,
        });
      } else {
        reset({
          name: '',
          code: '',
          course: '',
          description: '',
          shared: false,
        });
      }
    }
  }, [open, subject, reset]);

  const onSubmit = async (data: SubjectFormData) => {
    setSubmitting(true);
    try {
      if (subject) {
        await api.put(`/subjects/${subject._id}`, data);
        toast({ title: 'Success', description: 'Subject updated successfully' });
      } else {
        await api.post('/subjects', data);
        toast({ title: 'Success', description: 'Subject created successfully' });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save subject',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{subject ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Subject Name *</Label>
            <Input id="name" placeholder="e.g. Data Structures" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="e.g. CS-201" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="course">Course *</Label>
              <Input id="course" placeholder="e.g. B.Tech CS" {...register('course')} />
              {errors.course && <p className="text-xs text-destructive">{errors.course.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief summary of syllabus..."
              rows={3}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shared"
              className="h-4 w-4 rounded border-gray-300 text-primary"
              {...register('shared')}
            />
            <Label htmlFor="shared" className="text-sm font-normal cursor-pointer">
              Share with all teachers
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : subject ? 'Save Changes' : 'Create Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
