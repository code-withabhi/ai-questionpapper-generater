import {
  QuestionCandidate,
  PaperGenerationCriteria,
  GenerationEngineResult,
  SectionRule,
} from './types.js';
import { CandidateIndex } from './candidateIndex.js';
import { PaperConstraintValidator } from './validator.js';

export class DSAPaperEngine {
  private startTime = 0;
  private readonly maxSearchNodes = 10000;

  public generate(
    candidates: QuestionCandidate[],
    criteria: PaperGenerationCriteria
  ): GenerationEngineResult {
    this.startTime = Date.now();
    const index = new CandidateIndex(candidates);

    if (index.size() === 0) {
      return this.failureResult(
        'Empty candidate pool. Please add questions to the question bank before generating.',
        index,
        criteria
      );
    }

    const sectionRules: SectionRule[] = criteria.sectionRules && criteria.sectionRules.length > 0
      ? criteria.sectionRules
      : this.deriveDefaultSections(criteria.targetTotalMarks);

    const globallyChosenIds = new Set<string>();
    const sectionResults: Array<{
      title: string;
      instructions?: string;
      marksPerQuestion: number;
      questionIds: string[];
      questions: QuestionCandidate[];
      sectionMarks: number;
    }> = [];

    const topicCounts = new Map<string, number>();

    for (const rule of sectionRules) {
      const pool = index.getAll().filter(
        (q) => !globallyChosenIds.has(q._id) && (rule.allowedTypes.length === 0 || rule.allowedTypes.includes(q.questionType))
      );

      const scoredPool = this.greedyRankCandidates(pool, topicCounts, criteria);
      const selected = this.boundedSubsetSum(scoredPool, rule.targetMarks);

      if (!selected) {
        return this.failureResult(
          `Unable to satisfy constraints for "${rule.title}". Needed ${rule.targetMarks} marks from [${rule.allowedTypes.join(', ')}], but inventory is insufficient.`,
          index,
          criteria
        );
      }

      for (const q of selected) {
        globallyChosenIds.add(q._id);
        if (q.topicId) {
          topicCounts.set(q.topicId, (topicCounts.get(q.topicId) || 0) + 1);
        }
      }

      const secMarks = selected.reduce((sum, q) => sum + (q.marks || 1), 0);
      const marksPerQ = selected.length > 0 && selected[0] ? (selected[0].marks || 1) : (rule.marksPerQuestion || 1);

      sectionResults.push({
        title: rule.title,
        instructions: rule.instructions,
        marksPerQuestion: marksPerQ,
        questionIds: selected.map((q) => q._id),
        questions: selected,
        sectionMarks: secMarks,
      });
    }

    const allChosen = sectionResults.flatMap((s) => s.questions);
    const validationReport = PaperConstraintValidator.validate(allChosen, criteria);
    const execTime = Date.now() - this.startTime;

    return {
      success: validationReport.isValid,
      sections: sectionResults,
      totalMarks: validationReport.actualTotalMarks,
      validationReport,
      algorithmSummary: {
        candidatePoolSize: candidates.length,
        duplicatesPruned: index.duplicatesPruned,
        searchStrategy: 'greedy-backtracking',
        executionTimeMs: execTime,
      },
    };
  }

  private greedyRankCandidates(
    pool: QuestionCandidate[],
    topicCounts: Map<string, number>,
    criteria: PaperGenerationCriteria
  ): QuestionCandidate[] {
    return [...pool].sort((a, b) => {
      let scoreA = 100;
      let scoreB = 100;

      const countA = a.topicId ? (topicCounts.get(a.topicId) || 0) : 0;
      const countB = b.topicId ? (topicCounts.get(b.topicId) || 0) : 0;
      scoreA -= countA * 20;
      scoreB -= countB * 20;

      scoreA -= (a.usageCount || 0) * 10;
      scoreB -= (b.usageCount || 0) * 10;

      if (criteria.requiredTopicIds) {
        if (a.topicId && criteria.requiredTopicIds.includes(a.topicId)) scoreA += 50;
        if (b.topicId && criteria.requiredTopicIds.includes(b.topicId)) scoreB += 50;
      }

      return scoreB - scoreA;
    });
  }

  private boundedSubsetSum(
    candidates: QuestionCandidate[],
    targetMarks: number
  ): QuestionCandidate[] | null {
    if (targetMarks === 0) return [];
    if (candidates.length === 0) return null;

    let nodeCount = 0;
    const maxNodes = this.maxSearchNodes;

    let running = 0;
    const greedySet: QuestionCandidate[] = [];
    for (const c of candidates) {
      if (running + (c.marks || 1) <= targetMarks) {
        greedySet.push(c);
        running += (c.marks || 1);
        if (running === targetMarks) return greedySet;
      }
    }

    function backtrack(
      index: number,
      remaining: number,
      current: QuestionCandidate[]
    ): QuestionCandidate[] | null {
      nodeCount++;
      if (nodeCount > maxNodes) return null;

      if (remaining === 0) return current;
      if (index >= candidates.length || remaining < 0) return null;

      const q = candidates[index];
      if (!q) return null;
      const marks = q.marks || 1;

      if (marks <= remaining) {
        const found = backtrack(index + 1, remaining - marks, [...current, q]);
        if (found) return found;
      }

      return backtrack(index + 1, remaining, current);
    }

    return backtrack(0, targetMarks, []);
  }

  private deriveDefaultSections(targetMarks: number): SectionRule[] {
    const secAMarks = Math.max(1, Math.round(targetMarks * 0.25));
    const secBMarks = Math.max(1, Math.round(targetMarks * 0.45));
    const secCMarks = targetMarks - secAMarks - secBMarks;

    const rules: SectionRule[] = [];

    rules.push({
      title: 'Section A: Objective Questions',
      instructions: 'Answer all questions. Each question carries 1 mark.',
      allowedTypes: ['mcq-single', 'mcq-multiple', 'true-false', 'fill-blank'],
      marksPerQuestion: 1,
      targetMarks: secAMarks,
    });

    rules.push({
      title: 'Section B: Short Answer Questions',
      instructions: 'Answer in 30-50 words.',
      allowedTypes: ['short-answer', 'numerical'],
      marksPerQuestion: 2,
      targetMarks: secBMarks,
    });

    if (secCMarks > 0) {
      rules.push({
        title: 'Section C: Long Answer Questions',
        instructions: 'Answer in detail with diagrams where necessary.',
        allowedTypes: ['long-answer', 'essay', 'programming', 'case-study'],
        marksPerQuestion: 5,
        targetMarks: secCMarks,
      });
    }

    return rules;
  }

  private failureResult(
    reason: string,
    index: CandidateIndex,
    criteria: PaperGenerationCriteria
  ): GenerationEngineResult {
    const execTime = Date.now() - this.startTime;
    return {
      success: false,
      sections: [],
      totalMarks: 0,
      validationReport: {
        isValid: false,
        actualTotalMarks: 0,
        targetTotalMarks: criteria.targetTotalMarks,
        difficultyBreakdown: {
          easyMarks: 0, mediumMarks: 0, hardMarks: 0,
          easyPercent: 0, mediumPercent: 0, hardPercent: 0,
        },
        topicCoverage: { totalTopicsCovered: 0, coverageDetails: {} },
        errors: [reason],
        warnings: [],
      },
      algorithmSummary: {
        candidatePoolSize: index.size(),
        duplicatesPruned: index.duplicatesPruned,
        searchStrategy: 'greedy-backtracking',
        executionTimeMs: execTime,
      },
      errorReason: reason,
    };
  }
}
