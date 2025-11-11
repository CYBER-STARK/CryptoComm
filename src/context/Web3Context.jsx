import React, { createContext, useEffect, useState } from "react";
import { ethers } from "ethers";

// ✅ Create the context
export const Web3Context = createContext();

// ✅ Create the provider component
export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🔹 Initialize MetaMask connection
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum); // ethers v6
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setIsConnected(true);
      console.log("✅ Connected account:", accounts[0]);
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // 🔹 Check if MetaMask already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0].address || accounts[0]);
          setIsConnected(true);
        }
      }
    };
    checkConnection();

    // 🔹 Listen for account/network changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        isConnected,
        connectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
