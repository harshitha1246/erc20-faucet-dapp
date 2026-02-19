export async function switchToLocalhost() {
  if (!window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a69" }] // 31337 in hex
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

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Wallet not detected. Please install MetaMask.");
  }
  await switchToLocalhost();
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });
  if (!accounts || accounts.length === 0) {
    throw new Error("No wallet accounts available");
  }
  return accounts[0];
}

export function onWalletEvents(onAccountsChanged, onChainChanged) {
  if (!window.ethereum) return;
  window.ethereum.on("accountsChanged", onAccountsChanged);
  window.ethereum.on("chainChanged", onChainChanged);
}

export function removeWalletEvents(onAccountsChanged, onChainChanged) {
  if (!window.ethereum) return;
  window.ethereum.removeListener("accountsChanged", onAccountsChanged);
  window.ethereum.removeListener("chainChanged", onChainChanged);
}
