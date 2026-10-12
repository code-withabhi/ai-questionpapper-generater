# AI Question Paper Generator — Architecture

## 1. Project Overview

Build a professional AI-powered Question Paper Generator as a full-stack web application. Teachers can organize subjects and syllabus topics, maintain a question bank, generate new questions with Google Gemini, assemble balanced papers using deterministic algorithms, edit and version papers, and export question papers and answer keys to PDF.

**Core principle:** Gemini generates candidate educational content. The application backend remains authoritative for authorization, validation, marks calculation, constraint checking, persistence, and final paper assembly.

## 2. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where appropriate
- React Router
- TanStack Query for server state
- React Hook Form and Zod for form validation
- Lucide icons
- A suitable chart library only where dashboard charts add value

### Backend
- Node.js LTS
- Express.js
- TypeScript
- Mongoose
- Zod for request and response validation
- Secure authentication using short-lived access tokens and a carefully designed refresh-token/session strategy, or secure cookie sessions
- A maintained PDF generation library compatible with the selected Node.js runtime
- Pino or another maintained structured logger with secret redaction

### Database
- MongoDB
- Mongoose schemas, indexes, validation, and explicit ownership rules

### AI
- Google Gemini API, configured using a Google AI Studio API key
- Use the official Gemini API documentation and a supported model ID
- Keep model ID configurable through environment variables
- Use structured JSON output/schema support where supported by the chosen model and API

### Testing and Quality
- Vitest or Jest for unit tests
- Supertest for API integration tests
- React Testing Library for important frontend behavior
- ESLint and Prettier
- TypeScript strict mode

Choose compatible, actively maintained package versions. Check the current official documentation before implementing third-party integrations.

## 3. High-Level System Architecture

```text
Teacher / Administrator
        |
        v
React + TypeScript Web App
        |
        | HTTPS / JSON REST API
        v
Node.js + Express + TypeScript
        |
        +--> Authentication and Authorization
        |
        +--> Subject / Syllabus Service
        |
        +--> Question Bank Service
        |
        +--> Gemini AI Service ------> Google Gemini API
        |
        +--> Paper Selection Engine
        |       +--> Candidate grouping / Maps
        |       +--> Duplicate detection / Sets
        |       +--> Greedy candidate ranking
        |       +--> Bounded search / Backtracking
        |       +--> Constraint validation
        |
        +--> Paper Versioning Service
        |
        +--> PDF Export Service
        |
        v
MongoDB
```

The frontend must never call Gemini directly. All AI requests must pass through the authenticated backend.

## 4. Repository Structure

Use a monorepo with separate `client` and `server` applications.

```text
ai-question-paper-generator/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── syllabus/
│   │   │   ├── question-bank/
│   │   │   ├── ai-generation/
│   │   │   ├── paper-builder/
│   │   │   ├── papers/
│   │   │   ├── pdf-export/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── subjects/
│   │   │   ├── questions/
│   │   │   ├── papers/
│   │   │   └── pdf/
│   │   ├── algorithms/
│   │   ├── jobs/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── projectplan(prompt).md
├── .gitignore
├── package.json
└── README.md
```

Adjust the structure when implementation needs justify it. Avoid needless abstraction and giant controller files.

## 5. User Roles and Authorization

### Administrator
- Manage user accounts and teacher access
- Manage subjects, courses/classes, syllabus, and question bank records according to policy
- Configure AI generation limits and system settings
- Review sanitized generation logs and usage metrics
- View system-wide dashboard statistics

### Teacher
- Manage permitted subjects and syllabus
- Create and edit questions
- Generate questions using Gemini
- Build papers from AI-generated and existing questions
- Edit, save, duplicate, and version papers
- Export question papers and answer keys
- Access only their own private records unless explicitly shared

Enforce every permission on the backend. Frontend route guards are a usability feature, not a security boundary.

## 6. Core Data Model

Use separate collections for entities that need independent search, ownership, or lifecycle management. Use embedded documents for naturally bounded child data such as MCQ options or paper sections when appropriate.

### User
- name
- email (normalized and unique)
- passwordHash
- role
- status
- createdAt / updatedAt

### Subject
- name
- code (optional)
- course/class
- description
- owner or sharing scope
- createdAt / updatedAt

### Chapter / Topic
- subjectId
- chapter title
- topic title
- description and learning objectives
- ordering metadata

A topic may be a separate collection if independent filtering and coverage reporting justify it.

### Question
- owner / access scope
- subjectId
- chapterId and topicId where applicable
- questionText
- questionType
- difficulty: easy, medium, hard
- marks
- estimatedTimeMinutes (optional)
- bloomLevel (optional)
- options (embedded where applicable)
- correctAnswer (access-controlled)
- explanation (optional)
- markingScheme (optional)
- tags
- origin: manual or AI
- approvalStatus
- normalizedTextHash
- createdAt / updatedAt / deletedAt (if soft deletion is implemented)

### QuestionPaper
- ownerId
- title
- subjectId
- class/course and examination metadata
- durationMinutes
- targetTotalMarks
- instructions
- language
- status: draft, finalized, archived
- sections and their rules
- paper version metadata
- constraint report
- createdAt / updatedAt

### Paper Version / Snapshot
Each saved version must preserve the question text, options, marks, section placement, numbering, and other printed content used by that version. Editing a question-bank record later must not silently alter an existing finalized paper.

Store snapshots embedded in a version document or in a dedicated version collection based on expected size and query patterns.

### AI Generation Request / Usage Log
- userId
- subjectId (optional)
- modelId
- requested question count
- generation status
- request parameters (exclude secrets and sensitive unnecessary data)
- usage metadata returned by the provider, if available
- retry count
- sanitized error code/message
- timestamps

Never log API keys or full sensitive prompts by default.

## 7. AI Integration Design

Create a dedicated module such as:

`server/src/services/ai/geminiQuestionGenerator.ts`

Responsibilities:
1. Build a prompt from validated teacher inputs.
2. Send a request to the configured Gemini API model from the backend.
3. Request structured output where supported.
4. Parse and validate the returned data with a strict Zod schema.
5. Normalize accepted questions into the application's internal format.
6. Detect duplicate or malformed questions.
7. Record sanitized usage/status metadata.
8. Handle rate limits, timeouts, transient failures, and invalid credentials.
9. Return actionable errors without leaking provider internals.

Use environment configuration such as:

```env
GEMINI_API_KEY=
GEMINI_MODEL=
```

Also provide safe configuration for the MongoDB URI, authentication/session secrets, allowed frontend origin, API port, and environment mode. `.env.example` must contain placeholders only.

Use the current official Gemini API docs for endpoint, authentication, model identifiers, request format, and structured-output support. Do not invent or hardcode an assumed model identifier.

AI output is untrusted input. The backend must independently validate question types, marks, options, answers, syllabus scope, requested count, payload size, and duplicates. Provide a manual fallback if the provider is unavailable.

## 8. Question Paper Generation Pipeline

```text
Validate teacher configuration
          |
          v
Load eligible question-bank candidates
          |
          +------> Generate more candidates with Gemini if requested
          |
          v
Normalize and validate candidates
          |
          v
Remove exact duplicates / flag near duplicates
          |
          v
Group candidates by topic, type, difficulty, and marks
          |
          v
Select candidates under hard constraints
          |
          v
Run independent constraint validation
          |
          +------> Infeasible? Return unmet constraints and suggestions
          |
          v
Persist draft and immutable content snapshot
          |
          v
Teacher reviews and edits
          |
          v
Finalize / export PDF
```

### Hard constraints
- Exact effective total marks
- Required question count or section count
- Section mark rules
- Compulsory question rules
- Internal-choice semantics
- Allowed question types
- Required topic coverage where feasible
- Difficulty quotas using a documented rounding policy

### Soft preferences
- Broad topic coverage
- Difficulty balance when not mandatory
- Diversity of question types
- Avoiding repeated questions from recent papers
- Quality/relevance ranking

Never label a paper balanced if validation has failed. Return unmet constraints and explain whether the issue is insufficient inventory, incompatible marks, or contradictory settings.

## 9. DSA Design

Implement algorithms only where they have a clear role.

### Map / HashMap
Group candidates by topic, difficulty, question type, and marks for efficient lookup.

### Set
Detect exact duplicates using normalized text hashes. Near-duplicate semantic matching must be treated as a separate, imperfect similarity check rather than guaranteed by hashing.

### Greedy ranking
Rank candidates using configurable scores for syllabus relevance, topic coverage, target difficulty, question type, reuse, and duplicate penalties. Greedy selection is a first pass, not proof of a globally optimal paper.

### Bounded search / backtracking
Search for valid combinations when greedy selection cannot satisfy section rules, marks, and quotas. Use pruning, a maximum search-node/time budget, and a safe failure response.

### Dynamic programming
Use a marks-combination DP only if the constraints and expected input sizes justify it. Document complexity and protect against excessive memory use.

### Priority queue
Use only if priority management materially benefits candidate ranking or iterative selection. Do not include it merely to advertise DSA.

### Constraint validator
Implement as a separate, deterministic module with testable input and output. Verify printed marks versus effective marks for internal choices.

Record selected IDs, constraints, achieved topic/difficulty distribution, unmet requirements, and algorithm status.

## 10. API Design

Use versioned REST routes under `/api/v1`.

Example route groups:
- `/auth`
- `/users` (admin-protected)
- `/subjects`
- `/chapters`
- `/topics`
- `/questions`
- `/ai/generate-questions`
- `/papers`
- `/papers/:id/versions`
- `/papers/:id/validate`
- `/papers/:id/finalize`
- `/papers/:id/export/pdf`
- `/papers/:id/export/answer-key`
- `/admin/usage`
- `/admin/settings`

Use consistent response shapes, pagination metadata, status codes, validation errors, and request IDs. Validate all request bodies, query parameters, and route parameters. Apply authentication, authorization, rate limits, and ownership checks.

## 11. Security Requirements

- Hash passwords using a maintained password-hashing algorithm such as Argon2id or bcrypt with suitable parameters.
- Use secure, HTTP-only, SameSite cookies if cookie-based sessions/tokens are selected.
- If using bearer tokens, design refresh-token storage, rotation, revocation, and expiration carefully.
- Protect state-changing cookie-authenticated routes against CSRF.
- Configure CORS to explicit allowed origins.
- Rate-limit login and AI generation endpoints.
- Validate and limit all request sizes.
- Prevent NoSQL injection by validating inputs and never passing untrusted objects directly into MongoDB query operators.
- Enforce record ownership and role permissions in every protected route.
- Redact secrets from logs.
- Restrict PDF downloads to authorized users.
- Apply usage quotas and bounded retries to AI calls.
- Never expose Gemini API keys to the browser.
- Use HTTPS in production.
- Do not trust client-supplied total marks, roles, owner IDs, or validation results.

## 12. PDF Export

Generate print-ready PDFs on the server using a maintained Node.js PDF solution. Evaluate HTML-to-PDF or document-generation libraries for deployment compatibility before choosing one.

Include:
- Institution name/logo if configured
- Exam title, subject, class, date/session if configured
- Duration and effective total marks
- Instructions
- Numbered sections and questions
- Marks aligned consistently
- Page numbers and controlled page breaks
- Unicode font support

Provide separate exports for the question paper and answer key/marking scheme. Keep answers and explanations out of the student-facing question paper unless explicitly requested.

## 13. Frontend Screens

- Login and password reset
- Dashboard with live database statistics
- Subject and syllabus management
- Question bank with search, filters, pagination, and CRUD
- AI question generation form
- Generation status and review screen
- Paper builder
- Paper preview and editor
- Saved papers and version history
- PDF and answer-key export
- Profile/settings
- Admin user management
- AI usage/configuration view
- Loading, empty, error, and not-found states

Visual direction: minimal, professional education SaaS; consistent spacing; accessible contrast; responsive sidebar; polished tables/forms; useful empty states; no fake statistics or inert controls.

## 14. Testing

Test:
- Authentication, role checks, ownership isolation
- CRUD and validation
- Gemini integration with mocked provider responses
- Invalid JSON, quota exhaustion, timeout, and rate-limit behavior
- Duplicate handling
- Exact total marks
- Difficulty/topic constraints
- Internal choices
- Impossible configurations and bounded-search termination
- Paper snapshots and version history
- PDF export and access control

Automated tests must not depend on a live Gemini API call. Provide a documented optional manual integration test that uses the developer's own key.

## 15. Deployment

Provide:
- Root and per-app scripts
- `.env.example` files with placeholders
- MongoDB setup and connection validation
- Build and test commands
- Production startup guidance
- HTTPS/reverse proxy guidance
- Process management guidance (for example, PM2 if appropriate)
- Logs and health-check endpoint
- Backup and restore guidance for MongoDB
- Gemini API key setup and quota/security notes
- Troubleshooting instructions

## 16. Architecture Decision Rules

- Keep business logic out of Express controllers.
- Keep Gemini calls out of React.
- Keep mark calculations and final validation deterministic.
- Use a paper snapshot/version model for finalized papers.
- Use background jobs only when justified by long-running operations; explain the chosen queue approach.
- Avoid overengineering and unnecessary microservices.
- Do not claim production readiness until tests, security checks, and deployment requirements have been verified.
