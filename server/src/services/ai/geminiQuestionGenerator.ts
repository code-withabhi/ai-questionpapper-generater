import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface GenerateQuestionsParams {
  subjectName: string;
  topicTitle: string;
  topicDescription?: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel?: string;
  marks: number;
  count: number;
}

export interface GeneratedQuestion {
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
  bloomLevel?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  markingScheme?: string;
  tags?: string[];
}

export async function generateQuestionsWithGemini(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
  const apiKey = config.gemini.apiKey;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // List of candidate models in priority order for resilience against spikes/deprecations
  const candidateModels = Array.from(new Set([
    config.gemini.model,
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ])).filter(Boolean);

  const prompt = `
You are an expert academic test creator. Create exactly ${params.count} high-quality test questions strictly matching the following specifications:
- Subject: ${params.subjectName}
- Topic: ${params.topicTitle} ${params.topicDescription ? `(${params.topicDescription})` : ''}
- Question Type: ${params.questionType}
- Target Difficulty: ${params.difficulty}
- Target Bloom Taxonomy Level: ${params.bloomLevel || 'apply'}
- Marks per question: ${params.marks}

Type Requirements:
- If "multiple-choice": Provide exactly 4 options in an "options" array where each object has "text" (string) and "isCorrect" (boolean). Exactly 1 option must have isCorrect: true.
- If "true-false": Set "correctAnswer" to "true" or "false". Provide options with True and False.
- If "short-answer" or "essay": Provide "markingScheme" and detailed "explanation".

You MUST return ONLY a valid JSON array of question objects without markdown backticks or explanation text.
JSON Structure:
[
  {
    "questionText": "Question wording here",
    "questionType": "${params.questionType === 'multiple-choice' ? 'mcq-single' : params.questionType === 'essay' ? 'long-answer' : params.questionType}",
    "difficulty": "${params.difficulty}",
    "marks": ${params.marks},
    "bloomLevel": "${params.bloomLevel || 'apply'}",
    "options": [
      { "text": "Option A text", "isCorrect": false },
      { "text": "Option B text", "isCorrect": true },
      { "text": "Option C text", "isCorrect": false },
      { "text": "Option D text", "isCorrect": false }
    ],
    "correctAnswer": "Option B text or true/false",
    "explanation": "Clear educational explanation",
    "markingScheme": "Criteria or sample answer",
    "tags": ["${params.subjectName.toLowerCase().replace(/\\s+/g, '-')}", "${params.difficulty}"]
  }
]
`;

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Clean markdown code fence if present
      const cleaned = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        throw new Error('Gemini did not return an array of questions');
      }

      return parsed.map((item: any) => {
        const rawType = item.questionType || params.questionType;
        let finalType: any = rawType;
        if (rawType === 'multiple-choice') {
          const correctCount = Array.isArray(item.options) ? item.options.filter((o: any) => o?.isCorrect).length : 1;
          finalType = correctCount > 1 ? 'mcq-multiple' : 'mcq-single';
        } else if (rawType === 'essay') {
          finalType = 'long-answer';
        }

        let options: Array<{ text: string; isCorrect: boolean }> = Array.isArray(item.options)
          ? item.options.map((opt: any) =>
              typeof opt === 'string'
                ? { text: opt, isCorrect: false }
                : { text: opt?.text || opt?.title || '', isCorrect: Boolean(opt?.isCorrect) }
            )
          : [];

        if (finalType === 'true-false' && options.length < 2) {
          const isTrue = String(item.correctAnswer || '').trim().toLowerCase() === 'true';
          options = [
            { text: 'True', isCorrect: isTrue },
            { text: 'False', isCorrect: !isTrue },
          ];
        }

        if ((finalType === 'mcq-single' || finalType === 'mcq-multiple') && options.length > 0) {
          if (!options.some((o: { text: string; isCorrect: boolean }) => o.isCorrect)) {
            const matchIdx = options.findIndex(
              (o: { text: string; isCorrect: boolean }) =>
                o.text.trim().toLowerCase() === String(item.correctAnswer || '').trim().toLowerCase()
            );
            if (matchIdx >= 0 && options[matchIdx]) {
              options[matchIdx].isCorrect = true;
            } else if (options[0]) {
              options[0].isCorrect = true;
            }
          }
        }

        return {
          questionText: item.questionText || item.text || '',
          questionType: finalType,
          difficulty: item.difficulty || params.difficulty,
          marks: Number(item.marks) || params.marks,
          bloomLevel: item.bloomLevel || params.bloomLevel || 'apply',
          options,
          correctAnswer: item.correctAnswer || '',
          explanation: item.explanation || '',
          markingScheme: item.markingScheme || item.sampleAnswer || '',
          tags: item.tags || [params.subjectName.toLowerCase()],
        };
      });
    } catch (error: any) {
      lastError = error;
      logger.warn({ model: modelName, err: error.message }, 'Gemini model failed, trying fallback...');
    }
  }

  logger.error({ err: lastError?.message }, 'All Gemini models failed');
  throw new Error(`AI generation failed: ${lastError?.message || 'Check Gemini API Key'}`);
}
