import mongoose from 'mongoose';
import dns from 'dns';
import config from '../config/index.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Chapter } from '../models/Chapter.js';
import { Topic } from '../models/Topic.js';
import { Question } from '../models/Question.js';
import { generateHash } from '../utils/helpers.js';
import bcrypt from 'bcryptjs';
import { dummySubjects, dummyChapters, extraQuestionsData } from './seed-data.js';

async function seed() {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // ignore
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB Atlas!');

  let user = await User.findOne({ email: 'admin@example.com' });
  if (!user) {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    user = await User.create({
      name: 'Admin Teacher',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'teacher',
      status: 'active',
    });
    console.log('Created user:', user.email);
  }

  const ownerId = user._id;

  // Clean old sample data
  await Subject.deleteMany({ ownerId });
  await Chapter.deleteMany({});
  await Topic.deleteMany({});
  await Question.deleteMany({ ownerId });

  const subjectMap = new Map();
  for (const sub of dummySubjects) {
    const created = await Subject.create({ ...sub, ownerId });
    subjectMap.set(sub.code, created);
  }

  const topicMap = new Map();
  for (const ch of dummyChapters) {
    const sub = subjectMap.get(ch.subjectCode);
    const chapter = await Chapter.create({
      subjectId: sub._id,
      title: ch.title,
      description: ch.description,
      order: ch.order,
    });
    const topic = await Topic.create({
      chapterId: chapter._id,
      subjectId: sub._id,
      title: ch.topic.title,
      description: ch.topic.description,
      order: ch.topic.order,
    });
    topicMap.set(ch.subjectCode, { chapter, topic, sub });
  }

  const cnData = topicMap.get('CS-501');
  const dbmsData = topicMap.get('CS-402');
  const aiData = topicMap.get('AI-601');

  const questions = [
    {
      ownerId,
      subjectId: cnData.sub._id,
      chapterId: cnData.chapter._id,
      topicId: cnData.topic._id,
      questionText: 'Which transport layer protocol provides connection-oriented, reliable byte-stream service?',
      questionType: 'mcq-single',
      difficulty: 'easy',
      marks: 1,
      options: [
        { text: 'UDP', isCorrect: false },
        { text: 'TCP', isCorrect: true },
        { text: 'IP', isCorrect: false },
        { text: 'ICMP', isCorrect: false },
      ],
      explanation: 'TCP guarantees reliable data delivery using sequence numbers and ACKs.',
      tags: ['networking', 'tcp'],
      origin: 'manual',
      approvalStatus: 'approved',
    },
    {
      ownerId,
      subjectId: cnData.sub._id,
      chapterId: cnData.chapter._id,
      topicId: cnData.topic._id,
      questionText: 'UDP is a connectionless protocol that does not perform handshakes prior to transmission.',
      questionType: 'true-false',
      difficulty: 'easy',
      marks: 1,
      options: [
        { text: 'True', isCorrect: true },
        { text: 'False', isCorrect: false },
      ],
      correctAnswer: 'True',
      explanation: 'UDP sends datagrams without prior handshake.',
      tags: ['udp', 'true-false'],
      origin: 'manual',
      approvalStatus: 'approved',
    },
    {
      ownerId,
      subjectId: dbmsData.sub._id,
      chapterId: dbmsData.chapter._id,
      topicId: dbmsData.topic._id,
      questionText: 'Which SQL clause is used to filter records resulting from an aggregate function like SUM or AVG?',
      questionType: 'mcq-single',
      difficulty: 'easy',
      marks: 1,
      options: [
        { text: 'WHERE', isCorrect: false },
        { text: 'HAVING', isCorrect: true },
        { text: 'ORDER BY', isCorrect: false },
        { text: 'GROUP BY', isCorrect: false },
      ],
      explanation: 'HAVING filters aggregated rows after GROUP BY.',
      tags: ['sql', 'queries'],
      origin: 'manual',
      approvalStatus: 'approved',
    },
    {
      ownerId,
      subjectId: dbmsData.sub._id,
      chapterId: dbmsData.chapter._id,
      topicId: dbmsData.topic._id,
      questionText: 'Explain the four ACID properties in DBMS transactions with real-world banking examples.',
      questionType: 'long-answer',
      difficulty: 'medium',
      marks: 8,
      correctAnswer: 'Atomicity (all or nothing), Consistency (valid invariants), Isolation (concurrency control), Durability (persistence on commit).',
      tags: ['acid', 'transactions'],
      origin: 'manual',
      approvalStatus: 'approved',
    },
    {
      ownerId,
      subjectId: aiData.sub._id,
      chapterId: aiData.chapter._id,
      topicId: aiData.topic._id,
      questionText: 'Under what condition is A* Tree Search guaranteed to find an optimal path to the goal?',
      questionType: 'mcq-single',
      difficulty: 'medium',
      marks: 2,
      options: [
        { text: 'Heuristic function h(n) must be admissible', isCorrect: true },
        { text: 'Heuristic function h(n) must be negative', isCorrect: false },
        { text: 'Heuristic function h(n) must overestimate cost', isCorrect: false },
        { text: 'Path cost g(n) must equal zero', isCorrect: false },
      ],
      explanation: 'A* tree search is optimal if h(n) is admissible.',
      tags: ['ai', 'a-star'],
      origin: 'manual',
      approvalStatus: 'approved',
    },
  ];

  for (const eq of extraQuestionsData) {
    const data = topicMap.get(eq.subjectCode);
    if (data) {
      questions.push({
        ownerId,
        subjectId: data.sub._id,
        chapterId: data.chapter._id,
        topicId: data.topic._id,
        ...eq,
      });
    }
  }

  for (const q of questions) {
    await Question.create({
      ...q,
      normalizedTextHash: generateHash(q.questionText),
    });
  }

  console.log(`Seeded ${dummySubjects.length} subjects and ${questions.length} questions successfully!`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
