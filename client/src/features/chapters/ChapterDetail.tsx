import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chapter, Topic } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import TopicsList from '@/features/topics/TopicsList';

export default function ChapterDetail() {
  const { subjectId, chapterId } = useParams<{ subjectId: string; chapterId: string }>();
  const { toast } = useToast();


  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      fetchChapterAndTopics();
    }
  }, [chapterId]);

  const fetchChapterAndTopics = async () => {
    try {
      const [chapterRes, topicsRes, questionsRes] = await Promise.all([
        api.get(`/chapters/${chapterId}`),
        api.get(`/topics/chapter/${chapterId}`),
        api.get(`/questions?chapterId=${chapterId}&limit=1`),
      ]);
      setChapter(chapterRes.data);
      setTopics(topicsRes.data);
      setQuestionCount(questionsRes.data.pagination?.total || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load chapter details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Chapter not found</h2>
        <Button asChild>
          <Link to={`/subjects/${subjectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subject
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/subjects/${subjectId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{chapter.title}</h1>
              <Badge variant="outline">Chapter {chapter.order}</Badge>
            </div>
            {chapter.description && (
              <p className="text-sm text-muted-foreground mt-2">{chapter.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>

        <Link to={`/questions?subjectId=${subjectId}&chapterId=${chapterId}`} className="block hover:opacity-90 transition-opacity">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionCount}</div>
              <p className="text-xs text-muted-foreground mt-1">View in Question Bank →</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Topics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <TopicsList
            chapterId={chapter._id}
            subjectId={subjectId!}
            topics={topics}
            onTopicsChange={fetchChapterAndTopics}
          />
        </CardContent>
      </Card>
    </div>
  );
}
