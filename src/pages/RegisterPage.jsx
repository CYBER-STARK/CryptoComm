import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context.jsx";
import TopNavBar from "./TopNavBar.jsx"
import userABI from "../utils/userABI.json";
import "./pageTheme.css";

const RegisterPage = () => {
  const { account, isConnected, connectWallet } = useContext(Web3Context);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const navigate = useNavigate();

  // 🔹 Replace with your deployed contract address
  const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  // ✅ Connect to contract
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, userABI, signer);
  };

  // 🔍 Check if user already exists
  const checkUserStatus = async () => {
    if (!isConnected || !account) return;
    try {
      const contract = await getContract();
      const exists = await contract.userExists(account);
      if (exists) {
        setAlreadyRegistered(true);
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, [isConnected, account]);

  // 🧩 Register user
  const registerUser = async () => {
    if (!isConnected) return alert("Please connect your wallet first!");
    if (username.trim() === "") return alert("Enter a username!");

    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.createAccount(username);
      await tx.wait();

      alert("🎉 Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.message.includes("User already exists")) {
        alert("This account already exists!");
      } else if (error.message.includes("Username already taken")) {
        alert("This username is already taken!");
      } else {
        alert("Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-section">
      <TopNavBar></TopNavBar>
      <header className="page-header">
        <h1>Create Your CryptoComm Identity</h1>
        <p>
          Register a unique username and start building your on-chain profile.
          Your identity is permanently stored on the blockchain.
        </p>
      </header>

      {!isConnected ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <button className="primary-btn" onClick={connectWallet}>
            🔗 Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="content-grid">
          <form
            className="glass-card focus form-card"
            onSubmit={(e) => {
              e.preventDefault();
              registerUser();
            }}
          >
            <div className="card-heading">
              <h2>Register Profile</h2>
              <p>Choose your public username for CryptoComm.</p>
            </div>

            <label className="form-field">
              <span>Username (on-chain)</span>
              <input
                required
                maxLength={32}
                name="username"
                placeholder="e.g. satoshi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <div className="form-field">
              <span>Wallet Address</span>
              <p className="mono-text">{account}</p>
            </div>

            {alreadyRegistered ? (
              <p className="callout success">
                ✅ You’re already registered. Redirecting to Dashboard...
              </p>
            ) : (
              <button
                type="submit"
                className="primary-btn"
                disabled={loading || !isConnected}
              >
                {loading ? "⏳ Registering..." : "📝 Create Account"}
              </button>
            )}

            <p className="note">
              Once registered, your username will be permanently linked to your
              wallet on Ethereum.
            </p>
          </form>

          <div className="glass-card secondary">
            <div className="card-heading">
              <h2>Why Register?</h2>
            </div>
            <ul className="feature-list">
              <li>End-to-end encrypted chat tied to your wallet</li>
              <li>Secure decentralized storage via IPFS</li>
              <li>Unique username anchored on blockchain</li>
              <li>Verified reputation through smart contracts</li>
            </ul>

            <div className="metric-grid">
              <div className="metric-card">
                <strong>10k+</strong>
                <span>Active Users</span>
                <p className="list-subtitle">
                  Verified on-chain user identities
                </p>
              </div>
              <div className="metric-card">
                <strong>1.2h</strong>
                <span>Avg. Approval Time</span>
                <p className="list-subtitle">
                  From registration to dashboard access
                </p>
              </div>
              <div className="metric-card">
                <strong>99%</strong>
                <span>Success Rate</span>
                <p className="list-subtitle">
                  Verified transactions via MetaMask
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RegisterPage;
