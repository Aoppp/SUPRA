# SAD — Supramolecular Assembly Database

## Project Constraints

- **No emoji:** Do not use emoji characters anywhere in the codebase (comments, JSX, strings, UI text). This applies to all files (.tsx, .ts, .py, .css, .md, etc.).

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite, deployed via Docker
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Deploy:** Docker Compose (nginx + backend), Alibaba Cloud Singapore

## Deploy

Server: `root@47.84.101.94` (password: `Chaofenzi!`)
```bash
# After pushing to GitHub:
ssh root@47.84.101.94
cd /opt/sad && git pull
cd frontend && npm run build
cd .. && docker compose build backend && docker compose up -d --force-recreate backend
```
