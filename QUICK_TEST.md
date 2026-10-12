# Quick Testing Guide

## Prerequisites
- Node.js v24.16.0 ✅ (installed)
- npm 12.0.1 ✅ (installed)
- MongoDB (local or Atlas)

## Step 1: Install Dependencies

```bash
# From e:/collage/major2
npm install
cd client
npm install
cd ../server
npm install
```

## Step 2: Setup MongoDB

**Local MongoDB:**
- Download: https://www.mongodb.com/try/download/community
- Install and start service
- Connection string: `mongodb://localhost:27017/ai-question-paper-generator`

**OR MongoDB Atlas (Free):**
- Signup: https://mongodb.com/cloud/atlas
- Create free cluster
- Get connection string

## Step 3: Configure Environment

**Create server/.env:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-question-paper-generator
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<run again for different secret>
GEMINI_API_KEY=optional-for-now
ALLOWED_ORIGINS=http://localhost:5173
```

**Create client/.env:**
```env
VITE_API_URL=http://localhost:5000
```

## Step 4: Start Servers

```bash
# From root
npm run dev
```

Access: http://localhost:5173

## Step 5: Test Features

### ✅ Registration
1. Open http://localhost:5173
2. Click "Sign up"
3. Enter: Name, Email, Password (8+ chars, uppercase, lowercase, number)
4. Submit → Should redirect to dashboard

### ✅ Login/Logout
1. Logout from sidebar
2. Login with same credentials
3. Should see dashboard again

### ✅ Subject Management
1. Click "Subjects" in sidebar
2. Create new subject: Name, Code, Course, Description
3. View subjects list
4. Edit/Update a subject
5. Delete a subject

## Troubleshooting

**MongoDB connection error:**
```bash
# Windows: Start MongoDB
net start MongoDB
```

**Port 5000 in use:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**npm install errors:**
```bash
rm -rf node_modules client/node_modules server/node_modules
npm cache clean --force
npm install
```

## What Should Work

- ✅ User registration and login
- ✅ JWT authentication with auto-refresh
- ✅ Subject CRUD operations
- ✅ Ownership validation
- ✅ Search and pagination
- ✅ Rate limiting on auth
- ✅ Toast notifications

Let me know when ready to continue to Phase 4!
