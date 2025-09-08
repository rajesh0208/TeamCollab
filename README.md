# TeamCollab

A full-stack collaboration app with a Node/Express backend and Next.js frontend.

## Tech Stack
- Backend: Node.js, Express, JWT, MongoDB (via Mongoose), Socket.IO
- Frontend: Next.js (App Router), React, Tailwind CSS, Socket.IO Client, DnD Kit
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

## Messaging (Phase 2)
- Real-time private and group chat using Socket.IO
- JWT auth on socket handshake; messages persisted in MongoDB
- Endpoints: `GET /api/chat/users`, `GET /api/chat/rooms`, `POST /api/chat/rooms`, `GET /api/chat/messages`
- Socket events: `message`, `typing`, `read`, `join`, `leave`

Frontend: See `src/app/dashboard/page.jsx` for the chat UI and `src/context/SocketContext.jsx` for socket connection.

## Tasks (Phase 3) – Kanban Board
- Kanban board at `/kanban` with columns: To Do, In Progress, Done
- Drag-and-drop via `@dnd-kit/core` and `@dnd-kit/sortable`
- Real-time task updates broadcast via Socket.IO

### Task Model
```
{
  title: String,
  description: String,
  status: "todo" | "in-progress" | "done",
  priority: "low" | "medium" | "high",
  dueDate: Date,
  assignee: ObjectId(User),
  createdBy: ObjectId(User),
  createdAt: Date
}
```

### APIs
- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create task
- `PUT /api/tasks/:id` — update task (status, priority, assignee, etc.)
- `DELETE /api/tasks/:id` — delete task (creator or admin only)

### Socket Events
- `taskCreated`, `taskUpdated`, `taskDeleted`

Frontend: See `src/app/kanban/page.jsx` for the board and modal.

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


