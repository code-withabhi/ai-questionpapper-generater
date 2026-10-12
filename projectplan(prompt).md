# Project Plan and Master Coding Prompt — AI Question Paper Generator

## How to Use This File

Give this file and `architecture.md` to Sonnet 5.5 (or your chosen coding assistant). Ask it to work in the existing repository if one exists, inspect the repository first, and implement the project in small, verifiable phases.

The coding assistant is the **development model**. Google Gemini is the **runtime AI provider** used by the application to generate questions. These are separate roles.

---

# MASTER PROMPT

Act as a senior full-stack engineer, software architect, UI/UX designer, AI integration engineer, database engineer, and QA engineer.

Build a complete, professional AI Question Paper Generator using the architecture defined in `architecture.md`. Treat that file as the source of truth for the stack, security requirements, data model, AI integration, DSA algorithms, and acceptance criteria.

The required stack is:

- React + TypeScript + Vite
- Tailwind CSS and shadcn/ui where appropriate
- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- Google Gemini API through a secure server-side integration
- Server-side PDF export
- Automated tests

Do not switch to PHP, Laravel, MySQL, or another stack unless explicitly asked.

## A. Core Product Requirements

Create a usable, responsive web application for teachers and administrators.

Teachers must be able to:
1. Sign in securely.
2. Create and manage subjects, classes/courses, chapters, and topics.
3. Create, import where practical, search, filter, edit, and delete questions.
4. Generate new questions using Google Gemini.
5. Choose AI-generated, question-bank, or hybrid paper generation.
6. Specify total marks, duration, topics, question types, difficulty distribution, sections, and internal choices.
7. Generate and validate a paper.
8. Edit, reorder, remove, replace, or add questions.
9. Save drafts, finalize papers, and preserve version history.
10. Export a student-facing question paper and a separate answer key/marking scheme as PDF.

Administrators must be able to manage users, permitted shared data, usage limits, and system settings.

All core workflows must be functional. Do not create inert buttons, fake charts, hardcoded dashboard statistics, or demo-only forms in place of real features.

## B. Repository Inspection and Setup

Start by inspecting the repository:
- Check the current directory structure, package manifests, installed dependencies, and existing code.
- Identify whether the repository is new or already contains an application.
- Preserve existing working functionality.
- Do not delete or replace project files without understanding their purpose.
- Summarize the findings and present a short implementation plan.
- If empty, initialize a clean monorepo with `client` and `server`.
- Establish TypeScript strict mode, linting, formatting, and test commands.
- Create `.gitignore`, `.env.example` files, and setup documentation.
- Use compatible, maintained dependency versions and confirm the APIs against official documentation.

Then proceed with implementation. Do not stop at planning or scaffolding.

## C. UI/UX Expectations

Create a modern, premium-feeling education SaaS interface:
- Minimal layout, clear typography, consistent spacing
- White/light neutral backgrounds with restrained indigo/violet accents
- Responsive sidebar, top navigation, forms, tables, and dialogs
- Accessible contrast and keyboard-friendly controls
- Loading indicators, skeletons, empty states, and actionable errors
- Toast notifications for meaningful operations
- Confirmation for destructive actions
- Reusable components and a consistent design system

Implement these pages:
1. Login and password reset
2. Dashboard
3. Subject management
4. Chapter/topic management
5. Question bank
6. Create/edit question
7. AI question generation
8. Candidate-question review
9. Paper configuration wizard
10. Paper preview/editor
11. Saved papers and version history
12. PDF export and answer-key export
13. User profile/settings
14. Admin user management
15. AI usage/configuration
16. Error and not-found pages

Make layouts responsive on desktop, tablet, and mobile.

## D. Authentication and Authorization

Implement secure authentication and role-based access.

Requirements:
- Proper password hashing
- Safe session/token strategy
- Login throttling and rate limits
- Logout and credential/session invalidation
- Server-side role authorization
- Record ownership enforcement
- Secure password-reset flow if implemented
- Explicit CORS configuration
- CSRF protection if cookie-based authentication is used
- Validation on every protected API endpoint

A teacher must not access another teacher's private questions or papers by changing an ID in a URL. Verify ownership server-side on every relevant operation.

Never rely solely on frontend route guards or hidden UI controls for security.

## E. MongoDB Data Layer

Implement Mongoose models, validation, indexes, and relationships according to `architecture.md`.

At minimum, support:
- Users
- Subjects
- Chapters/topics
- Questions and options
- Question papers and sections
- Paper snapshots/versions
- AI generation requests/usage metadata

Use separate collections when independent search, ownership, or lifecycle management warrants them. Use embedded documents for bounded data where appropriate.

Avoid unnecessary duplication, but preserve immutable snapshots for saved/finalized paper versions. A later edit to a question-bank question must not silently alter a finalized paper.

Add seed data only for development. Do not expose a default production admin account with a known password.

## F. Gemini API Integration

Use the Google Gemini API from the Node.js backend only.

Official key-management page:
https://aistudio.google.com/app/api-keys

Official documentation:
https://ai.google.dev/gemini-api/docs

Create a dedicated module, such as:
`server/src/services/ai/geminiQuestionGenerator.ts`

Configure the provider through environment variables:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Also configure `MONGODB_URI`, authentication/session secrets, `PORT`, `NODE_ENV`, and allowed frontend origins.

Requirements:
1. Verify the current official API endpoint, authentication method, supported model IDs, request shape, and structured-output support.
2. Do not invent a model name or assume a model is available.
3. Keep the model configurable.
4. Keep the API key out of the frontend, repository, logs, error messages, and public configuration.
5. Build prompts from validated teacher inputs.
6. Request structured JSON output where supported.
7. Parse the response and validate it with a strict Zod schema.
8. Normalize question records into the application's internal format.
9. Validate question type, difficulty, marks, options, correct answers, topic relevance, count, and response size.
10. Detect exact duplicates and flag likely near-duplicates.
11. Handle malformed output, timeouts, revoked keys, quota exhaustion, and rate limits.
12. Apply bounded retries only to transient errors.
13. Add per-user quotas and request-size limits.
14. Store sanitized generation metadata and useful error codes.
15. Provide manual question entry and question-bank generation as fallbacks.

The AI must not be trusted to determine the final total marks or whether a paper satisfies every constraint. The application must independently validate those values.

Do not call a live Gemini endpoint during ordinary automated tests. Mock provider responses and document an optional manual integration test.

## G. Question Generation Inputs and Output

Allow teachers to configure:
- Subject and class/course
- Chapters and topics
- Syllabus text and learning objectives
- Number of questions
- Question types
- Marks per question or allowed marks
- Difficulty distribution
- Language
- Whether answers are needed
- Whether explanations or marking schemes are required
- Additional instructions

Support appropriate question types:
- Single-answer MCQ
- Multiple-select
- True/false
- Fill in the blanks
- Short answer
- Long/descriptive answer
- Numerical/problem-solving
- Programming
- Case study
- Assertion/reasoning
- Match-the-following

Design a discriminated, validated internal question schema. Do not treat every question type as an identical object if its fields differ.

For MCQs, validate options and correct-answer references. For descriptive questions, support expected answers or marking schemes when requested. Make answer-key access restricted so student-facing exports do not accidentally expose answers.

## H. DSA-Based Paper Generation Engine

Implement a dedicated selection engine in the backend. Keep it separate from Express controllers and AI service code.

Use appropriate data structures and algorithms:
- `Map`/associative indexing for topic, difficulty, type, and marks
- `Set` and normalized hashes for exact duplicate detection
- Greedy ranking for a first-pass candidate selection
- Bounded backtracking/search with pruning when constraints require combinations
- Dynamic programming for marks combinations only if justified by the problem size
- A priority queue only if it materially improves candidate management

Do not add algorithms merely to claim they exist. Explain the role and complexity of each implemented algorithm.

### Hard constraints
- Exact effective total marks
- Required question counts
- Section rules
- Compulsory-question rules
- Internal-choice rules
- Allowed question types
- Explicit required topic coverage when feasible
- Difficulty quotas under a documented rounding policy

### Soft preferences
- Broad topic coverage
- Diversity of question types
- Difficulty balance where not mandatory
- Reduced repetition across recent papers
- Candidate quality/relevance

The algorithm must:
1. Load eligible question-bank candidates.
2. Request additional AI candidates when configured.
3. Validate and normalize candidates.
4. Remove exact duplicates and flag likely near-duplicates.
5. Group candidates for efficient selection.
6. Select candidates while enforcing hard constraints.
7. Run a separate, independent validation pass.
8. Return a clear result report.
9. Persist a draft only after validating the data.
10. Preserve the selected questions and constraints used.

If no valid paper can be constructed, do not silently relax hard constraints. Explain the reason and suggest a specific adjustment, such as adding candidates, changing marks, reducing a quota, or altering section rules.

Correctly distinguish printed marks from effective marks when internal choices are used.

## I. Paper Builder and Versioning

Build a guided configuration wizard:
1. Examination details
2. Subject and syllabus
3. Question structure
4. Difficulty/topic distribution
5. Generation mode
6. Constraint review
7. Generation and validation
8. Preview/edit
9. Save/finalize/export

Allow teachers to reorder questions, edit text, replace candidates, remove or add questions, change section instructions, and recalculate totals.

Revalidate the paper after every relevant edit. Never trust a client-calculated total.

Preserve immutable content snapshots for each saved/finalized version. Provide a useful version history and duplication workflow.

## J. PDF Export

Generate clean, print-ready PDFs on the server.

Question paper PDF:
- Optional institution name/logo
- Exam title, subject, class/course, session
- Duration and effective total marks
- Instructions
- Section headings
- Numbered questions
- Marks alignment
- Page numbers and sensible page breaks
- Unicode font support

Answer key/marking scheme PDF:
- Separate file or separate export action
- Correct answers and explanations
- Mark allocation for descriptive questions where available

Keep answer keys out of the student-facing paper by default. Verify access control before generating or downloading any PDF.

## K. API Design and Error Handling

Use versioned REST endpoints under `/api/v1`.

Create route groups for:
- Authentication
- Users/admin
- Subjects
- Chapters/topics
- Questions
- AI generation
- Papers
- Paper versions
- Constraint validation
- PDF/answer-key export
- AI usage/settings

Use consistent response structures and status codes. Validate path parameters, query parameters, request bodies, and file uploads if included.

Return user-safe messages. Log sanitized diagnostic information with request IDs. Never expose stack traces, credentials, internal prompts, or raw provider errors.

Add pagination, filters, and sorting for growing collections. Avoid unbounded list endpoints.

## L. Testing Requirements

Write tests for:
- Authentication and authorization
- Ownership isolation
- Subject/topic/question CRUD
- Request validation
- Gemini integration with mocked responses
- Invalid JSON and malformed AI responses
- Duplicate detection
- Exact total marks
- Difficulty/topic quotas
- Internal-choice calculations
- Infeasible configurations
- Search-budget termination
- Paper snapshots and version history
- PDF output and download permissions

Run lint, type checks, tests, and production builds. Fix failures before marking a phase complete. If a command cannot be run because a dependency or external service is unavailable, clearly report it.

## M. Implementation Phases and Required Checkpoints

### Phase 1 — Inspect and plan
Deliver:
- Repository assessment
- Architecture confirmation
- Data model outline
- Feature checklist
- Development plan

Do not modify existing files until you understand the current project.

### Phase 2 — Foundation
Implement:
- Monorepo/client/server setup
- TypeScript configuration
- Environment configuration
- MongoDB connection
- Express app, error middleware, health endpoint
- React layout, routing, shared UI components
- Linting, formatting, and test setup

Checkpoint: client and server start successfully; database connectivity is verified when configured.

### Phase 3 — Authentication and roles
Implement:
- Sign-in/sign-out
- Password hashing
- Safe session/token design
- Role-based authorization
- Ownership checks
- Rate limits and auth tests

Checkpoint: protected routes reject unauthorized access.

### Phase 4 — Subjects and question bank
Implement:
- Subject/chapter/topic CRUD
- Question CRUD and type-specific validation
- Search/filter/pagination
- Duplicate checks
- Dashboard statistics from real data
- Development seed data

Checkpoint: end-to-end CRUD works against MongoDB.

### Phase 5 — Gemini integration
Implement:
- Provider service
- Model configuration
- Structured generation prompts
- Response validation and normalization
- Usage/status logs
- Error handling and quotas
- Mocked integration tests

Checkpoint: mocked tests pass. If credentials are configured, perform a separately documented live smoke test without exposing the key.

### Phase 6 — DSA selection engine
Implement:
- Candidate indexing
- Greedy selection
- Bounded search/backtracking as needed
- Marks/section/internal-choice calculations
- Constraint validator
- Feasibility report
- Unit tests for edge cases

Checkpoint: algorithm tests verify both valid and impossible paper configurations.

### Phase 7 — Paper builder and history
Implement:
- Configuration wizard
- AI/question-bank/hybrid modes
- Generation status
- Candidate review
- Editing and reordering
- Draft/finalized states
- Snapshots/version history
- Revalidation after edits

Checkpoint: a teacher can create, edit, save, reopen, and version a paper.

### Phase 8 — PDF export
Implement:
- Question paper PDF
- Separate answer-key/marking-scheme PDF
- Print layout and Unicode support
- Authorization on export/download
- PDF tests

Checkpoint: exported content matches the validated paper version.

### Phase 9 — Admin and quality
Implement:
- User management
- Usage/quota views
- Settings
- Audit-safe logs
- Responsive states
- Accessibility and security review

Checkpoint: critical security and integration tests pass.

### Phase 10 — Final verification and deployment
Run:
- Formatting and linting
- Type checks
- Automated tests
- Client production build
- Server build/start checks
- Environment/configuration review
- Deployment smoke tests where possible

Complete README and deployment instructions.

## N. Coding Rules

- Use TypeScript strict mode and meaningful types.
- Keep controllers thin; business logic belongs in services.
- Keep the selection engine deterministic and independently testable.
- Keep Gemini API calls server-side.
- Use validated DTOs/schemas at trust boundaries.
- Avoid giant components, giant controllers, duplicated business logic, and unnecessary dependencies.
- Use accessible form labels and semantic controls.
- Do not use fake production data or hardcoded statistics.
- Do not leave core features as TODOs or placeholder methods.
- Do not claim a command, integration, test, or deployment succeeded unless it was actually verified.
- Do not silently weaken hard constraints when generation fails.
- Keep documentation aligned with the implemented code.

## O. Final Report

When implementation is complete, report:
1. Features implemented
2. Final folder structure
3. Database collections and indexes
4. Authentication approach
5. Gemini model configuration and required environment variables
6. DSA algorithms and their tested behavior
7. PDF export implementation
8. Tests, lint, type-check, and build results
9. Local setup and deployment commands
10. Known limitations and any steps requiring the user's credentials

Start now by inspecting the repository. Then implement Phase 1 and continue phase by phase. Do not stop after producing a plan; build and verify the application.
