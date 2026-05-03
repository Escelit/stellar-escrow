# GitHub Issues
# https://github.com/Escelit/stellar-escrow/issues/new
# Labels: one of: enhancement, bug, documentation, good first issue, testing

---

## Issue 1 — Deploy escrow contract to Stellar Testnet
**Labels:** `enhancement`

**Description:**
The escrow contract exists locally but has never been deployed to a live network. The backend route `GET /api/escrow/:id` returns `501 Not Implemented` because `CONTRACT_ID` and `RPC_URL` are not configured. Without a testnet deployment, no end-to-end flow can be tested.

**Acceptance Criteria:**
- [ ] Contract is compiled with `stellar contract build` and deployed to Stellar Testnet using `stellar contract deploy`
- [ ] `initialize(admin)` is called and the admin address is documented
- [ ] `create_escrow`, `fund_escrow`, `release`, and `get_escrow` are verified end-to-end against the live Testnet RPC
- [ ] `README.md` is updated with the deployed contract ID and RPC endpoint (`https://soroban-testnet.stellar.org`)
- [ ] `.env.example` files in `backend/` and `frontend/` are updated with the correct `CONTRACT_ID` and `RPC_URL` values

---

## Issue 2 — Wire up `GET /api/escrow/:id` backend route
**Labels:** `enhancement`

**Description:**
`backend/src/routes/escrow.ts` has a `GET /api/escrow/:id` route that returns `501 Not Implemented`. It contains TODO comments to instantiate `EscrowClient` and call `getEscrow`. This needs to be completed once the contract is deployed (Issue 1).

**Acceptance Criteria:**
- [ ] Depends on Issue 1 (deployed contract ID and RPC URL)
- [ ] `GET /api/escrow/:id` instantiates `EscrowClient` using `CONTRACT_ID`, `RPC_URL`, and `NETWORK_PASSPHRASE` from environment variables
- [ ] Returns the full `EscrowData` as JSON on success
- [ ] Returns `404` with `{ error: "escrow not found" }` when the escrow ID does not exist
- [ ] Returns `500` with `{ error: <message> }` on RPC failure
- [ ] Integration test covers the happy path and the not-found case

---

## Issue 3 — Integrate OpenAI into AI arbiter
**Labels:** `enhancement`

**Description:**
`backend/src/ai/arbiter.ts` uses a keyword heuristic stub instead of a real AI model. The file contains TODO comments for OpenAI integration. The stub produces unreliable recommendations that should not be used in production.

**Acceptance Criteria:**
- [ ] `openai` npm package is added as a dependency (pinned version)
- [ ] `analyseDispute` sends `evidenceText` to GPT-4o using a structured system prompt that instructs the model to return `recommendation` (`release` | `refund` | `insufficient_evidence`), `confidence` (0–1), and `reasoning`
- [ ] OpenAI function calling or structured output (`response_format: { type: "json_object" }`) is used to guarantee parseable output
- [ ] `OPENAI_API_KEY` is read from environment; the function throws a clear error if it is missing
- [ ] `backend/.env.example` documents `OPENAI_API_KEY`
- [ ] Test: mock OpenAI response is parsed correctly into `ArbiterResult`
- [ ] Test: missing API key throws `"OPENAI_API_KEY is not set"`

---

## Issue 4 — Integrate OpenAI into NLP escrow parser
**Labels:** `enhancement`

**Description:**
`backend/src/ai/nlp.ts` uses a basic regex stub instead of GPT-4 function calling. The stub cannot reliably extract beneficiary addresses, token types, or complex conditions from natural language.

**Acceptance Criteria:**
- [ ] `parseEscrowDescription` sends the description to GPT-4o using OpenAI function calling with a schema matching `ParsedEscrowParams`
- [ ] The function extracts: `amount`, `currency` (XLM/USDC), `beneficiary` (Stellar address if present), `condition`, `expiryDays`, and `confidence`
- [ ] If the model cannot extract a field, it is returned as `undefined` (not guessed)
- [ ] `OPENAI_API_KEY` is shared with the arbiter module (single initialisation)
- [ ] Test: mock OpenAI response with a known description returns correct structured params
- [ ] `backend/README.md` documents the expected input format and example output

---

## Issue 5 — Add `POST /api/escrow/create` backend route
**Labels:** `enhancement`

**Description:**
There is no backend route to create an escrow via the API. The frontend `CreateEscrow` page calls the contract directly from the browser, which requires the user's secret key to be available client-side. A backend route using a server-side keypair is safer for server-managed escrows.

**Acceptance Criteria:**
- [ ] `POST /api/escrow/create` accepts `{ escrowId, depositor, beneficiary, arbiter, amount, token, expiryTs }` in the request body
- [ ] Validates all required fields; returns `400` with field-level errors on missing/invalid input
- [ ] Calls `EscrowClient.createEscrow` using a server keypair from `SERVER_SECRET_KEY` env var
- [ ] Returns `{ txHash }` on success
- [ ] `backend/.env.example` documents `SERVER_SECRET_KEY`
- [ ] Test covers happy path and validation errors

---

## Issue 6 — Add expiry-based auto-refund endpoint
**Labels:** `enhancement`

**Description:**
The contract allows anyone to trigger `refund` after `expiry_ts` without arbiter auth. There is no backend endpoint or cron job to automatically process expired escrows, so depositors must manually trigger refunds.

**Acceptance Criteria:**
- [ ] `POST /api/escrow/:id/refund` calls `EscrowClient.refund(escrowId)` and returns `{ txHash }`
- [ ] Returns `400` if the escrow is not in `Funded` or `Disputed` state
- [ ] Returns `403` if the escrow has not expired and the caller is not the arbiter (document that arbiter auth is handled on-chain)
- [ ] A cron job script `backend/src/cron/auto-refund.ts` queries all escrows and calls refund on any that are expired and still `Funded`
- [ ] `README.md` documents how to run the cron job

---

## Issue 7 — Add `GET /api/escrow/depositor/:address` route
**Labels:** `enhancement`

**Description:**
`EscrowClient.getEscrowsByDepositor` is implemented in the SDK but there is no backend route exposing it. The frontend has no way to list a user's escrows without calling the contract directly.

**Acceptance Criteria:**
- [ ] `GET /api/escrow/depositor/:address` calls `EscrowClient.getEscrowsByDepositor(address)` and returns `{ escrowIds: string[] }`
- [ ] Returns `400` if the address is not a valid Stellar public key format
- [ ] Returns `200` with an empty array if the depositor has no escrows
- [ ] Frontend `EscrowDetail` page or a new `MyEscrows` page uses this endpoint to list the user's escrows

---

## Issue 8 — Add TypeScript SDK unit tests
**Labels:** `testing`

**Description:**
`sdk/__tests__/client.test.ts` exists but its coverage needs to be verified and expanded. `EscrowClient` methods should be tested with mocked RPC responses.

**Acceptance Criteria:**
- [ ] `createEscrow` is tested with a mocked `sendTransaction` response
- [ ] `fundEscrow`, `release`, `refund`, `dispute`, `resolveDispute` are each tested for the happy path
- [ ] `getEscrow` is tested with a mocked `simulateTransaction` response returning a valid `EscrowData`
- [ ] `getEscrowsByDepositor` is tested with a mocked response
- [ ] Error case: `invoke` without a keypair throws `"keypair required for write operations"`
- [ ] All tests pass with `npm test` in the `sdk/` directory

---

## Issue 9 — Add contract event parsing to SDK
**Labels:** `enhancement`

**Description:**
The contract emits six events (`EscrowCreated`, `EscrowFunded`, `EscrowReleased`, `EscrowRefunded`, `EscrowDisputed`, `DisputeResolved`) but the SDK has no method to fetch or parse them.

**Acceptance Criteria:**
- [ ] TypeScript interfaces for all six events are exported from `sdk/src/types.ts`
- [ ] `EscrowClient.getEvents(escrowId: string, ledgerStart: number)` fetches events from the RPC using `server.getEvents` filtered by the escrow ID topic
- [ ] Returns a typed `EscrowEvent[]` union of all six event types
- [ ] Test: mocked RPC event response is parsed into the correct typed event
- [ ] Example usage is added to `sdk/` or `docs/`

---

## Issue 10 — Add `get_escrows_by_beneficiary` contract function
**Labels:** `enhancement`

**Description:**
The contract indexes escrows by depositor (`DEP_IDX`) but not by beneficiary. Beneficiaries have no on-chain way to discover escrows they are party to without being told the escrow ID out-of-band.

**Acceptance Criteria:**
- [ ] A `BEN_IDX` storage key is added (same structure as `DEP_IDX`: `Map<Address, Vec<String>>`)
- [ ] `create_escrow` populates `BEN_IDX` alongside `DEP_IDX`
- [ ] `get_escrows_by_beneficiary(env: Env, beneficiary: Address) -> Vec<String>` is added
- [ ] Test: returns correct escrow IDs after creating multiple escrows for the same beneficiary
- [ ] `EscrowClient` gains `getEscrowsByBeneficiary(beneficiary: string): Promise<string[]>`

---

## Issue 11 — Add `get_escrow_count()` view function
**Labels:** `good first issue`

**Description:**
There is no way to query how many escrows exist without fetching all keys. A count function is useful for dashboards and pagination.

**Acceptance Criteria:**
- [ ] `get_escrow_count(env: Env) -> u32` is added, returning the number of keys in the `ESCROWS` map
- [ ] Test: returns 0 before any escrow is created, increments correctly with each `create_escrow`
- [ ] Function is documented in `docs/API.md` (or inline doc comment)

---

## Issue 12 — Add `is_expired(escrow_id)` view function
**Labels:** `good first issue`

**Description:**
Consumers must call `get_escrow` and compare `expiry_ts` to the current ledger timestamp manually. A dedicated view function is cleaner.

**Acceptance Criteria:**
- [ ] `is_expired(env: Env, escrow_id: String) -> bool` is added, returning `env.ledger().timestamp() >= data.expiry_ts`
- [ ] Panics with `"escrow not found"` if the ID does not exist
- [ ] Test: returns `false` before expiry, `true` after
- [ ] `EscrowClient` gains `isExpired(escrowId: string): Promise<bool>`

---

## Issue 13 — Add `cancel_escrow` function (pre-funding cancellation)
**Labels:** `enhancement`

**Description:**
A depositor who creates an escrow but has not yet funded it has no way to cancel it. The escrow remains in `Pending` state indefinitely, polluting the depositor's index.

**Acceptance Criteria:**
- [ ] `cancel_escrow(env: Env, escrow_id: String)` is added; only callable by the depositor
- [ ] Only allowed when status is `Pending` (panics with `"can only cancel pending escrow"` otherwise)
- [ ] Removes the escrow from the `ESCROWS` map and from the depositor's `DEP_IDX` entry
- [ ] Test: cancelled escrow returns `"escrow not found"` on subsequent `get_escrow`
- [ ] Test: non-depositor cannot cancel

---

## Issue 14 — Add partial release support
**Labels:** `enhancement`

**Description:**
The contract only supports releasing the full escrow amount. Some use cases (e.g. milestone-based payments) require releasing a portion of the funds while keeping the rest locked.

**Acceptance Criteria:**
- [ ] `release_partial(env: Env, escrow_id: String, amount: i128, caller: Address)` is added
- [ ] Only callable by arbiter or depositor when status is `Funded`
- [ ] Transfers `amount` to the beneficiary; reduces `data.amount` by `amount`; status remains `Funded`
- [ ] If `amount == data.amount`, status transitions to `Released`
- [ ] Panics with `"amount exceeds escrow balance"` if `amount > data.amount`
- [ ] Test: partial release reduces balance correctly; full release transitions status
- [ ] Test: over-release panics

---

## Issue 15 — Add escrow ID validation
**Labels:** `enhancement`

**Description:**
`create_escrow` accepts any string as `escrow_id`. Empty strings or excessively long IDs can cause storage issues and confuse consumers.

**Acceptance Criteria:**
- [ ] `create_escrow` validates `escrow_id`: must be 1–64 characters, alphanumeric plus `-` and `_`
- [ ] Panics with `"invalid escrow id"` on validation failure
- [ ] Test: valid IDs like `"escrow-001"` and `"e_1"` are accepted
- [ ] Test: empty string is rejected
- [ ] Test: ID longer than 64 characters is rejected
- [ ] Test: ID with spaces or special characters is rejected

---

## Issue 16 — Add minimum amount validation
**Labels:** `enhancement`

**Description:**
`create_escrow` accepts any `i128` amount including zero and negative values. A zero-amount escrow is meaningless and a negative amount would cause a token transfer panic.

**Acceptance Criteria:**
- [ ] `create_escrow` panics with `"amount must be positive"` if `params.amount <= 0`
- [ ] Test: amount of 1 is accepted
- [ ] Test: amount of 0 is rejected
- [ ] Test: negative amount is rejected

---

## Issue 17 — Add expiry validation on create
**Labels:** `enhancement`

**Description:**
`create_escrow` accepts any `expiry_ts` including timestamps in the past. An escrow with a past expiry can be immediately refunded by anyone, which is likely a user error.

**Acceptance Criteria:**
- [ ] `create_escrow` panics with `"expiry must be in the future"` if `params.expiry_ts <= env.ledger().timestamp()`
- [ ] Test: expiry 1 second in the future is accepted
- [ ] Test: expiry equal to current timestamp is rejected
- [ ] Test: expiry in the past is rejected

---

## Issue 18 — Add `transfer_admin` two-step ownership transfer
**Labels:** `enhancement`

**Description:**
The contract has an `initialize` function that sets the admin but no way to transfer admin rights. If the admin key is lost or compromised, the contract cannot be managed.

**Acceptance Criteria:**
- [ ] `propose_admin(env: Env, new_admin: Address)` admin-only function stores `new_admin` as pending
- [ ] `accept_admin(env: Env)` requires auth from the pending admin and sets them as active admin
- [ ] `get_admin(env: Env) -> Address` view function is added
- [ ] Test: `accept_admin` called by wrong address is rejected
- [ ] Test: after `accept_admin`, new admin can call admin-only functions (if any exist)
- [ ] Test: `get_admin` returns the correct address after transfer

---

## Issue 19 — Add `pause` / `unpause` emergency mechanism
**Labels:** `enhancement`

**Description:**
There is no way to halt the contract in an emergency (e.g. a vulnerability is discovered). An admin-controlled pause prevents further escrow creation and fund movements.

**Acceptance Criteria:**
- [ ] `pause(env: Env)` and `unpause(env: Env)` are admin-only functions
- [ ] `is_paused(env: Env) -> bool` view function is added
- [ ] `create_escrow`, `fund_escrow`, `release`, `refund`, `dispute`, and `resolve_dispute` all panic with `"contract is paused"` when paused
- [ ] Test: all mutating functions are rejected while paused
- [ ] Test: operations succeed after `unpause`
- [ ] Test: non-admin cannot call `pause`

---

## Issue 20 — Add Soroban contract upgrade mechanism
**Labels:** `enhancement`

**Description:**
The contract has no upgrade path. Fixing bugs requires deploying a new contract ID and migrating all existing escrows.

**Acceptance Criteria:**
- [ ] `upgrade(env: Env, new_wasm_hash: BytesN<32>)` admin-only function is added, calling `env.deployer().update_current_contract_wasm(new_wasm_hash)`
- [ ] Test: after upgrade, instance storage (escrows map, depositor index) is preserved
- [ ] Test: non-admin cannot call `upgrade`

---

## Issue 21 — Add fuzz tests for escrow lifecycle
**Labels:** `testing`

**Description:**
The escrow lifecycle involves multiple state transitions. Property-based tests can catch invalid transitions that hand-written tests miss.

**Acceptance Criteria:**
- [ ] `proptest` is added as a dev dependency
- [ ] Fuzz test: random sequences of `fund`, `release`, `refund`, `dispute`, `resolve_dispute` calls verify that only valid state transitions succeed and invalid ones panic
- [ ] Fuzz test: random `amount` values (including 0 and negative) verify that `create_escrow` rejects invalid amounts
- [ ] All fuzz tests pass with `cargo test`

---

## Issue 22 — Add test for expiry-based refund without arbiter
**Labels:** `testing`

**Description:**
The contract allows anyone to trigger `refund` after `expiry_ts` without arbiter auth. This path is not explicitly tested.

**Acceptance Criteria:**
- [ ] Test: `refund` called before expiry without arbiter auth panics
- [ ] Test: `refund` called after `expiry_ts` by a random address succeeds and transitions status to `Refunded`
- [ ] Test: depositor receives the correct token amount after expiry refund

---

## Issue 23 — Add test for dispute raised by beneficiary
**Labels:** `testing`

**Description:**
`dispute` can be raised by either the depositor or the beneficiary. Only the depositor case is tested in `test_dispute_and_resolve_to_beneficiary`.

**Acceptance Criteria:**
- [ ] Test: beneficiary raises dispute — status transitions to `Disputed`, `evidence_hash` is set
- [ ] Test: third party (not depositor or beneficiary) raising dispute panics with `"only depositor or beneficiary can dispute"`
- [ ] Test: `resolve_dispute(false)` after beneficiary-raised dispute refunds the depositor correctly

---

## Issue 24 — Add test for token balance assertions
**Labels:** `testing`

**Description:**
Existing tests verify status transitions but do not assert that token balances change correctly after `fund_escrow`, `release`, `refund`, and `resolve_dispute`.

**Acceptance Criteria:**
- [ ] Test: after `fund_escrow`, depositor balance decreases by `amount` and contract balance increases by `amount`
- [ ] Test: after `release`, beneficiary balance increases by `amount` and contract balance returns to 0
- [ ] Test: after `refund`, depositor balance is restored and contract balance returns to 0
- [ ] Test: after `resolve_dispute(true)`, beneficiary receives `amount`; after `resolve_dispute(false)`, depositor receives `amount`

---

## Issue 25 — Add Rust clippy and fmt to CI
**Labels:** `good first issue`

**Description:**
The CI workflow runs tests but does not enforce code style or lint rules.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` gains two steps: `cargo fmt --check` and `cargo clippy -- -D warnings`
- [ ] Both run at the workspace level
- [ ] Existing code passes both checks (fix any pre-existing issues as part of this PR)
- [ ] `CONTRIBUTING.md` documents that contributors should run `cargo fmt` and `cargo clippy` before submitting a PR

---

## Issue 26 — Add ESLint to TypeScript packages
**Labels:** `good first issue`

**Description:**
None of the three TypeScript packages (`sdk/`, `backend/`, `frontend/`) have a linter configured.

**Acceptance Criteria:**
- [ ] `eslint` and `@typescript-eslint` are added as dev dependencies to each package (pinned versions)
- [ ] A shared `.eslintrc.json` or per-package config uses `@typescript-eslint/recommended`
- [ ] Each `package.json` gains a `"lint"` script
- [ ] All existing files pass linting without errors
- [ ] `.github/workflows/ci.yml` runs `npm run lint` for each package

---

## Issue 27 — Write full API documentation
**Labels:** `documentation`

**Description:**
There is no reference documentation for the contract's public interface. Contributors and integrators must read `lib.rs` to understand function signatures and error conditions.

**Acceptance Criteria:**
- [ ] `docs/API.md` documents every public function: `initialize`, `create_escrow`, `fund_escrow`, `release`, `refund`, `dispute`, `resolve_dispute`, `get_escrow`, `get_escrows_by_depositor`
- [ ] Each entry includes: function signature, parameters with types, return type, valid states, error conditions (panic messages), and a usage example
- [ ] All six contract events are documented with their fields
- [ ] `EscrowStatus` enum values and valid transitions are documented as a state machine diagram (ASCII or Mermaid)

---

## Issue 28 — Write `docs/architecture.md`
**Labels:** `documentation`

**Description:**
`docs/architecture.md` exists but its content needs to be verified and completed. New contributors need a clear explanation of how the system works end-to-end.

**Acceptance Criteria:**
- [ ] Covers: escrow lifecycle (Pending → Funded → Released/Refunded/Disputed → Resolved), storage layout (`ESCROWS`, `DEP_IDX`, `ADMIN`), token flow (depositor → contract → beneficiary/depositor), arbiter role, AI arbiter backend, NLP parser, and frontend pages
- [ ] A Mermaid or ASCII state machine diagram shows all status transitions
- [ ] A sequence diagram shows the full create → fund → release flow
- [ ] `README.md` links to `docs/architecture.md`

---

## Issue 29 — Write `docs/integration-guide.md`
**Labels:** `documentation`

**Description:**
There is no guide for developers who want to integrate the escrow SDK into their own dApp.

**Acceptance Criteria:**
- [ ] Covers: installing the SDK, creating an `EscrowClient`, the full escrow lifecycle with code examples, handling errors, and listening to contract events (Issue 9)
- [ ] Includes a complete working example: create → fund → release
- [ ] Documents all `EscrowData` fields and `EscrowStatus` values
- [ ] `README.md` links to the guide

---

## Issue 30 — Add `stellar.toml` metadata
**Labels:** `good first issue`

**Description:**
`stellar.toml` exists but its content needs to be completed per SEP-1 with the deployed contract information.

**Acceptance Criteria:**
- [ ] `stellar.toml` includes: `NETWORK_PASSPHRASE`, `HORIZON_URL`, a `[[CONTRACTS]]` section with the deployed contract ID (from Issue 1), contract name, description, and a link to `docs/API.md`
- [ ] The file is valid TOML
- [ ] `README.md` links to `stellar.toml`

---

## Issue 31 — Add `CHANGELOG.md`
**Labels:** `documentation`, `good first issue`

**Description:**
`CHANGELOG.md` exists but needs to follow the Keep a Changelog format and document all features implemented so far.

**Acceptance Criteria:**
- [ ] Follows [Keep a Changelog](https://keepachangelog.com) format with an `[Unreleased]` section
- [ ] Documents all current features: contract functions, events, SDK client, backend routes, AI arbiter stub, NLP stub, frontend pages
- [ ] `README.md` links to `CHANGELOG.md`

---

## Issue 32 — Complete issue and PR templates
**Labels:** `good first issue`

**Description:**
`.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, and `.github/pull_request_template.md` exist but contain minimal placeholder content.

**Acceptance Criteria:**
- [ ] `bug_report.md` includes: Description, Steps to Reproduce, Expected Behaviour, Actual Behaviour, Environment (OS, Node/Rust version, contract ID)
- [ ] `feature_request.md` includes: Problem, Proposed Solution, Alternatives Considered
- [ ] `pull_request_template.md` includes: Summary, Changes, Testing, Checklist (tests added, docs updated, lint passes)
- [ ] All templates are free of placeholder text

---

## Issue 33 — Add SDK npm publish workflow
**Labels:** `enhancement`

**Description:**
There is no automated process to publish the TypeScript SDK to npm.

**Acceptance Criteria:**
- [ ] `.github/workflows/publish.yml` triggers on push of a tag matching `sdk-v*`
- [ ] Runs `npm ci`, `npm run build`, and `npm publish --access public` in `sdk/`
- [ ] npm token is read from `secrets.NPM_TOKEN`
- [ ] `sdk/package.json` has `"name": "@stellar-escrow/sdk"` and a `"build"` script running `tsc`
- [ ] Documented in `CONTRIBUTING.md`

---

## Issue 34 — Add Dockerfile for backend
**Labels:** `good first issue`

**Description:**
The backend has no container packaging. Deploying it requires managing Node.js versions manually.

**Acceptance Criteria:**
- [ ] `Dockerfile` at repo root (or `backend/Dockerfile`) uses a multi-stage build: build stage (`node:20-alpine` + `npm ci` + `tsc`), runtime stage (`node:20-alpine`)
- [ ] `docker-compose.yml` defines a `backend` service with all required env vars as placeholders
- [ ] `backend/README.md` documents all environment variables: `PORT`, `CONTRACT_ID`, `RPC_URL`, `NETWORK_PASSPHRASE`, `SERVER_SECRET_KEY`, `OPENAI_API_KEY`
- [ ] `docker compose up` starts the backend without errors (given valid env vars)

---

## Issue 35 — Add frontend wallet integration (Freighter)
**Labels:** `enhancement`

**Description:**
The frontend `CreateEscrow` page constructs transactions but has no wallet integration. Users cannot sign transactions without exposing their secret key.

**Acceptance Criteria:**
- [ ] `@stellar/freighter-api` is added as a dependency
- [ ] A `useWallet` hook is added that calls `getPublicKey()` and `isConnected()` from Freighter
- [ ] `CreateEscrow` page uses the wallet hook to get the depositor address and sign transactions via `signTransaction`
- [ ] A "Connect Wallet" button is shown in the nav when not connected
- [ ] `frontend/.env.example` documents `VITE_CONTRACT_ID` and `VITE_RPC_URL`
- [ ] `docs/integration-guide.md` documents the Freighter requirement

---

## Issue 36 — Add `MyEscrows` page to frontend
**Labels:** `enhancement`

**Description:**
There is no page for a user to see all their escrows. They must know the escrow ID to look it up via the `EscrowDetail` page.

**Acceptance Criteria:**
- [ ] A `MyEscrows` page is added at `/my-escrows`
- [ ] It calls `GET /api/escrow/depositor/:address` (Issue 7) with the connected wallet address
- [ ] Each escrow is shown as a card with: escrow ID, beneficiary (truncated), amount, status badge (using existing `StatusBadge` component), and a link to `EscrowDetail`
- [ ] Empty state message is shown when the user has no escrows
- [ ] Nav link "My Escrows" is added to `App.tsx`

---

## Issue 37 — Add AI arbiter recommendation to dispute UI
**Labels:** `enhancement`

**Description:**
The `DisputeForm` page collects evidence but does not call the AI arbiter backend. The arbiter has no UI to see the AI recommendation before making a decision.

**Acceptance Criteria:**
- [ ] `DisputeForm` calls `POST /api/dispute/analyse` after evidence is submitted and displays the result: recommendation, confidence percentage, and reasoning
- [ ] The recommendation is shown as a non-binding suggestion with a disclaimer: "AI recommendation — final decision rests with the arbiter"
- [ ] Loading and error states are handled
- [ ] The arbiter's `resolve_dispute` action (release or refund) is available on the same page

---

## Issue 38 — Add `create-from-text` UI to frontend
**Labels:** `enhancement`

**Description:**
`POST /api/escrow/create-from-text` exists in the backend but the frontend has no UI for it. Users must use the structured form even for simple natural language descriptions.

**Acceptance Criteria:**
- [ ] A "Create from description" tab or toggle is added to the `CreateEscrow` page
- [ ] A textarea accepts a natural language description (e.g. "Hold 100 XLM for Alice until she delivers the logo, expires in 30 days")
- [ ] On submit, calls `POST /api/escrow/create-from-text` and pre-fills the structured form fields with the parsed result
- [ ] Confidence score is shown; fields with low confidence are highlighted for user review
- [ ] User can edit pre-filled fields before final submission

---

## Issue 39 — Add integration tests against local sandbox
**Labels:** `testing`

**Description:**
All existing tests use the Soroban `Env` mock. There are no end-to-end tests that deploy the contract to a local sandbox and exercise the full transaction lifecycle.

**Acceptance Criteria:**
- [ ] A `tests/integration/` directory is created with a test script that: starts a local Stellar sandbox, deploys the contract, initialises it, runs the full create → fund → release flow, and asserts correct final state
- [ ] Tests cover: happy path, dispute → resolve to beneficiary, expiry refund
- [ ] A `Makefile` target `make integration-test` runs the suite
- [ ] CI runs integration tests on pull requests (skippable with `skip-integration` label)

---

## Issue 40 — Add `SECURITY.md` and `CODE_OF_CONDUCT.md`
**Labels:** `documentation`, `good first issue`

**Description:**
`SECURITY.md` and `CODE_OF_CONDUCT.md` exist but contain minimal content. They need to be completed with real information.

**Acceptance Criteria:**
- [ ] `SECURITY.md` describes: supported versions, how to report a vulnerability (email or private GitHub advisory), expected response time, and reporter credit policy — no placeholder text
- [ ] `CODE_OF_CONDUCT.md` uses Contributor Covenant v2.1 with a real contact email for reporting violations
- [ ] Both files are linked from `README.md` and `CONTRIBUTING.md`
