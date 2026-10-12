import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/types';
import { Book, FileQuestion, Layers, FolderTree, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your question bank</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subjects || 0}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chapters || 0}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topics || 0}</div>
            <p className="text-xs text-muted-foreground">Total topics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.questions || 0}</div>
            <p className="text-xs text-muted-foreground">In question bank</p>
          </CardContent>
        </Card>
      </div>



      {/* Question Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Questions by Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Easy</span>
              <Badge variant="success">{stats?.questionsByDifficulty.easy || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium</span>
              <Badge variant="warning">{stats?.questionsByDifficulty.medium || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Hard</span>
              <Badge variant="destructive">{stats?.questionsByDifficulty.hard || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Multiple Choice</span>
              <Badge>{stats?.questionsByType['multiple-choice'] || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">True/False</span>
              <Badge>{stats?.questionsByType['true-false'] || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Short Answer</span>
              <Badge>{stats?.questionsByType['short-answer'] || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Essay</span>
              <Badge>{stats?.questionsByType.essay || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions */}
      {stats?.recentQuestions && stats.recentQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentQuestions.map((q) => {
                const subject = typeof q.subjectId === 'object' ? q.subjectId : null;
                const topic = typeof q.topicId === 'object' ? q.topicId : null;
                return (
                  <div key={q._id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{q.text}</p>
                      <div className="flex items-center gap-2">
                        {subject && (
                          <span className="text-xs text-muted-foreground">{subject.name}</span>
                        )}
                        {topic && <span className="text-xs text-muted-foreground">• {topic.title}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'destructive'}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant="outline">{q.marks}m</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats?.questions === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Building Your Question Bank</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You haven't created any questions yet. Start by creating subjects, then add chapters, topics, and questions to build your comprehensive question bank.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
