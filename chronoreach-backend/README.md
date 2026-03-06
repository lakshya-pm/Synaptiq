# ChronoReach Backend API

The AI-powered outreach workflow automation engine that thinks before it sends. 
This is the full FastAPI backend for the Hackathon build, utilizing Kahn's Topological Execute algorithms, SQLite WAL Mode Event sourcing, and simulated behavioral jitter algorithms.

## Setup Instructions

1. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Duplicate the environment variables from example to a live file:
   ```bash
   cp .env.example .env
   ```
   *Make sure `MOCK_MODE=true` is set if you want to route all LLM and SMTP traffic locally.*

3. **CRITICAL FIRST STEP:** Seed the environment data. This creates the entire demo dataset including 15 founder leads, the DAG workflows, generated events, and pending workflows:
   ```bash
   python seed.py
   ```

## Running the Server

Launch the web app on ASGI via uvicorn. The backend will load on port `8000`:
```bash
uvicorn main:app --reload
```

## How to Test Demo Flow End To End

- Go to [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- Upload the desired lead lists onto `POST /api/leads/upload` - you should see insights extracted
- Verify that Preflight `/api/preflight` returns exact high-risk outputs with 1-click Fix variants.
- Connect your frontend application. The server is configured entirely async using `SSE Server-Sent-Events` to emit to the live-dashboard.
