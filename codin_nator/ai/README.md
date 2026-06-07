# Codinnator AI Service (FastAPI)

Backend (Spring) calls this service.

## Endpoints
- POST /generate-test
- POST /analyze-test-result

## Run (Windows Git Bash)
```bash
cd ai-service
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The server auto-loads `.env` (python-dotenv).
