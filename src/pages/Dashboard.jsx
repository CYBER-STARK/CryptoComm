import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");

  // 🦊 Fetch wallet address if MetaMask is connected
  useEffect(() => {
    async function fetchWallet() {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) setAccount(accounts[0]);
      }
    }
    fetchWallet();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <header className="dashboard-header">
        <h1>⚡ CryptoComm Dashboard</h1>
        <nav>
          <button onClick={() => navigate("/chat")}>💬 Chat</button>
          <button onClick={() => navigate("/friends")}>👥 Friends</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
        </nav>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome Back 👋</h2>
          <p>Your decentralized communication hub is ready!</p>
          {account ? (
            <p className="wallet-info">
              <strong>Connected Wallet:</strong> {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          ) : (
            <p className="wallet-info">🔴 Wallet not connected</p>
          )}
        </div>

        {/* Quick Access Buttons */}
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigate("/chat")}>
            <h3>💬 Chat</h3>
            <p>Send & receive encrypted blockchain messages</p>
          </div>

          <div className="action-card" onClick={() => navigate("/friends")}>
            <h3>👥 Friends</h3>
            <p>View and add new decentralized friends</p>
          </div>

          <div className="action-card" onClick={() => navigate("/profile")}>
            <h3>👤 Profile</h3>
            <p>View your identity & wallet details</p>
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>🚀 Built with ❤️ using Ethereum & React</p>
      </footer>
    </div>
  );
};

export default Dashboard;
