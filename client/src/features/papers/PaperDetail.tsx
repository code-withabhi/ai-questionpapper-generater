import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Paper } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Award, Clock, BookOpen, Trash2, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<any>(null);

  const fetchPaper = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/papers/${id}`);
      setPaper(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load paper', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaper();
  }, [id]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await api.get(`/papers/${id}/validate`);
      setValidationReport(res.data.report);
      if (res.data.report?.isValid) {
        toast({ title: 'Validation Passed', description: `Marks: ${res.data.report.actualTotalMarks} / ${res.data.report.targetTotalMarks}` });
      } else {
        toast({ title: 'Validation Warning', description: res.data.report.errors.join('; '), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Validation Failed', description: 'Could not run validation check', variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = async (type: 'pdf' | 'answer-key') => {
    if (!paper) return;
    try {
      const res = await api.get(`/papers/${id}/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}_${type === 'pdf' ? 'paper' : 'key'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast({ title: 'Download Error', description: 'Failed to export PDF', variant: 'destructive' });
    }
  };

  const handleFinalize = async () => {
    if (!paper) return;
    try {
      const res = await api.post(`/papers/${id}/finalize`);
      setPaper(res.data.paper);
      toast({ title: 'Success', description: 'Paper finalized' });
    } catch {
      toast({ title: 'Error', description: 'Failed to finalize paper', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this question paper?')) return;
    try {
      await api.delete(`/papers/${id}`);
      toast({ title: 'Success', description: 'Question paper deleted' });
      navigate('/papers');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete paper', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading paper details...</div>;
  }
  if (!paper) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Paper not found.</div>;
  }

  const sub = typeof paper.subjectId === 'object' && paper.subjectId ? paper.subjectId : null;
  let qNum = 1;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/papers')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Papers
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleValidate} disabled={validating}>
            <ShieldCheck className="h-4 w-4 mr-1 text-primary" /> {validating ? 'Validating...' : 'Validate Constraints'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
            <Download className="h-4 w-4 mr-1" /> Exam PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('answer-key')}>
            <Download className="h-4 w-4 mr-1" /> Answer Key PDF
          </Button>
          {paper.status === 'draft' ? (
            <Button variant="outline" size="sm" onClick={handleFinalize}>
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Finalize Paper
            </Button>
          ) : (
            <Badge variant="success" className="px-2.5 py-1 text-xs">Finalized</Badge>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {validationReport && (
        <Card className={`border ${validationReport.isValid ? 'border-green-300 bg-green-50/20' : 'border-amber-300 bg-amber-50/20'}`}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-sm">
                {validationReport.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <span>Constraint Verification: {validationReport.isValid ? 'Passed' : 'Issues Found'}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Marks: {validationReport.actualTotalMarks} / {validationReport.targetTotalMarks}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              <span>Easy: {validationReport.difficultyBreakdown.easyPercent}%</span>
              <span>Medium: {validationReport.difficultyBreakdown.mediumPercent}%</span>
              <span>Hard: {validationReport.difficultyBreakdown.hardPercent}%</span>
              <span>Topics Covered: {validationReport.topicCoverage.totalTopicsCovered}</span>
            </div>
            {validationReport.errors?.length > 0 && (
              <div className="text-xs text-destructive space-y-0.5 pt-1">
                {validationReport.errors.map((e: string, idx: number) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-2 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-bold">{paper.title}</CardTitle>
              <Badge variant="outline" className="text-xs">v{paper.version || 1}</Badge>
            </div>
            <Badge variant={paper.status === 'finalized' ? 'success' : 'outline'} className="capitalize">{paper.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {sub && <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /> {sub.name} ({sub.code})</span>}
            <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-amber-500" /> {paper.targetTotalMarks} Total Marks</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-500" /> {paper.durationMinutes} Minutes</span>
          </div>
          {paper.instructions && (
            <div className="text-xs bg-muted/40 p-2.5 rounded border text-muted-foreground mt-2">
              <span className="font-semibold text-foreground">Instructions:</span> {paper.instructions}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {paper.sections?.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-bold text-base">{sec.title}</h3>
                {sec.instructions && <p className="text-xs text-muted-foreground italic">{sec.instructions}</p>}
              </div>

              <div className="space-y-3">
                {(sec.questionIds as any[])?.map((q: any) => {
                  const currentNum = qNum++;
                  const text = q.questionText || q.text || 'Question text';
                  return (
                    <div key={q._id || currentNum} className="p-4 rounded-lg border bg-card/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">
                          <span className="font-bold mr-1">Q{currentNum}.</span> {text}
                        </div>
                        <Badge variant="secondary" className="shrink-0">{q.marks || sec.marksPerQuestion || 1} m</Badge>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className={`text-xs p-2 rounded border ${opt.isCorrect ? 'border-green-500 bg-green-50/50 font-medium' : 'bg-muted/20'}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt.text} {opt.isCorrect && '✓'}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.correctAnswer && !q.options?.length && (
                        <div className="text-xs p-2 rounded bg-green-50/50 border text-green-800">
                          <span className="font-semibold">Correct Answer:</span> {q.correctAnswer}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="text-xs p-2 rounded bg-muted/30 border text-muted-foreground">
                          <span className="font-semibold text-foreground">Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

