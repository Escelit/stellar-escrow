# Contributing to Stellar Escrow Protocol

Thanks for your interest! This project participates in the [Stellar Wave Program](https://drips.network/wave/stellar).

## Getting Started

```bash
# Contract
cargo test

# SDK
cd sdk && npm install && npm test

# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## How to Contribute

1. Pick an open issue labeled `wave-bounty`
2. Comment to claim it
3. Fork and branch: `git checkout -b feat/your-feature`
4. Make changes with tests
5. Open a PR referencing the issue

## Code Standards

- Rust: `cargo clippy -- -D warnings` and `cargo fmt`
- TypeScript: strict mode, no untyped `any`
- All new contract functions need tests in `test.rs`

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
