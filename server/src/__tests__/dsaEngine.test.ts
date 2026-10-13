import { describe, it, expect } from 'vitest';
import { DSAPaperEngine } from '../services/dsa/paperEngine.js';
import { CandidateIndex } from '../services/dsa/candidateIndex.js';
import { PaperConstraintValidator } from '../services/dsa/validator.js';
import { QuestionCandidate } from '../services/dsa/types.js';

describe('CandidateIndex & Duplicate Detection', () => {
  const sampleCandidates: QuestionCandidate[] = [
    {
      _id: 'q1',
      questionText: 'What is a stack?',
      questionType: 'mcq-single',
      difficulty: 'easy',
      marks: 1,
      topicId: 'topic-1',
      subjectId: 'sub-1',
      normalizedTextHash: 'hash-stack-1',
    },
    {
      _id: 'q2',
      questionText: 'What is a stack?', // exact duplicate hash
      questionType: 'mcq-single',
      difficulty: 'easy',
      marks: 1,
      topicId: 'topic-1',
      subjectId: 'sub-1',
      normalizedTextHash: 'hash-stack-1',
    },
    {
      _id: 'q3',
      questionText: 'Explain Dijkstra algorithm',
      questionType: 'short-answer',
      difficulty: 'medium',
      marks: 2,
      topicId: 'topic-2',
      subjectId: 'sub-1',
      normalizedTextHash: 'hash-dijkstra-1',
    },
  ];

  it('prunes exact duplicates using text hash Set', () => {
    const index = new CandidateIndex(sampleCandidates);
    expect(index.size()).toBe(2);
    expect(index.duplicatesPruned).toBe(1);
  });

  it('indexes candidates by difficulty, type, and topic', () => {
    const index = new CandidateIndex(sampleCandidates);
    expect(index.getByDifficulty('easy').length).toBe(1);
    expect(index.getByDifficulty('medium').length).toBe(1);
    expect(index.getByType(['short-answer']).length).toBe(1);
  });
});

describe('PaperConstraintValidator', () => {
  it('validates exact total marks accurately', () => {
    const questions: QuestionCandidate[] = [
      {
        _id: 'q1',
        questionText: 'Q1',
        questionType: 'mcq-single',
        difficulty: 'easy',
        marks: 1,
        subjectId: 'sub-1',
        normalizedTextHash: 'h1',
      },
      {
        _id: 'q2',
        questionText: 'Q2',
        questionType: 'short-answer',
        difficulty: 'medium',
        marks: 2,
        subjectId: 'sub-1',
        normalizedTextHash: 'h2',
      },
    ];

    const validReport = PaperConstraintValidator.validate(questions, {
      targetTotalMarks: 3,
      durationMinutes: 30,
    });
    expect(validReport.isValid).toBe(true);
    expect(validReport.actualTotalMarks).toBe(3);
    expect(validReport.errors.length).toBe(0);

    const invalidReport = PaperConstraintValidator.validate(questions, {
      targetTotalMarks: 10,
      durationMinutes: 60,
    });
    expect(invalidReport.isValid).toBe(false);
    expect(invalidReport.errors.length).toBeGreaterThan(0);
    expect(invalidReport.errors[0]).toContain('Total marks mismatch');
  });
});

describe('DSAPaperEngine', () => {
  const candidatePool: QuestionCandidate[] = [
    // 5 MCQs (1 mark each)
    ...Array.from({ length: 5 }, (_, i) => ({
      _id: `mcq-${i}`,
      questionText: `MCQ question ${i}`,
      questionType: 'mcq-single',
      difficulty: 'easy' as const,
      marks: 1,
      topicId: `topic-${i % 2}`,
      subjectId: 'sub-1',
      normalizedTextHash: `hash-mcq-${i}`,
    })),
    // 5 Short answers (2 marks each)
    ...Array.from({ length: 5 }, (_, i) => ({
      _id: `short-${i}`,
      questionText: `Short question ${i}`,
      questionType: 'short-answer',
      difficulty: 'medium' as const,
      marks: 2,
      topicId: `topic-${i % 3}`,
      subjectId: 'sub-1',
      normalizedTextHash: `hash-short-${i}`,
    })),
    // 3 Long answers (5 marks each)
    ...Array.from({ length: 3 }, (_, i) => ({
      _id: `long-${i}`,
      questionText: `Long question ${i}`,
      questionType: 'long-answer',
      difficulty: 'hard' as const,
      marks: 5,
      topicId: `topic-${i}`,
      subjectId: 'sub-1',
      normalizedTextHash: `hash-long-${i}`,
    })),
  ];

  it('successfully generates a balanced paper matching exact target marks', () => {
    const engine = new DSAPaperEngine();
    const result = engine.generate(candidatePool, {
      targetTotalMarks: 10,
      durationMinutes: 60,
      sectionRules: [
        {
          title: 'Section A: Objective',
          allowedTypes: ['mcq-single'],
          targetMarks: 2,
        },
        {
          title: 'Section B: Short Answer',
          allowedTypes: ['short-answer'],
          targetMarks: 8,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.totalMarks).toBe(10);
    expect(result.sections.length).toBe(2);
    expect(result.validationReport.isValid).toBe(true);
  });

  it('fails gracefully and provides actionable reason when inventory cannot satisfy marks', () => {
    const engine = new DSAPaperEngine();
    const result = engine.generate(candidatePool, {
      targetTotalMarks: 100, // inventory only has ~25 marks
      durationMinutes: 60,
    });

    expect(result.success).toBe(false);
    expect(result.errorReason).toBeDefined();
    expect(result.validationReport.isValid).toBe(false);
  });
});
