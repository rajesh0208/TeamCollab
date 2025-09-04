# TeamCollab

A full-stack collaboration app with a Node/Express backend and Next.js frontend.

## Tech Stack
- Backend: Node.js, Express, JWT, MongoDB (via Mongoose)
- Frontend: Next.js (App Router), React, TypeScript (for UI components), Tailwind CSS
- Tooling: ESLint, PostCSS

## Project Structure
```
backend/   # Express API, auth, MongoDB models
frontend/  # Next.js app (App Router), UI components, auth context
```

## Prerequisites
- Node.js 18+
- npm or pnpm or yarn
- MongoDB connection string (set in environment)
- GitHub account (to push the repo)

## Environment Variables
Create `backend/src/config/env.js` or `.env` as applicable and ensure it provides:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT` (optional, defaults in code if set)

For frontend, if any envs are needed, add them to `frontend/.env.local`.

## Local Development
### 1) Install dependencies
```bash
# From repo root
cd backend && npm install
cd ../frontend && npm install
```

### 2) Run the apps
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

Backend defaults to `http://localhost:5000` (see `backend/src/server.js`).
Frontend defaults to `http://localhost:3000`.

## Scripts
- Backend: `npm start`
- Frontend: `npm run dev`

## Linting
```bash
cd frontend && npm run lint
```

## GitHub Setup and Push
```bash
# Initialize and push (first time)
git init
git add .
git commit -m "Initial commit"
# Create GitHub repo (via GitHub CLI) and push
# Requires: gh auth login
gh repo create TeamCollab --public --source=. --remote=origin --push

# Or manually if not using gh:
# 1) Create an empty repo on GitHub named TeamCollab
# 2) Then:
# git remote add origin https://github.com/<your-username>/TeamCollab.git
# git branch -M main
# git push -u origin main
```

## License
MIT
