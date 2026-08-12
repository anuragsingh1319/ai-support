# AI Customer Support Automation Platform - Context

## Architecture
This is a modern, multi-tenant SaaS application that allows businesses to create AI customer support agents, upload documents to train them via RAG (Retrieval-Augmented Generation), and deploy them via an embeddable chat widget.

### Tech Stack
- **Frontend (Dashboard):** Next.js 15 (React), TailwindCSS, shadcn/ui.
- **Frontend (Chat Widget):** React, bundled via Vite into a single embeddable `widget.js` (IIFE).
- **Backend API:** FastAPI (Python), SQLAlchemy (async), Uvicorn.
- **Database:** PostgreSQL with `pgvector` for storing embeddings.
- **Background Jobs:** Celery with Redis broker (for processing PDFs into chunks).
- **AI Integration:** OpenAI API (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings). LangChain for text chunking.

## Completed Work (Phases 1-3)
- **Phase 1 (Foundation):** Set up monorepo (`frontend/`, `backend/`, `docker-compose.yml`). Configured JWT auth, multi-tenant database models (`Organization`, `User`, `Agent`). Built Next.js dashboard skeleton (Login, Overview).
- **Phase 2 (RAG & Knowledge Base):** Added `Document` and `DocumentChunk` models with `Vector(1536)`. Setup Celery worker to extract text using `PyPDF2`, chunk via `RecursiveCharacterTextSplitter`, embed via OpenAI, and store in pgvector. Built Knowledge Base upload and RAG test UI.
- **Phase 3 (Website Chat Widget):** Added `Conversation` and `Message` models. Built backend chat API with SSE streaming. Built an embeddable React widget (`widget/` directory). Added a deployment page in the dashboard.

## Current Work (Phase 4 - In Progress)
- **Phase 4 (Conversations Dashboard & Analytics):** 
  - Completed schema updates (`resolved_at`, `metadata`).
  - Completed API endpoints for fetching analytics, fetching conversations, escalating to humans, and human replies.
  - Completed Frontend Conversations Dashboard UI (with mock data).
  - *Pending:* Integrate the Frontend Conversations Dashboard with the real backend API. Build the Analytics Dashboard UI.

## Unfinished Work & Next Steps
1. **Integrate Conversations Dashboard:** Replace the mock data in `frontend/src/app/(dashboard)/conversations/page.tsx` with actual `fetch` calls to `/api/v1/conversations/`.
2. **Build Analytics Dashboard:** Create `frontend/src/app/(dashboard)/page.tsx` (or update it) to fetch data from `/api/v1/analytics/overview` and display Recharts.
3. **Phase 5 (Tool Calling):** Implement OpenAI function-calling so the agent can take actions (e.g., checking order status via simulated external APIs).

## Current Bugs / Known Issues
- Currently, the local Postgres database needs to be spun up via Docker before backend migrations (`alembic upgrade head`) can complete.
- The `frontend` Next.js application has been built and works, but hasn't been fully tied to the backend APIs in the dashboard yet (using some mock data for layout purposes).

## Important Files
- `backend/app/main.py`: FastAPI entry point.
- `backend/app/models/*.py`: SQLAlchemy models (Multi-tenancy enforced here).
- `backend/app/api/endpoints/*.py`: API routes.
- `backend/app/worker.py`: Celery tasks for RAG document processing.
- `widget/src/ChatWidget.jsx`: The embeddable React widget UI.
- `frontend/src/app/(dashboard)/*`: The SaaS dashboard pages.

## Dependencies
- Backend: `fastapi`, `sqlalchemy`, `asyncpg`, `alembic`, `pgvector`, `celery`, `redis`, `openai`, `langchain-text-splitters`, `PyPDF2`.
- Frontend: `next`, `react`, `tailwindcss`, `lucide-react`, `recharts`, `shadcn-ui`.
- Widget: `vite`, `react`.

## Environment Variables (Required for Backend)
- `DATABASE_URL`
- `SECRET_KEY`
- `OPENAI_API_KEY`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
