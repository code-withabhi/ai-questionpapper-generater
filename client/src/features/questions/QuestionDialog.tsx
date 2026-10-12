import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Question, QuestionType, Subject, Chapter, Topic } from '@/types';
import { api } from '@/lib/api';
import MCQQuestionForm from './MCQQuestionForm';
import TrueFalseQuestionForm from './TrueFalseQuestionForm';
import ShortAnswerQuestionForm from './ShortAnswerQuestionForm';
import EssayQuestionForm from './EssayQuestionForm';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: Question;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
}

const getId = (val: any, fallback?: string) =>
  (typeof val === 'object' && val !== null ? val._id : val) || fallback || '';

export default function QuestionDialog({ open, onClose, onSuccess, question, subjectId: initSub, chapterId: initChap, topicId: initTop }: Props) {
  const [subId, setSubId] = useState('');
  const [chapId, setChapId] = useState('');
  const [topId, setTopId] = useState('');
  const [type, setType] = useState<QuestionType | ''>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (open) {
      const s = getId(question?.subjectId, initSub);
      const c = getId(question?.chapterId, initChap);
      const t = getId(question?.topicId, initTop);
      setSubId(s);
      setChapId(c);
      setTopId(t);
      setType(question?.type || '');

      api.get('/subjects?limit=100').then(res => setSubjects(res.data.data || [])).catch(() => {});
      if (s) api.get(`/chapters/subject/${s}`).then(res => setChapters(res.data || [])).catch(() => {});
      if (c) api.get(`/topics/chapter/${c}`).then(res => setTopics(res.data || [])).catch(() => {});
    }
  }, [open, question, initSub, initChap, initTop]);

  const onSubChange = (id: string) => {
    setSubId(id); setChapId(''); setTopId(''); setChapters([]); setTopics([]);
    if (id) api.get(`/chapters/subject/${id}`).then(res => setChapters(res.data || [])).catch(() => {});
  };

  const onChapChange = (id: string) => {
    setChapId(id); setTopId(''); setTopics([]);
    if (id) api.get(`/topics/chapter/${id}`).then(res => setTopics(res.data || [])).catch(() => {});
  };

  const handleSuccess = () => { onSuccess(); onClose(); };
  const formProps = { question, subjectId: subId, chapterId: chapId, topicId: topId, onSuccess: handleSuccess, onCancel: onClose };
  const canShowForm = subId && chapId && topId && type;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'Create Question'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border">
            <div>
              <Label className="text-xs">Subject *</Label>
              <Select value={subId} disabled={!!question} onChange={e => onSubChange(e.target.value)}>
                <option value="">Select Subject...</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Chapter *</Label>
              <Select value={chapId} disabled={!subId || !!question} onChange={e => onChapChange(e.target.value)}>
                <option value="">Select Chapter...</option>
                {chapters.map(c => <option key={c._id} value={c._id}>Ch {c.order}: {c.title}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Topic *</Label>
              <Select value={topId} disabled={!chapId || !!question} onChange={e => setTopId(e.target.value)}>
                <option value="">Select Topic...</option>
                {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Question Type *</Label>
            <Select value={type} disabled={!!question} onChange={e => setType(e.target.value as QuestionType)}>
              <option value="">Select Type...</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
              <option value="essay">Essay</option>
            </Select>
          </div>

          {!canShowForm && !question && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Please select a Subject, Chapter, Topic, and Question Type to fill out the question details.
            </p>
          )}

          {canShowForm && (
            <div className="pt-2 border-t">
              {type === 'multiple-choice' && <MCQQuestionForm key={`${topId}-mcq`} {...formProps} />}
              {type === 'true-false' && <TrueFalseQuestionForm key={`${topId}-tf`} {...formProps} />}
              {type === 'short-answer' && <ShortAnswerQuestionForm key={`${topId}-sa`} {...formProps} />}
              {type === 'essay' && <EssayQuestionForm key={`${topId}-es`} {...formProps} />}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

