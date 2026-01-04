# Secure Vault Authorization System  
**A Deterministic, Replay-Safe, Two-Contract Fund Security Architecture**

---

## Overview
This project implements a **secure dual-contract vault system** that cleanly separates:

- **Asset Custody** → Managed by `SecureVault`
- **Authorization & Validation** → Managed by `AuthorizationManager`

Withdrawals are only executed after a **verified, one-time, on-chain authorization**, ensuring deterministic execution, replay protection, and strong trust boundaries.  
The full environment runs **locally via Docker**, requiring **no public blockchain deployment**.

---

## Project Objective
Modern decentralized systems often split responsibilities across multiple contracts to reduce risk, increase clarity, and prevent privilege concentration.  
This system demonstrates how to:

- Enforce **one-time authorization**
- Preserve **correctness under adversarial execution**
- Prevent **replay & duplicate withdrawals**
- Maintain **clear responsibility separation**
- Guarantee **deterministic & observable behavior**

---

## System Architecture

### 1️. SecureVault (Custody Contract)
- Holds native currency (ETH)
- Accepts deposits from anyone
- Executes withdrawals **only after external authorization validation**
- Delegates all permission logic

### 2️. AuthorizationManager (Permission Authority)
- Validates **off-chain signed** withdrawal permissions
- Performs **ECDSA verification**
- Ensures **authorization can only be used once**
- Tracks consumed authorizations

> **Design Principle**  
> The vault performs **zero cryptographic checks** and **fully trusts** the authorization manager.  
> This mirrors real-world DeFi protocols where trust boundaries are explicit.

---

## 🔏 Authorization Model

### Bound Authorization Context
Each withdrawal authorization is tightly scoped to:
- Vault contract address  
- Recipient address  
- Withdrawal amount  
- Unique nonce  
- Chain ID  

### Deterministic Hash Construction
```

keccak256(
vault address,
recipient address,
amount,
nonce,
chainId
)

```

No authorization can accidentally apply to:
- Another vault  
- Another recipient  
- Another network  
- Another execution flow  

---

## Replay Protection
- Every authorization hash is stored after use  
- Reuse immediately reverts  
- Guarantees **exactly one successful state transition**

Prevents:
- Replay attacks  
- Duplicate withdrawals  
- Cross-contract duplication  
- Multi-call exploitation  

---

## Vault Behavior Guarantees
- Deposits always succeed  
- Withdrawals succeed **only with valid authorization**  
- Internal state updates occur **before value transfer**  
- Vault balance can never go negative  
- Unauthorized actors cannot trigger privileged actions  

---

## Initialization Safety
Both contracts include **one-time initialization guards** to prevent:
- Re-initialization  
- Unauthorized signer replacement  
- Malicious configuration  

---

## Observability
System emits structured events:
```

Deposit(address from, uint256 amount)
Withdrawal(address to, uint256 amount)
AuthorizationConsumed(bytes32 authorizationId)

```

Failed withdrawals **revert deterministically**.

---

## Repository Structure
```

/
├─ contracts/
│  ├─ SecureVault.sol
│  └─ AuthorizationManager.sol
├─ scripts/
│  └─ deploy.js
├─ tests/
│  └─ system.spec.js   # Optional but recommended
├─ docker/
│  ├─ Dockerfile
│  └─ entrypoint.sh
├─ docker-compose.yml
└─ README.md

```

---

## Local Execution (Docker)

### Prerequisites
- Docker  
- Docker Compose  

### One-Command Setup
```

docker-compose up --build

```

This automatically:
- Starts a local blockchain (Ganache / Hardhat Node)  
- Compiles contracts  
- Deploys AuthorizationManager  
- Deploys SecureVault  
- Initializes both contracts  
- Prints deployed contract addresses  

No manual steps required.

---

## Validation & Testing
Evaluation supports either:
- Automated tests **OR**
- A documented manual testing flow

Recommended tests cover:
- Successful withdrawal  
- Failed withdrawal  
- Replay attempt (must revert)  
- Invalid signature (must revert)  
- Cross-vault misuse attempt  
- Incorrect chain ID  
- Double authorization consumption prevention  

---

## Security Reasoning
- Vault contains **no cryptographic code**  
- Authorizations are **explicitly scoped**  
- One-time authorization enforcement  
- State updates done **before transferring value**  
- No assumptions about call ordering  
- Safe under repeated / composed execution  
- Deterministic behavior guaranteed  

---

## Deployment Output
Logs display:
- Network identifier  
- Deployer address  
- AuthorizationManager address  
- SecureVault address  

Easy for evaluators to locate and verify.

---

## System Guarantees
- Deposits accepted reliably  
- Withdrawals require valid, verified authorization  
- Each permission usable exactly once  
- Cross-contract execution safe  
- No unintended privileged behavior  
- Fully reproducible environment  
- Strong observability  

---

## Assumptions & Limitations
- Authorization generation relies on trusted off-chain signer  
- Only supports native tokens (no ERC20)  
- No built-in expiration timestamp (extendable)  
- Requires deterministic hash construction  

---

## FAQ
**Q:** Do I need a public blockchain?  
**A:** No. Everything runs locally.

**Q:** Is a frontend required?  
**A:** No.

**Q:** Can authorization format differ?  
**A:** Yes, as long as:
- It is deterministic  
- It binds context tightly  
- It enforces one-time usage  

**Q:** What if `docker-compose` doesn’t deploy contracts?  
**A:** System is considered incomplete.

**Q:** Are tests mandatory?  
**A:** Optional, but strongly recommended.

---

## Summary
This system demonstrates:
- Secure dual-contract architecture
- Explicit trust separation
- Replay-safe authorization enforcement
- Deterministic execution
- Production-grade Web3 reasoning
- Clean, auditable behavior