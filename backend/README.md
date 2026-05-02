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

## AI Stubs

`src/ai/nlp.ts` and `src/ai/arbiter.ts` are stubs with `// TODO: integrate OpenAI API` markers.
Set `OPENAI_API_KEY` in `.env` and replace the stubs to enable real AI features.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `CONTRACT_ID` | Deployed escrow contract address |
| `RPC_URL` | Soroban RPC endpoint |
| `OPENAI_API_KEY` | OpenAI key (not used in stub mode) |
