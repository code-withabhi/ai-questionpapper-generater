import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuestionsWithGemini } from '../services/ai/geminiQuestionGenerator.js';

// Mock config
vi.mock('../config/index.js', () => ({
  default: {
    gemini: {
      apiKey: 'test-api-key',
      model: 'gemini-3.6-flash',
    },
    logging: {
      level: 'info',
    },
  },
}));

// Mock @google/generative-ai
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn();

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

describe('Gemini Question Generator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates normalized questions from valid JSON response', async () => {
    const mockQuestions = [
      {
        questionText: 'What is polymorphism?',
        questionType: 'short-answer',
        difficulty: 'medium',
        marks: 2,
        bloomLevel: 'understand',
        options: [],
        correctAnswer: 'Ability to take more than one form',
        explanation: 'Core OOP concept',
        markingScheme: '2 marks for clear definition',
        tags: ['java', 'oop'],
      },
    ];

    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockQuestions),
        },
      }),
    });

    const result = await generateQuestionsWithGemini({
      subjectName: 'Computer Science',
      topicTitle: 'OOP',
      questionType: 'short-answer',
      difficulty: 'medium',
      bloomLevel: 'understand',
      marks: 2,
      count: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.questionText).toBe('What is polymorphism?');
    expect(result[0]?.marks).toBe(2);
  });

  it('handles markdown fences wrapping the JSON output', async () => {
    const mockQuestions = [
      {
        questionText: 'Is HTML a programming language?',
        questionType: 'true-false',
        difficulty: 'easy',
        marks: 1,
        options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }],
        correctAnswer: 'false',
      },
    ];

    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockQuestions)}\n\`\`\``,
        },
      }),
    });

    const result = await generateQuestionsWithGemini({
      subjectName: 'Web Dev',
      topicTitle: 'HTML',
      questionType: 'true-false',
      difficulty: 'easy',
      marks: 1,
      count: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.questionText).toBe('Is HTML a programming language?');
  });

  it('falls back to candidate models if first model encounters an error', async () => {
    const mockQuestions = [
      {
        questionText: 'Fallback question',
        questionType: 'short-answer',
        difficulty: 'easy',
        marks: 1,
      },
    ];

    // First model call fails (e.g. 503 high demand), second succeeds
    mockGetGenerativeModel
      .mockReturnValueOnce({
        generateContent: vi.fn().mockRejectedValueOnce(new Error('503 Service Unavailable')),
      })
      .mockReturnValueOnce({
        generateContent: vi.fn().mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(mockQuestions),
          },
        }),
      });

    const result = await generateQuestionsWithGemini({
      subjectName: 'Math',
      topicTitle: 'Algebra',
      questionType: 'short-answer',
      difficulty: 'easy',
      marks: 1,
      count: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.questionText).toBe('Fallback question');
  });

  it('normalizes multiple-choice questions with valid options and correct mcq enum', async () => {
    const mockQuestions = [
      {
        questionText: 'What is 2 + 2?',
        questionType: 'multiple-choice',
        difficulty: 'easy',
        marks: 1,
        options: ['1', '2', '4', '5'],
        correctAnswer: '4',
      },
    ];

    mockGetGenerativeModel.mockReturnValueOnce({
      generateContent: vi.fn().mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockQuestions),
        },
      }),
    });

    const result = await generateQuestionsWithGemini({
      subjectName: 'Math',
      topicTitle: 'Arithmetic',
      questionType: 'multiple-choice',
      difficulty: 'easy',
      marks: 1,
      count: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.questionType).toBe('mcq-single');
    expect(result[0]?.options).toHaveLength(4);
    expect(result[0]?.options?.find((o: any) => o.text === '4')?.isCorrect).toBe(true);
  });
});
