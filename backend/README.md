# Stellar Escrow — Backend

Express API providing AI-assisted escrow creation and dispute analysis.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/escrow/create-from-text` | Parse NL description → escrow params |
| `POST` | `/api/dispute/analyse` | Analyse dispute evidence → AI recommendation |
| `GET` | `/api/escrow/:id` | Fetch escrow state from chain |

## Setup

```bash
cp .env.example .env
# edit .env with your values
npm install
npm run dev
```

## Docker

The backend image is a local, reproducible runtime baseline for the Express API.
It is intentionally scoped to the backend only and does not build the frontend,
SDK, or Soroban contracts.

From the repository root:

```bash
docker compose build backend
docker compose up backend
```

The service listens on container port `3001`. Override the host port with
`BACKEND_PORT`:

```bash
BACKEND_PORT=4001 docker compose up backend
```

Verify the running container:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok" }
```

## AI Stubs

`src/ai/nlp.ts` and `src/ai/arbiter.ts` are stubs with `// TODO: integrate OpenAI API` markers.
Set `OPENAI_API_KEY` in `.env` and replace the stubs to enable real AI features.
`OPENAI_API_KEY` is currently unused while these routes remain stubbed. Before
adding production LLM calls, sanitize user-provided escrow descriptions and
dispute evidence before constructing prompts.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `CONTRACT_ID` | Deployed escrow contract address |
| `RPC_URL` | Soroban RPC endpoint |
| `NETWORK_PASSPHRASE` | Stellar network passphrase for the target network |
| `SERVER_SECRET_KEY` | Server signing key used for backend Stellar/Soroban operations |
| `OPENAI_API_KEY` | OpenAI key (not used in stub mode) |

## Runtime Assumptions

- Stellar/Soroban RPC and contract settings are provided externally through
  environment variables.
- The current backend does not require a database, Redis, queues, object
  storage, persistent volumes, or other stateful services.
- Docker Compose is for local verification and development, not a production
  deployment specification.
