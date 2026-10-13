import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Book, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subject } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import SubjectDialog from './SubjectDialog';

interface SubjectWithCounts extends Subject {
  chapterCount?: number;
  topicCount?: number;
  questionCount?: number;
}

export default function SubjectsList() {
  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      const list = response.data?.data || response.data?.subjects || (Array.isArray(response.data) ? response.data : []);
      setSubjects(list);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subjects</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage your subjects and organize content</p>
        </div>
        <Button onClick={() => { setEditingSubject(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Subject
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Book className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No subjects found' : 'No subjects yet'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Create your first subject to start building your question bank'}
            </p>
            {!searchTerm && (
              <Button onClick={() => { setEditingSubject(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Create Subject
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card key={subject._id} className="hover:shadow-lg transition-shadow h-full flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Link to={`/subjects/${subject._id}`} className="hover:underline">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </Link>
                    {subject.code && <Badge variant="outline">{subject.code}</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {subject.shared && <Badge variant="secondary">Shared</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit Subject"
                      onClick={() => {
                        setEditingSubject(subject);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{subject.course}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {subject.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {subject.description}
                  </p>
                )}
                <div className="pt-3 border-t flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/subjects/${subject._id}`}>View Syllabus</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SubjectDialog
        open={dialogOpen}
        subject={editingSubject}
        onClose={() => { setDialogOpen(false); setEditingSubject(null); }}
        onSuccess={fetchSubjects}
      />
    </div>
  );
}
