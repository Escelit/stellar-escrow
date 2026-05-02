# Architecture

## Overview

Stellar Escrow Protocol is a four-layer system: a Soroban smart contract for on-chain fund custody, a TypeScript SDK for programmatic access, a Node.js backend for AI features, and a React frontend for end users.

```
┌─────────────────┐    create/fund/release    ┌──────────────────────┐
│    Frontend     │ ────────────────────────▶ │                      │
│  (React/Vite)   │                           │   escrow-core        │
└─────────────────┘                           │   (Soroban contract) │
        │                                     │                      │
        │ dispute evidence                    │  - escrow registry   │
        ▼                                     │  - token custody     │
┌─────────────────┐    AI recommendation      │  - dispute state     │
│    Backend      │ ◀─────────────────────    └──────────────────────┘
│  (Express/Node) │
│  - AI arbiter   │
│  - NLP parser   │
└─────────────────┘
```

## Contract

### Storage

| Key | Type | Description |
|-----|------|-------------|
| `ADMIN` | Instance | Admin address |
| `ESCROWS` | Instance | `Map<String, EscrowData>` |
| `DEPIDX` | Instance | `Map<Address, Vec<String>>` depositor index |

### Escrow Lifecycle

```
Pending → Funded → Released
                 → Refunded
                 → Disputed → Resolved
```

### Auth Model

- `create_escrow`: depositor must sign
- `fund_escrow`: depositor must sign
- `release`: arbiter or depositor must sign
- `refund`: arbiter must sign (or anyone after expiry)
- `dispute`: depositor or beneficiary must sign
- `resolve_dispute`: arbiter must sign

### Events

All state transitions emit a `#[contractevent]` with the escrow ID as topic.

## Backend AI Stubs

`backend/src/ai/arbiter.ts` — stub that uses keyword matching. Replace with OpenAI GPT-4 function calling for production.

`backend/src/ai/nlp.ts` — stub that uses regex. Replace with OpenAI structured output for production.

## SDK

`EscrowClient` wraps all contract functions. Read operations use simulation (no signing). Write operations require a `Keypair`.

## Trust Assumptions

- The arbiter is trusted to resolve disputes fairly. For production, use a multisig arbiter or a DAO.
- The backend AI recommendation is advisory only — the arbiter makes the final on-chain decision.
- The contract holds real tokens — audit before mainnet deployment.
