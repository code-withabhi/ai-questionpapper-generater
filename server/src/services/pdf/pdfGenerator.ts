import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function streamQuestionPaperPdf(paper: any, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}_paper.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(paper.title, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica').text(`Subject: ${paper.subjectId?.name || 'General'} (${paper.subjectId?.code || ''})`, { align: 'center' });
  doc.moveDown(0.2);

  const metaText = `Time Allowed: ${paper.durationMinutes} Minutes    |    Maximum Marks: ${paper.targetTotalMarks}`;
  doc.fontSize(10).font('Helvetica-Bold').text(metaText, { align: 'center' });
  doc.moveDown(0.5);

  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Instructions
  if (paper.instructions) {
    doc.fontSize(11).font('Helvetica-Bold').text('General Instructions:');
    doc.fontSize(9).font('Helvetica').text(paper.instructions, { indent: 10 });
    doc.moveDown(0.8);
  }

  let globalQuestionNumber = 1;

  for (const section of paper.sections || []) {
    doc.fontSize(13).font('Helvetica-Bold').text(section.title, { underline: true });
    if (section.instructions) {
      doc.fontSize(9).font('Helvetica-Oblique').text(section.instructions);
    }
    doc.moveDown(0.4);

    for (const q of section.questionIds || []) {
      const qText = q.questionText || q.text || 'Question';
      const marksText = `[${q.marks || section.marksPerQuestion || 1} Mark${(q.marks || section.marksPerQuestion) > 1 ? 's' : ''}]`;

      doc.fontSize(10).font('Helvetica-Bold').text(`Q${globalQuestionNumber}. `, { continued: true });
      doc.font('Helvetica').text(qText, { continued: false });
      doc.font('Helvetica-Oblique').fontSize(8).text(marksText, { align: 'right' });
      doc.moveDown(0.2);

      // Options if MCQ
      if (q.options && q.options.length > 0) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.options.forEach((opt: any, idx: number) => {
          doc.fontSize(9).font('Helvetica').text(`    (${letters[idx] || idx + 1}) ${opt.text}`);
        });
      } else if (q.questionType === 'true-false') {
        doc.fontSize(9).font('Helvetica').text('    (A) True        (B) False');
      }

      doc.moveDown(0.5);
      globalQuestionNumber++;
    }
    doc.moveDown(0.8);
  }

  doc.end();
}

export function streamAnswerKeyPdf(paper: any, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}_answer_key.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text(`${paper.title} - ANSWER KEY & RUBRIC`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica').text(`Subject: ${paper.subjectId?.name || ''}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.8);

  let globalQuestionNumber = 1;

  for (const section of paper.sections || []) {
    doc.fontSize(12).font('Helvetica-Bold').text(section.title, { underline: true });
    doc.moveDown(0.4);

    for (const q of section.questionIds || []) {
      const qText = q.questionText || q.text || '';
      doc.fontSize(10).font('Helvetica-Bold').text(`Q${globalQuestionNumber}. ${qText}`);

      // Answer
      let ansText = q.correctAnswer || '';
      if (!ansText && q.options) {
        const correctOpt = q.options.find((o: any) => o.isCorrect);
        if (correctOpt) ansText = correctOpt.text;
      }

      if (ansText) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#15803d').text(`Correct Answer: ${ansText}`).fillColor('#000000');
      }

      if (q.explanation) {
        doc.fontSize(9).font('Helvetica-Oblique').text(`Explanation: ${q.explanation}`);
      }

      if (q.markingScheme) {
        doc.fontSize(9).font('Helvetica').text(`Marking Scheme: ${q.markingScheme}`);
      }

      doc.moveDown(0.5);
      globalQuestionNumber++;
    }
    doc.moveDown(0.8);
  }

  doc.end();
}
