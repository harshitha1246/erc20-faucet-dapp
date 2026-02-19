import React, { useEffect, useMemo, useState } from "react";
import {
  canClaim,
  getBalance,
  getLastClaimAt,
  getRemainingAllowance,
  getTokenMeta,
  requestTokens
} from "./utils/contracts.js";
import { connectWallet, onWalletEvents, removeWalletEvents } from "./utils/wallet.js";
import { ethers } from "ethers";

const COOLDOWN_SECONDS = 24 * 60 * 60;

export default function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [remaining, setRemaining] = useState("0");
  const [canClaimNow, setCanClaimNow] = useState(false);
  const [lastClaimAt, setLastClaimAt] = useState(0);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState("TOKEN");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const cooldownRemaining = useMemo(() => {
    if (!lastClaimAt) return 0;
    const next = lastClaimAt + COOLDOWN_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, next - now);
  }, [lastClaimAt]);

  const cooldownLabel = useMemo(() => {
    if (!lastClaimAt) return "Ready";
    if (cooldownRemaining === 0) return "Ready";
    const hours = Math.floor(cooldownRemaining / 3600);
    const minutes = Math.floor((cooldownRemaining % 3600) / 60);
    const seconds = cooldownRemaining % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [cooldownRemaining, lastClaimAt]);

  const formattedBalance = useMemo(() => {
    try {
      return ethers.formatUnits(balance, decimals);
    } catch {
      return balance;
    }
  }, [balance, decimals]);

  const formattedRemaining = useMemo(() => {
    try {
      return ethers.formatUnits(remaining, decimals);
    } catch {
      return remaining;
    }
  }, [remaining, decimals]);

  async function loadMeta() {
    try {
      const meta = await getTokenMeta();
      setDecimals(meta.decimals);
      setSymbol(meta.symbol);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadUserData(wallet) {
    if (!wallet) return;
    try {
      const [bal, rem, claimable, lastClaim] = await Promise.all([
        getBalance(wallet),
        getRemainingAllowance(wallet),
        canClaim(wallet),
        getLastClaimAt(wallet)
      ]);
      setBalance(bal);
      setRemaining(rem);
      setCanClaimNow(claimable);
      setLastClaimAt(lastClaim);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConnect() {
    setError("");
    setNotice("");
    try {
      const addr = await connectWallet();
      setAddress(addr);
      await loadUserData(addr);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRequest() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const hash = await requestTokens();
      setNotice(`Transaction confirmed: ${hash}`);
      await loadUserData(address);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      loadUserData(address);
    }, 10000);
    return () => clearInterval(interval);
  }, [address]);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAddress("");
        return;
      }
      setAddress(accounts[0]);
      loadUserData(accounts[0]);
    };

    const handleChainChanged = () => {
      if (address) {
        loadUserData(address);
      }
    };

    onWalletEvents(handleAccountsChanged, handleChainChanged);
    return () => removeWalletEvents(handleAccountsChanged, handleChainChanged);
  }, [address]);

  return (
    <div className="container">
      <div className="card">
        <div className="title">ERC-20 Faucet</div>
        <div className="subtitle">Claim tokens with a 24-hour cooldown and lifetime cap.</div>
        <div className="row">
          {address ? (
            <span className="badge status-ok">Connected</span>
          ) : (
            <span className="badge status-warn">Disconnected</span>
          )}
          {address && <span className="badge">{address}</span>}
          {!address && (
            <button onClick={handleConnect}>Connect Wallet</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <div>
            <div className="label">Token Balance</div>
            <div className="value">{formattedBalance} {symbol}</div>
          </div>
          <div>
            <div className="label">Cooldown</div>
            <div className="value">{cooldownLabel}</div>
          </div>
          <div>
            <div className="label">Remaining Allowance</div>
            <div className="value">{formattedRemaining} {symbol}</div>
          </div>
          <div>
            <div className="label">Claim Status</div>
            <div className="value">
              {canClaimNow ? "Eligible" : "Not Eligible"}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <button
            onClick={handleRequest}
            disabled={!address || loading || !canClaimNow || cooldownRemaining > 0}
          >
            {loading ? "Claiming..." : "Request Tokens"}
          </button>
          {!address && <span className="badge">Connect wallet to claim</span>}
        </div>
      </div>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
