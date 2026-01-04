## Secure Vault Authorization System

### **Deterministic, Replay-Safe, Two-Contract Fund Security Architecture**

A robust DeFi-inspired security architecture that separates asset custody from authorization logic. This system utilizes ECDSA signature verification, tight context binding, and a two-contract delegation model to ensure funds are only moved under verified, one-time-use permissions.

## System Architecture

The system is split into two distinct logic domains to minimize the attack surface of the custody layer.

| Component | Responsibility | Key Features |
| --- | --- | --- |
| **`SecureVault`** | **Asset Custody** | Holds ETH, manages internal balances, executes transfers. |
| **`AuthorizationManager`** | **Permission Authority** | ECDSA Verification, Nonce tracking, Replay protection. |

### Logic Separation

The `SecureVault` performs **zero** cryptographic checks. It relies entirely on the `AuthorizationManager`. This mirrors professional protocol design where the "hot" logic (validation) is decoupled from the "store" (vault).

---

## Security Model

### 1. Bound Authorization Context

To prevent cross-contract or cross-chain replay attacks, every authorization hash is strictly bound to the following domain:

* **Vault Address:** Prevents a signature for Vault A being used on Vault B.
* **Recipient Address:** Ensures funds cannot be diverted.
* **Amount:** Prevents "amount stuffing."
* **Nonce:** Ensures uniqueness.
* **Chain ID:** Prevents signatures from being replayed on forks or testnets (e.g., Goerli vs. Mainnet).

### 2. Replay Protection

The `AuthorizationManager` maintains a mapping of consumed authorization hashes.

1. User submits a signature.
2. System generates a deterministic `bytes32` hash of the parameters.
3. System checks if `isConsumed[hash] == true`.
4. If not, the transaction proceeds and the hash is marked as **true** before the transfer occurs (Protecting against Reentrancy).

---

## Getting Started (Local Development)

This project is fully containerized. No global installations of Node.js or Hardhat are required on your host machine.

### Prerequisites

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/install/)

### One-Command Setup

```bash
docker-compose up --build

```

**This command automates the following:**

1. Spins up a local Ethereum-compatible node.
2. Compiles the Solidity smart contracts.
3. Deploys `AuthorizationManager.sol`.
4. Deploys `SecureVault.sol` (linked to the manager).
5. Performs initialization guards.
6. Outputs contract addresses to the console.

---

## Project Structure

```text
/
├─ contracts/
│  ├─ SecureVault.sol            # Asset custody and execution
│  └─ AuthorizationManager.sol   # Signature and nonce validation
├─ scripts/
│  └─ deploy.js                  # Deployment and init orchestration
├─ tests/
│  └─ system.spec.js             # Security and functional test suite
├─ docker/
│  ├─ Dockerfile                 # Environment definition
│  └─ entrypoint.sh              # Container startup sequence
├─ docker-compose.yml            # Infrastructure orchestration
└─ README.md

```

---

## Security Guarantees

* **Deterministic Execution:** Identical inputs always yield the same authorization hash.
* **Initialization Safety:** Contracts use a `Locked` state or `initializable` pattern to prevent unauthorized ownership takeovers after deployment.
* **State Integrity:** Internal state updates (marking a nonce as used) are performed **before** external ETH transfers to mitigate reentrancy risks.
* **Observability:** All critical actions trigger events (`Deposit`, `Withdrawal`, `AuthorizationConsumed`) for off-chain indexing and auditing.

---

## Testing Validation

The system is validated against the following adversarial scenarios:

* **Double Spend:** Attempting to use the same signature twice (Must Revert).
* **Unauthorized Signer:** Using a signature not signed by the registered Authority (Must Revert).
* **Context Mismatch:** Using a valid signature intended for a different recipient or vault (Must Revert).
* **Cross-Chain Replay:** Attempting to reuse a signature on a different ChainID (Must Revert).

---

## FAQ

**Does this require gas for deployment?**
Only on the local Docker network. No real ETH is required.

**How are signatures generated?**
Signatures are expected to be produced off-chain using ECDSA (secp256k1) via libraries like `ethers.js` or `web3.js`.

**Can I use this for ERC20 tokens?**
The current implementation focuses on native ETH custody, but the `AuthorizationManager` is designed to be extensible for token-based vaults.

---
