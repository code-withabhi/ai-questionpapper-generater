import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Subject, Chapter, Topic } from '@/types';
import { api } from '@/lib/api';

interface QuestionFiltersProps {
  initialFilters?: Record<string, string>;
  onApplyFilters: (filters: any) => void;
}

export default function QuestionFilters({ initialFilters, onApplyFilters }: QuestionFiltersProps) {
  const [filters, setFilters] = useState({
    subjectId: initialFilters?.subjectId || '',
    chapterId: initialFilters?.chapterId || '',
    topicId: initialFilters?.topicId || '',
    type: initialFilters?.type || '',
    difficulty: initialFilters?.difficulty || '',
    bloomLevel: initialFilters?.bloomLevel || '',
    minMarks: initialFilters?.minMarks || '',
    maxMarks: initialFilters?.maxMarks || '',
    tags: initialFilters?.tags || '',
    search: initialFilters?.search || '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    api.get('/subjects?limit=100').then(res => setSubjects(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.subjectId) {
      api.get(`/chapters/subject/${filters.subjectId}`).then(res => setChapters(res.data || [])).catch(() => {});
    } else {
      setChapters([]);
      setTopics([]);
      setFilters(p => ({ ...p, chapterId: '', topicId: '' }));
    }
  }, [filters.subjectId]);

  useEffect(() => {
    if (filters.chapterId) {
      api.get(`/topics/chapter/${filters.chapterId}`).then(res => setTopics(res.data || [])).catch(() => {});
    } else {
      setTopics([]);
      setFilters(p => ({ ...p, topicId: '' }));
    }
  }, [filters.chapterId]);

  const handleChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    const active: any = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) active[k] = v; });
    onApplyFilters(active);
  };

  const handleClear = () => {
    setFilters({ subjectId: '', chapterId: '', topicId: '', type: '', difficulty: '', bloomLevel: '', minMarks: '', maxMarks: '', tags: '', search: '' });
    onApplyFilters({});
  };

  return (
    <div className="w-80 p-4 border-r bg-background space-y-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />Clear
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input id="search" placeholder="Search questions..." value={filters.search} onChange={e => handleChange('search', e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="filterSubject">Subject</Label>
          <Select id="filterSubject" value={filters.subjectId} onChange={e => handleChange('subjectId', e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || s.course})</option>)}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filterChapter">Chapter</Label>
          <Select id="filterChapter" disabled={!filters.subjectId} value={filters.chapterId} onChange={e => handleChange('chapterId', e.target.value)}>
            <option value="">All Chapters</option>
            {chapters.map(c => <option key={c._id} value={c._id}>Ch {c.order}: {c.title}</option>)}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filterTopic">Topic</Label>
          <Select id="filterTopic" disabled={!filters.chapterId} value={filters.topicId} onChange={e => handleChange('topicId', e.target.value)}>
            <option value="">All Topics</option>
            {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>
          <Select id="type" value={filters.type} onChange={e => handleChange('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="short-answer">Short Answer</option>
            <option value="essay">Essay</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" value={filters.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bloomLevel">Bloom Level</Label>
          <Select id="bloomLevel" value={filters.bloomLevel} onChange={e => handleChange('bloomLevel', e.target.value)}>
            <option value="">All Levels</option>
            <option value="remember">Remember</option>
            <option value="understand">Understand</option>
            <option value="apply">Apply</option>
            <option value="analyze">Analyze</option>
            <option value="evaluate">Evaluate</option>
            <option value="create">Create</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Marks Range</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="Min" value={filters.minMarks} onChange={e => handleChange('minMarks', e.target.value)} />
            <Input type="number" placeholder="Max" value={filters.maxMarks} onChange={e => handleChange('maxMarks', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" placeholder="Comma separated" value={filters.tags} onChange={e => handleChange('tags', e.target.value)} />
        </div>

        <Button className="w-full mt-2" onClick={handleApply}>
          <Filter className="h-4 w-4 mr-2" />Apply Filters
        </Button>
      </div>
    </div>
  );
}
