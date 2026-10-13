# AI-Powered Question Paper Generator & Algorithmic Constraint Engine

A professional full-stack web platform for generating balanced, constraint-compliant examination question papers using the MERN stack, Google Gemini API, and deterministic DSA optimization algorithms.

---

## 🌟 Key Features

- 🔐 **Authentication & Security**:
  - JWT-based authentication with access and refresh tokens.
  - bcrypt password hashing (10 rounds) and HTTP-only cookie support.
  - Strict multi-tenant isolation ensuring instructors manage only their own subjects, questions, and papers.
  - Helmet security headers, CORS origin whitelisting, and Express rate limiting.

- 📚 **Curriculum Taxonomy**:
  - 3-tier hierarchy: **Subject ➔ Chapter ➔ Topic**.
  - Dynamic cascading selectors and quick-creation modals.

- 💡 **AI Question Generator (Google Gemini)**:
  - Automated question generation mapped to Bloom's Taxonomy (*Remember, Understand, Apply, Analyze, Evaluate, Create*).
  - Multi-model fallback queue (`gemini-3.6-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.5-flash-lite`) to survive upstream 503 high-demand events.
  - Automatic JSON schema normalization and option verification.
  - Single-click or batch ingestion directly into the Question Bank.

- 🎯 **Algorithmic DSA Paper Generator**:
  - **$O(1)$ Duplicate Elimination**: Normalized whitespace and case hashing with Set/Map indexes to avoid question repeats.
  - **Greedy Variety Heuristic**: Prioritizes underrepresented topics and penalizes frequently reused questions.
  - **Bounded Backtracking Subset-Sum**: Explores question combinations with branch pruning to satisfy exact section target marks and difficulty quotas (Easy / Medium / Hard).

- 📊 **Validation & Version Control**:
  - One-click constraint validator report card checking total marks match, difficulty distribution, and topic diversity.
  - Paper version snapshots (`v1`, `v2`, etc.) in `versionHistory` for immutable audit trails.

- 📄 **Dual PDF Generation**:
  - Vector-crisp PDFKit streaming engine.
  - **Student Exam Paper**: College header, student details block, instructions, clean section layout.
  - **Teacher Answer Key / Marking Scheme**: Solutions, correct options, and marking rubrics.

- 🧪 **Comprehensive Automated Testing**:
  - 12 unit tests powered by Vitest covering the DSA engine, AI generation fallback, and Auth tenant isolation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn/ui, TanStack Query, React Hook Form, Lucide Icons |
| **Backend** | Node.js, Express (ES Modules), TypeScript, Mongoose ODM, Zod, PDFKit, Pino |
| **Database** | MongoDB Atlas (Cloud) |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`) with dynamic model fallback |
| **Testing** | Vitest (12/12 passing unit tests across DSA, AI, and Auth security) |

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB >= 6.0
- Google Gemini API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-question-paper-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

#### Server (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `GEMINI_API_KEY`: Your Google Gemini API key from https://aistudio.google.com/app/api-keys
- `JWT_SECRET`: A secure random string for JWT signing
- `JWT_REFRESH_SECRET`: A secure random string for refresh tokens

#### Client (.env)
```bash
cd client
cp .env.example .env
```

Edit `client/.env` with your configuration:
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000)

### 4. Run the application

#### Development mode (both client and server)
```bash
npm run dev
```

#### Run separately
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### 5. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

## Project Structure

```
ai-question-paper-generator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── routes/        # Route configurations
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── algorithms/   # Paper generation algorithms
│   │   └── validators/   # Request validation schemas
│   └── package.json
├── docs/                 # Documentation
├── ppt.txt               # Master AI Prompt & 12-Slide Deck Presentation Script
└── package.json          # Root package.json
```

## Available Scripts

- `npm run dev` - Run both client and server concurrently
- `npm run dev:server` - Run backend with tsx hot reload
- `npm run dev:client` - Run frontend with Vite
- `npm run build` - Build both workspaces for production
- `npm run test` - Run automated test suites (Vitest)
- `npm run type-check` - Run TypeScript validation across all workspaces
- `npm run lint` - Run ESLint across codebases
- `npm run format` - Format code with Prettier

## Database Seeding (Sample Data)

To seed initial subjects (Computer Networks, DBMS, AI & Soft Computing) and questions:

```bash
npm --prefix server run seed
```

## Testing & Verification

Run the test suite covering DSA Engine, Gemini fallback, and Auth isolation:

```bash
npm --prefix server test
```

Expected result: **12 tests passed across 3 test files**.

## Presentation Slide Deck (PPT)

A complete ready-to-use 12-slide presentation prompt and speaking script for your project defense / viva is provided in [`ppt.txt`](ppt.txt). You can paste it into **Gamma.app**, **ChatGPT**, **Claude**, or **Microsoft Copilot** to auto-generate visual slides.

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
