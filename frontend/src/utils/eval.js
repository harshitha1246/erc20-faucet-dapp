import {
  getBalance,
  requestTokens,
  canClaim,
  getRemainingAllowance,
  getContractAddresses
} from "./contracts.js";
import { connectWallet } from "./wallet.js";

window.__EVAL__ = {
  connectWallet: async () => {
    try {
      const address = await connectWallet();
      return address;
    } catch (error) {
      throw new Error(`connectWallet failed: ${error.message}`);
    }
  },

  requestTokens: async () => {
    try {
      const txHash = await requestTokens();
      return txHash;
    } catch (error) {
      throw new Error(`requestTokens failed: ${error.message}`);
    }
  },

  getBalance: async (address) => {
    try {
      const balance = await getBalance(address);
      return balance;
    } catch (error) {
      throw new Error(`getBalance failed: ${error.message}`);
    }
  },

  canClaim: async (address) => {
    try {
      return await canClaim(address);
    } catch (error) {
      throw new Error(`canClaim failed: ${error.message}`);
    }
  },

  getRemainingAllowance: async (address) => {
    try {
      const remaining = await getRemainingAllowance(address);
      return remaining;
    } catch (error) {
      throw new Error(`getRemainingAllowance failed: ${error.message}`);
    }
  },

  getContractAddresses: async () => {
    try {
      return getContractAddresses();
    } catch (error) {
      throw new Error(`getContractAddresses failed: ${error.message}`);
    }
  }
};
