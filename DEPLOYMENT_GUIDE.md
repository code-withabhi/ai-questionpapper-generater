# Deployment Guide: QuestionGen on Render

This guide outlines the steps to deploy the QuestionGen application to [Render](https://render.com).

## 1. Prerequisites
- Your code pushed to a Git repository (GitHub/GitLab).
- An account on [Render](https://dashboard.render.com/).
- A **MongoDB** database instance (you can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a free cluster).

## 2. Environment Configuration (Render Dashboard)

### A. Deploying the Backend (Web Service)
1. In Render, click **New +** > **Web Service**.
2. Connect your repository.
3. **Settings**:
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && node dist/server.js` (Ensure your build outputs to `dist`)
4. **Environment Variables**: Add the following in the Render "Environment" tab:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: (Your MongoDB connection string from Atlas)
   - `JWT_SECRET`: (A strong, random 32+ character string)
   - `JWT_REFRESH_SECRET`: (A different strong, random string)
   - `JWT_ACCESS_EXPIRE`: `15m`
   - `JWT_REFRESH_EXPIRE`: `7d`
   - `GEMINI_API_KEY`: (Your Google Gemini key)
   - `ALLOWED_ORIGINS`: (The URL of your deployed frontend, e.g., `https://your-app.onrender.com`)

### B. Deploying the Frontend (Static Site)
1. In Render, click **New +** > **Static Site**.
2. Connect the same repository.
3. **Settings**:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
4. **Environment Variables**:
   - `VITE_API_URL`: (The URL of your deployed **Backend** Web Service)

## 3. Post-Deployment Steps
1. Once both services are deployed, ensure the `ALLOWED_ORIGINS` in your backend environment variables exactly matches the URL of your deployed static site.
2. Check the logs in the Render dashboard for both services to ensure no startup errors occurred.
3. Verify connectivity: Navigate to your frontend URL in the browser.
