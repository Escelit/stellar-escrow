# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- `escrow-core` Soroban contract: create, fund, release, refund, dispute, resolve
- `CreateEscrowParams` struct to avoid too-many-arguments
- Contract events: `EscrowCreated`, `EscrowFunded`, `EscrowReleased`, `EscrowRefunded`, `EscrowDisputed`, `DisputeResolved`
- TypeScript `EscrowClient` SDK
- Express backend with stubbed AI arbiter and NLP parser
- React + Tailwind frontend: create escrow, escrow detail, dispute form
- CI: Rust tests + clippy + fmt, SDK build + test, backend build, frontend build
