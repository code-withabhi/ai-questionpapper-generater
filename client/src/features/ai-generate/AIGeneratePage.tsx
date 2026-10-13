import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Subject, Chapter, Topic } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChapterForm from '@/features/chapters/ChapterForm';
import TopicForm from '@/features/topics/TopicForm';
import { Sparkles, Brain, Check, Save, Loader2, Plus, BookOpen } from 'lucide-react';

interface GeneratedQ {
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
  bloomLevel?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  markingScheme?: string;
  saved?: boolean;
}

export default function AIGeneratePage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [difficulty, setDifficulty] = useState('medium');
  const [bloomLevel, setBloomLevel] = useState('apply');
  const [marks, setMarks] = useState(2);
  const [count, setCount] = useState(3);

  const [generating, setGenerating] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [results, setResults] = useState<GeneratedQ[]>([]);

  const [createChapterOpen, setCreateChapterOpen] = useState(false);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);

  useEffect(() => {
    api.get('/subjects').then(res => setSubjects(res.data.subjects || res.data.data || [])).catch(() => {});
  }, []);

  const loadChapters = async (subId: string) => {
    try {
      const res = await api.get(`/chapters/subject/${subId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data.chapters || res.data.data || []);
      setChapters(list);
    } catch {
      setChapters([]);
    }
  };

  const loadTopics = async (chapId: string) => {
    try {
      const res = await api.get(`/topics/chapter/${chapId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data.topics || res.data.data || []);
      setTopics(list);
    } catch {
      setTopics([]);
    }
  };

  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setSelectedChapter('');
      return;
    }
    loadChapters(selectedSubject);
    setSelectedChapter('');
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || !selectedChapter) {
      setTopics([]);
      setSelectedTopic('');
      return;
    }
    loadTopics(selectedChapter);
    setSelectedTopic('');
  }, [selectedSubject, selectedChapter]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedChapter || !selectedTopic) {
      toast({ title: 'Validation', description: 'Select subject, chapter, and topic', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setResults([]);
    try {
      const res = await api.post('/ai/generate-questions', {
        subjectId: selectedSubject, chapterId: selectedChapter, topicId: selectedTopic,
        questionType, difficulty, bloomLevel, marks: Number(marks), count: Number(count),
      });
      setResults(res.data.questions || []);
      toast({ title: 'Success', description: `Generated ${res.data.count || res.data.questions?.length} questions` });
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.response?.data?.message || 'Check Gemini API Key', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveOne = async (index: number) => {
    const q = results[index];
    try {
      await api.post('/ai/save-questions', {
        subjectId: selectedSubject, chapterId: selectedChapter, topicId: selectedTopic, questions: [q],
      });
      setResults(prev => prev.map((item, idx) => idx === index ? { ...item, saved: true } : item));
      toast({ title: 'Saved', description: 'Added to Question Bank' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleSaveAll = async () => {
    const unsaved = results.filter(q => !q.saved);
    if (!unsaved.length) return;
    setSavingAll(true);
    try {
      await api.post('/ai/save-questions', {
        subjectId: selectedSubject, chapterId: selectedChapter, topicId: selectedTopic, questions: unsaved,
      });
      setResults(prev => prev.map(item => ({ ...item, saved: true })));
      toast({ title: 'Saved', description: `Added ${unsaved.length} questions to bank` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save questions', variant: 'destructive' });
    } finally {
      setSavingAll(false);
    }
  };
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Question Generator</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div>
                <Label>Subject</Label>
                <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Chapter</Label>
                  {selectedSubject && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[11px] text-primary hover:text-primary"
                      onClick={() => setCreateChapterOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />New
                    </Button>
                  )}
                </div>
                <Select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} disabled={!selectedSubject} required>
                  <option value="">
                    {!selectedSubject ? 'Select subject first...' : chapters.length === 0 ? 'No chapters found (click +New)' : 'Select chapter...'}
                  </option>
                  {chapters.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Topic</Label>
                  {selectedChapter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[11px] text-primary hover:text-primary"
                      onClick={() => setCreateTopicOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />New
                    </Button>
                  )}
                </div>
                <Select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} disabled={!selectedChapter} required>
                  <option value="">
                    {!selectedChapter ? 'Select chapter first...' : topics.length === 0 ? 'No topics found (click +New)' : 'Select topic...'}
                  </option>
                  {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={questionType} onChange={e => setQuestionType(e.target.value)}>
                  <option value="multiple-choice">MCQ</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </Select>
                </div>
                <div>
                  <Label>Bloom</Label>
                  <Select value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}>
                    <option value="remember">Remember</option><option value="understand">Understand</option><option value="apply">Apply</option><option value="analyze">Analyze</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Marks</Label>
                  <Input type="number" min={1} max={50} value={marks} onChange={e => setMarks(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Count (1-5)</Label>
                  <Input type="number" min={1} max={5} value={count} onChange={e => setCount(Number(e.target.value))} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={generating || !selectedTopic}>
                {generating ? <span className="flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin" /> Generating...</span> : <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> Generate</span>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Results ({results.length})</h2>
            {results.length > 0 && results.some(q => !q.saved) && (
              <Button size="sm" onClick={handleSaveAll} disabled={savingAll}>
                <Save className="h-4 w-4 mr-1" />{savingAll ? 'Saving...' : 'Save All'}
              </Button>
            )}
          </div>
          {generating && (
            <div className="p-8 border rounded-lg text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <div className="text-sm font-semibold">Gemini is synthesizing questions...</div>
            </div>
          )}
          {!generating && results.length === 0 && (
            <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-xs">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Configure parameters on the left and click Generate.
            </div>
          )}
          {!generating && results.map((q, idx) => (
            <Card key={idx} className={q.saved ? 'border-green-500/50 bg-green-50/10' : ''}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Badge variant="outline">{q.questionType}</Badge>
                    <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'destructive'}>{q.difficulty}</Badge>
                    <Badge variant="secondary">{q.marks} m</Badge>
                  </div>
                  {q.saved ? (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleSaveOne(idx)}><Plus className="h-3 w-3 mr-1" /> Save</Button>
                  )}
                </div>
                <div className="text-sm font-medium">{q.questionText}</div>
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`text-xs p-1.5 rounded border ${opt.isCorrect ? 'border-green-500 bg-green-50/50 font-medium' : 'bg-muted/30'}`}>
                        {String.fromCharCode(65 + oIdx)}. {opt.text}
                      </div>
                    ))}
                  </div>
                )}
                {q.correctAnswer && !q.options?.length && (
                  <div className="text-xs p-1.5 rounded bg-green-50/50 border text-green-700">Answer: {q.correctAnswer}</div>
                )}
                {q.explanation && (
                  <div className="text-xs p-1.5 rounded bg-muted/40 border text-muted-foreground">Explanation: {q.explanation}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Create Chapter Dialog */}
      {selectedSubject && (
        <Dialog open={createChapterOpen} onOpenChange={setCreateChapterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chapter</DialogTitle>
            </DialogHeader>
            <ChapterForm
              subjectId={selectedSubject}
              onSuccess={() => {
                setCreateChapterOpen(false);
                loadChapters(selectedSubject);
              }}
              onCancel={() => setCreateChapterOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Create Topic Dialog */}
      {selectedChapter && (
        <Dialog open={createTopicOpen} onOpenChange={setCreateTopicOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Topic</DialogTitle>
            </DialogHeader>
            <TopicForm
              chapterId={selectedChapter}
              onSuccess={() => {
                setCreateTopicOpen(false);
                loadTopics(selectedChapter);
              }}
              onCancel={() => setCreateTopicOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


