# Contributing to Stellar Escrow Protocol

First off, thank you for considering contributing to the Stellar Escrow Protocol! It's people like you who make this a great tool for the Stellar/Soroban ecosystem.

---

## 🏗 Development Environment Setup

To contribute to this project, you will need the following tools installed:

### 1. Rust & Soroban
- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **WASM Target**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: `cargo install --locked stellar-cli`

### 2. Node.js & TypeScript
- **Node.js**: v20.x or higher
- **Package Manager**: `npm` (bundled with Node.js)

### 3. Recommended Extensions (VS Code)
- `rust-analyzer`
- `ESLint`
- `Prettier - Code formatter`
- `Tailwind CSS IntelliSense`

---

## 🛠 Project Structure

Before you start, familiarise yourself with the directory layout:

- `/contracts/escrow-core`: The Soroban smart contract logic (Rust).
- `/sdk`: The TypeScript SDK for contract interaction.
- `/backend`: Node.js/Express API with AI integration.
- `/frontend`: React dashboard.

---

## 🔄 Development Workflow

We follow a standard Git Flow. Please follow these steps:

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stellar-escrow.git
   ```
3. **Create a branch** for your changes:
   ```bash
   # For features
   git checkout -b feat/your-feature-name
   # For bug fixes
   git checkout -b fix/your-bug-name
   # For documentation
   git checkout -b docs/your-doc-update
   ```
4. **Make your changes** and ensure tests pass (see below).
5. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add multi-token support to escrow creation"
   ```
6. **Push to your fork** and **open a Pull Request**.

---

## 🎨 Coding Standards

### Smart Contracts (Rust)
- **Linting**: Run `cargo clippy -- -D warnings` before committing.
- **Formatting**: Run `cargo fmt` to ensure consistent style.
- **Safety**: Avoid `unsafe` blocks unless absolutely necessary and documented.
- **Documentation**: Use `///` for public functions and types.

### SDK & Backend (TypeScript)
- **Linting**: We use ESLint. Ensure your code passes with `npm run lint`.
- **Formatting**: We use Prettier. Run `npm run format` to auto-format.
- **Types**: Strictly no `any`. Use proper interfaces and types.
- **Naming**: Use `camelCase` for variables/functions and `PascalCase` for classes/interfaces.

---

## 🧪 Testing Guidelines

No PR will be merged without accompanying tests.

### Running Tests

- **Contracts**:
  ```bash
  cd contracts/escrow-core
  cargo test
  ```
- **SDK**:
  ```bash
  cd sdk
  npm test
  ```
- **Backend**:
  ```bash
  cd backend
  npm test
  ```

### What to Test?
- **Positive cases**: Verify the feature works as intended.
- **Edge cases**: Zero amounts, expiry in the past, unauthorized callers.
- **Regression**: Ensure bug fixes include a test case that would have failed before the fix.

---

## 📝 Pull Request Guidelines

When opening a PR, please ensure:
- The PR description clearly explains the **what**, **why**, and **how**.
- You link the PR to a relevant issue (e.g., `Closes #123`).
- Screenshots or recordings are provided for UI changes.
- All CI checks (linting, tests, build) are passing.

---

## 🏛 Community & Conduct

- **Code of Conduct**: Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).
- **Security**: Report vulnerabilities privately via our [Security Policy](SECURITY.md).

---
<p align="center">Thank you for building the future of decentralized finance on Stellar! 🚀</p>
