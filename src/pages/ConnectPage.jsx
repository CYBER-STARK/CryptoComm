import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context.jsx";
import "./ConnectPage.css";

const ConnectPage = () => {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet } = useContext(Web3Context);

  // Automatically navigate if already connected
  /*useEffect(() => {
    if (isConnected && account) {
      navigate("/register");
    }
  }, [isConnected, account, navigate]);
*/
  return (
    <div className="connect-container">
      {/* 🔹 MetaMask Status Bar */}
      <div className="metamask-status">
        {window.ethereum ? (
          isConnected ? (
            <p className="status connected">
              🟢 MetaMask Connected:{" "}
              <span className="address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </p>
          ) : (
            <p className="status locked">🟡 MetaMask Detected — Locked</p>
          )
        ) : (
          <p className="status not-installed">
            🔴 MetaMask Not Installed (Install from metamask.io)
          </p>
        )}
      </div>

      {/* 🔹 Main Card */}
      <div className="connect-card">
        <h1 className="app-title">💬 CryptoComm</h1>
        <p className="subtitle">
          A <span>Decentralized Chat System</span> using Blockchain
        </p>

        <div className="wallet-section">
          {!isConnected ? (
            <>
              <button className="connect-btn" onClick={connectWallet}>
                🦊 Connect MetaMask Wallet
              </button>
              <p className="note">Ensure MetaMask is unlocked and active.</p>
            </>
          ) : (
            <div className="wallet-info">
              <p className="connected">✅ Wallet Connected!</p>
              <p className="wallet-address">
                Address: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <button
                className="proceed-btn"
                onClick={() => navigate("/register")}
              >
                Proceed to Dashboard →
              </button>
            </div>
          )}
        </div>

        <footer className="footer">
          <p>Built with ❤️ • CryptoComm © 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default ConnectPage;
