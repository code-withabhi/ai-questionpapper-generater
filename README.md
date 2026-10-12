# AI Question Paper Generator

A professional full-stack web application for generating balanced, AI-powered question papers using the MERN stack and Google Gemini API.

## Features

- 🔐 Secure authentication with role-based access (Teacher/Admin)
- 📚 Subject, chapter, and topic management
- 💡 AI-powered question generation using Google Gemini
- 🎯 Intelligent paper generation with DSA-based algorithms
- 📝 Question bank with advanced search and filters
- 📄 PDF export for question papers and answer keys
- 🔄 Version control and paper history
- 📊 Admin dashboard and usage tracking

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for blazing-fast development
- Tailwind CSS + shadcn/ui for modern UI
- TanStack Query for server state management
- React Router for navigation
- React Hook Form + Zod for form validation

### Backend
- Node.js + Express with TypeScript
- MongoDB + Mongoose for data persistence
- Google Gemini API for AI question generation
- JWT-based authentication
- Pino for structured logging
- PDFKit/Puppeteer for PDF generation

### Testing
- Vitest for unit tests
- Supertest for API integration tests
- React Testing Library for component tests

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
└── package.json          # Root package.json

```

## Available Scripts

- `npm run dev` - Run both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Testing

```bash
# Run all tests
npm test

# Run client tests
npm run test --workspace=client

# Run server tests
npm run test --workspace=server
```

## Building for Production

```bash
# Build both applications
npm run build

# Build separately
npm run build:client
npm run build:server
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## Security

- All API keys are server-side only
- JWT-based authentication with refresh tokens
- Role-based authorization
- Request validation and sanitization
- Rate limiting on sensitive endpoints
- HTTPS required in production

## API Documentation

API endpoints are documented at `/api/v1/docs` when the server is running in development mode.

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
