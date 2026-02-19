import { ethers } from "ethers";

const RUNTIME_ENV = window.__ENV__ || {};
const TOKEN_ADDRESS = RUNTIME_ENV.VITE_TOKEN_ADDRESS || import.meta.env.VITE_TOKEN_ADDRESS;
const FAUCET_ADDRESS = RUNTIME_ENV.VITE_FAUCET_ADDRESS || import.meta.env.VITE_FAUCET_ADDRESS;
const RPC_URL = RUNTIME_ENV.VITE_RPC_URL || import.meta.env.VITE_RPC_URL;

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function MAX_SUPPLY() view returns (uint256)"
];

const FAUCET_ABI = [
  "function requestTokens()",
  "function canClaim(address) view returns (bool)",
  "function remainingAllowance(address) view returns (uint256)",
  "function lastClaimAt(address) view returns (uint256)",
  "function isPaused() view returns (bool)",
  "event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp)"
];

export function getContractAddresses() {
  return { token: TOKEN_ADDRESS, faucet: FAUCET_ADDRESS };
}

export function getReadProvider() {
  if (!RPC_URL) {
    throw new Error("VITE_RPC_URL is not set");
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function switchToLocalhost() {
  if (!window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a69" }] // 31337 in hex for localhost
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x7a69",
          chainName: "Localhost",
          rpcUrls: ["http://127.0.0.1:8545"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
        }]
      });
    } else {
      throw error;
    }
  }
}

export async function getSigner() {
  await switchToLocalhost();
  const provider = getBrowserProvider();
  return provider.getSigner();
}

export function getTokenContract(providerOrSigner) {
  if (!TOKEN_ADDRESS) {
    throw new Error("VITE_TOKEN_ADDRESS is not set");
  }
  return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, providerOrSigner);
}

export function getFaucetContract(providerOrSigner) {
  if (!FAUCET_ADDRESS) {
    throw new Error("VITE_FAUCET_ADDRESS is not set");
  }
  return new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, providerOrSigner);
}

export async function getBalance(address) {
  const provider = getReadProvider();
  const token = getTokenContract(provider);
  const balance = await token.balanceOf(address);
  return balance.toString();
}

export async function requestTokens() {
  const signer = await getSigner();
  const faucet = getFaucetContract(signer);
  const tx = await faucet.requestTokens();
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function canClaim(address) {
  const provider = getReadProvider();
  const faucet = getFaucetContract(provider);
  return faucet.canClaim(address);
}

export async function getRemainingAllowance(address) {
  const provider = getReadProvider();
  const faucet = getFaucetContract(provider);
  const remaining = await faucet.remainingAllowance(address);
  return remaining.toString();
}

export async function getLastClaimAt(address) {
  const provider = getReadProvider();
  const faucet = getFaucetContract(provider);
  const lastClaim = await faucet.lastClaimAt(address);
  return Number(lastClaim);
}

export async function getTokenMeta() {
  const provider = getReadProvider();
  const token = getTokenContract(provider);
  const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
  return { decimals, symbol };
}
