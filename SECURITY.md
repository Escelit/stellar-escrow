# Security Policy

We take the security of the Stellar Escrow Protocol seriously. If you believe you have found a security vulnerability, please report it to us as described below.

---

## 🛡 Supported Versions

We currently provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

---

## 🚩 Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues or PRs.**

To report a vulnerability, please use the **GitHub Security Advisory** feature:
1. Navigate to the [Security tab](../../security) of the repository.
2. Click on **Advisories**.
3. Click **Report a vulnerability**.

### What to Include:
- A detailed description of the vulnerability.
- Steps to reproduce (a proof-of-concept script or contract interaction is highly appreciated).
- The potential impact (e.g., "Funds can be drained without authorization").
- Any suggested fixes or mitigations.

### Response Time:
- **Acknowledgment**: Within 48 hours.
- **Full Assessment**: Within 5-7 business days.
- **Fix/Disclosure**: Depends on the severity, but we aim for a resolution within 30 days.

---

## 🔍 Scope

The following components are in scope for security reports:

- **`contracts/escrow-core`**: Core logic for fund locking, authorization, and dispute resolution.
- **`sdk/`**: Keypair handling, transaction serialization, and RPC safety.
- **`backend/`**: Authentication, AI prompt injection vulnerabilities, and API security.

---

## 📜 Disclosure Policy

We follow a **Coordinated Disclosure** policy:
- We ask you to give us a reasonable amount of time to fix the issue before making it public.
- We will credit you in our security advisories and changelogs.
- This project is part of the **Stellar Wave Program**. Exceptional security findings may be eligible for bounties through that program.

---

## 💡 Security Best Practices for Users

- **Key Management**: Never share your private keys or mnemonics. Use hardware wallets or trusted signers (like Freighter) for all on-chain actions.
- **Verification**: Always verify the `contract_id` you are interacting with.
- **Freighter Wallet**: We recommend using the [Freighter Wallet](https://www.freighter.app/) for secure transaction signing.

---
<p align="center">Thank you for helping us keep the Stellar ecosystem safe! 🔒</p>
