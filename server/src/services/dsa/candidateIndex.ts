import { QuestionCandidate } from './types.js';

export class CandidateIndex {
  private byTopic: Map<string, QuestionCandidate[]> = new Map();
  private byDifficulty: Map<string, QuestionCandidate[]> = new Map();
  private byType: Map<string, QuestionCandidate[]> = new Map();
  private byMarks: Map<number, QuestionCandidate[]> = new Map();
  private seenHashes: Set<string> = new Set();
  private uniqueCandidates: QuestionCandidate[] = [];
  public duplicatesPruned = 0;

  constructor(candidates: QuestionCandidate[]) {
    this.indexCandidates(candidates);
  }

  private indexCandidates(candidates: QuestionCandidate[]): void {
    for (const q of candidates) {
      const hash = q.normalizedTextHash || q.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
      
      // Exact duplicate pruning via Set
      if (this.seenHashes.has(hash)) {
        this.duplicatesPruned++;
        continue;
      }
      this.seenHashes.add(hash);
      this.uniqueCandidates.push(q);

      // Index by Topic
      if (q.topicId) {
        const list = this.byTopic.get(q.topicId) || [];
        list.push(q);
        this.byTopic.set(q.topicId, list);
      }

      // Index by Difficulty
      const diffList = this.byDifficulty.get(q.difficulty) || [];
      diffList.push(q);
      this.byDifficulty.set(q.difficulty, diffList);

      // Index by Question Type
      const typeList = this.byType.get(q.questionType) || [];
      typeList.push(q);
      this.byType.set(q.questionType, typeList);

      // Index by Marks
      const marksList = this.byMarks.get(q.marks) || [];
      marksList.push(q);
      this.byMarks.set(q.marks, marksList);
    }
  }

  public getAll(): QuestionCandidate[] {
    return [...this.uniqueCandidates];
  }

  public getByType(types: string[]): QuestionCandidate[] {
    const res: QuestionCandidate[] = [];
    for (const t of types) {
      const found = this.byType.get(t);
      if (found) res.push(...found);
    }
    return res;
  }

  public getByDifficulty(difficulty: string): QuestionCandidate[] {
    return this.byDifficulty.get(difficulty) || [];
  }

  public getByMarks(marks: number): QuestionCandidate[] {
    return this.byMarks.get(marks) || [];
  }

  public size(): number {
    return this.uniqueCandidates.length;
  }
}
