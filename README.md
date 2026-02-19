# ERC-20 Faucet DApp

## Overview
This project is a full-stack ERC-20 token faucet DApp with on-chain rate limiting, lifetime claim caps, and a wallet-integrated frontend. It includes a Hardhat smart contract workspace, a React frontend, and Docker deployment.

## Architecture
- **Token Contract**: ERC-20 with fixed max supply and minting restricted to the faucet.
- **Faucet Contract**: Enforces 24-hour cooldown, lifetime limit, pause/unpause, and emits events.
- **Frontend**: React + ethers.js with wallet integration and a global `window.__EVAL__` interface.
- **Docker**: Single container serving the production frontend with `/health` endpoint.

## Deployed Contracts
Add your verified Sepolia addresses here:
- Token: https://sepolia.etherscan.io/address/0xYourTokenAddress
- Faucet: https://sepolia.etherscan.io/address/0xYourFaucetAddress

## Quick Start
```bash
cp .env.example .env
# Edit .env with your values

npm install
npm run compile
npm run test
npm run deploy:sepolia

cd frontend
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```
Frontend will be available at http://localhost:3000 and health check at http://localhost:3000/health

## Configuration
- `SEPOLIA_RPC_URL`: Sepolia RPC URL for deployments.
- `PRIVATE_KEY`: Deployer private key.
- `ETHERSCAN_API_KEY`: Etherscan API key for contract verification.
- `VITE_RPC_URL`: RPC URL for frontend reads.
- `VITE_TOKEN_ADDRESS`: Deployed token address.
- `VITE_FAUCET_ADDRESS`: Deployed faucet address.

## Design Decisions
- Faucet amount: 100 tokens per claim to keep UX simple.
- Lifetime cap: 1000 tokens to prevent abuse.
- Max supply: 1,000,000 tokens for sufficient testnet supply.

## Testing Approach
- Hardhat tests cover deployment, claims, cooldown enforcement, lifetime limit, pause access control, and events.

## Security Considerations
- Checks-effects-interactions pattern in `requestTokens`.
- Minting restricted to faucet contract.
- Admin-only pause control.
- ReentrancyGuard used on token requests.

## Known Limitations
- Frontend only targets one network at a time.
- No admin UI for pausing (can be done via scripts/Hardhat console).
