import { QuestionCandidate, PaperGenerationCriteria, ValidationReport } from './types.js';

export class PaperConstraintValidator {
  public static validate(
    questions: QuestionCandidate[],
    criteria: PaperGenerationCriteria
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Exact marks calculation
    let actualTotalMarks = 0;
    let easyMarks = 0;
    let mediumMarks = 0;
    let hardMarks = 0;

    const topicCoverageMap: Record<string, number> = {};
    const seenIds = new Set<string>();

    for (const q of questions) {
      if (seenIds.has(q._id)) {
        errors.push(`Duplicate question found in paper: "${q.questionText.slice(0, 30)}..."`);
      }
      seenIds.add(q._id);

      const m = q.marks || 1;
      actualTotalMarks += m;

      if (q.difficulty === 'easy') easyMarks += m;
      else if (q.difficulty === 'hard') hardMarks += m;
      else mediumMarks += m;

      if (q.topicId) {
        topicCoverageMap[q.topicId] = (topicCoverageMap[q.topicId] || 0) + 1;
      }
    }

    // Hard Constraint Check: Target Marks
    if (actualTotalMarks !== criteria.targetTotalMarks) {
      errors.push(
        `Total marks mismatch: Expected ${criteria.targetTotalMarks}, but generated paper totals ${actualTotalMarks} marks.`
      );
    }

    // Difficulty Percentages
    const easyPercent = actualTotalMarks > 0 ? Math.round((easyMarks / actualTotalMarks) * 100) : 0;
    const mediumPercent = actualTotalMarks > 0 ? Math.round((mediumMarks / actualTotalMarks) * 100) : 0;
    const hardPercent = actualTotalMarks > 0 ? Math.round((hardMarks / actualTotalMarks) * 100) : 0;

    // Soft/Hard check for difficulty quota
    if (criteria.difficultyQuota) {
      const { easyPercent: targetE, hardPercent: targetH } = criteria.difficultyQuota;
      if (Math.abs(easyPercent - targetE) > 20) {
        warnings.push(`Easy questions balance differs by >20% from target (${easyPercent}% vs target ${targetE}%).`);
      }
      if (Math.abs(hardPercent - targetH) > 20) {
        warnings.push(`Hard questions balance differs by >20% from target (${hardPercent}% vs target ${targetH}%).`);
      }
    }

    // Required topics check
    if (criteria.requiredTopicIds && criteria.requiredTopicIds.length > 0) {
      for (const requiredTopicId of criteria.requiredTopicIds) {
        if (!topicCoverageMap[requiredTopicId]) {
          warnings.push(`Required topic (${requiredTopicId}) is not covered in the selected paper.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      actualTotalMarks,
      targetTotalMarks: criteria.targetTotalMarks,
      difficultyBreakdown: {
        easyMarks,
        mediumMarks,
        hardMarks,
        easyPercent,
        mediumPercent,
        hardPercent,
      },
      topicCoverage: {
        totalTopicsCovered: Object.keys(topicCoverageMap).length,
        coverageDetails: topicCoverageMap,
      },
      errors,
      warnings,
    };
  }
}
