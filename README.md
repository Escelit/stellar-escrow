# Stellar Escrow Protocol

A decentralized escrow protocol for the Stellar/Soroban ecosystem with AI-powered dispute resolution.

Lock funds in a smart contract, release on delivery, or let the AI arbiter analyse disputes.

## Architecture

```
contracts/escrow-core/   # Soroban smart contract (Rust)
sdk/                     # TypeScript client SDK
backend/                 # Node.js API — AI arbiter + NLP escrow creation
frontend/                # React + Tailwind UI
```

## How It Works

1. **Depositor** creates an escrow, specifying beneficiary, arbiter, amount, token, and expiry
2. **Depositor** funds the escrow — tokens are locked in the contract
3. **Beneficiary** delivers the agreed work
4. **Arbiter** (or depositor) releases funds to beneficiary
5. If disputed, either party submits evidence — the **AI arbiter** analyses it and recommends release or refund
6. **Arbiter** resolves on-chain based on the recommendation

## AI Features

- **Natural language escrow creation** — describe your escrow in plain English, the backend parses it into structured params
- **AI dispute arbiter** — submit evidence text, get a recommendation (release / refund / insufficient evidence) with confidence score
- **Fraud scoring** (coming soon) — assess counterparty risk before creating an escrow

> AI features use a stub implementation by default. See [backend/src/ai/](backend/src/ai/) for integration points.

## Contract API

| Function | Description |
|---|---|
| `initialize(admin)` | Deploy and set admin |
| `create_escrow(params)` | Create a new escrow |
| `fund_escrow(escrow_id)` | Depositor locks funds |
| `release(escrow_id, caller)` | Arbiter/depositor releases to beneficiary |
| `refund(escrow_id)` | Arbiter refunds depositor (or auto after expiry) |
| `dispute(escrow_id, evidence_hash, raised_by)` | Raise a dispute |
| `resolve_dispute(escrow_id, release_to_beneficiary)` | Arbiter resolves |
| `get_escrow(escrow_id)` | Get escrow state |
| `get_escrows_by_depositor(depositor)` | List depositor's escrows |

## Getting Started

### Prerequisites

- Rust + `wasm32v1-none` target
- Node.js 20+
- Stellar CLI

```bash
rustup target add wasm32v1-none
```

### Contract

```bash
cargo test
cargo build --release --target wasm32v1-none
```

### SDK

```bash
cd sdk && npm install && npm run build && npm test
```

### Backend

```bash
cd backend && npm install && npm run dev
```

### Frontend

```bash
cd frontend && npm install && npm run dev
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This project participates in the [Stellar Wave Program](https://drips.network/wave/stellar).

## License

MIT
