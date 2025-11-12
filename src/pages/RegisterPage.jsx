import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import TopNavBar from "./TopNavBar.jsx";
import userABI from "../utils/userABI.json";
import "./pageTheme.css";

const RegisterPage = () => {
  const { account, isConnected, connectWallet } = useContext(Web3Context);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const navigate = useNavigate();

  // ✅ Replace with your deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // 🔍 Check if user already exists
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isConnected || !account) return;
      try {
        const network = { chainId: 31337, name: "hardhat" };
        const provider = new ethers.BrowserProvider(window.ethereum, network);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, userABI, signer);

        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
          console.error("❌ Contract not found. Redeploy or update address.");
          return;
        }

        const exists = await contract.userExists(account);
        if (exists) {
          setAlreadyRegistered(true);
          //setTimeout(() => navigate("/dashboard"), 1500);
        }
      } catch (err) {
        console.error("Error checking user:", err);
      }
    };
    checkUserStatus();
  }, [isConnected, account, navigate]);

  // 🧩 Register user
  const registerUser = async () => {
    if (!isConnected) return alert("Please connect your wallet first!");
    if (username.trim() === "") return alert("Please enter a username!");

    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, userABI, signer);

      const tx = await contract.createAccount(username);
      await tx.wait();

      alert("🎉 Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      if (error.message.includes("User already exists"))
        alert("This account already exists!");
      else if (error.message.includes("Username already taken"))
        alert("This username is already taken!");
      else alert("Registration failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-section">
      <TopNavBar/>
      <header className="page-header">
        <h1>Create Your CryptoComm Account</h1>
        <p>
          Register your decentralized identity to join the CryptoComm network.
          Your profile and data are securely stored on the blockchain.
        </p>
      </header>

      <div className="content-grid dual">
        {/* Registration Form Card */}
        <div className="glass-card focus form-card">
          <div className="card-heading">
            <h2>🪄 Register on CryptoComm</h2>
            <p>Choose a unique username to create your account.</p>
          </div>

          {!isConnected ? (
            <button className="primary-btn" onClick={connectWallet}>
              🔗 Connect MetaMask
            </button>
          ) : (
            <div className="wallet-chip">
              ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}

          {alreadyRegistered ? (
            <p className="callout success">
              🎉 You’re already registered! Redirecting to Dashboard...
            </p>
          ) : (
            <>
              <div className="form-field">
                <span>Username</span>
                <input
                  type="text"
                  placeholder="Enter your unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <button
                className="primary-btn"
                onClick={registerUser}
                disabled={loading || !isConnected}
              >
                {loading ? "⏳ Registering..." : "📝 Create Account"}
              </button>

              <p className="note list-subtitle">
                Once registered, your username is stored permanently on-chain.
              </p>
            </>
          )}
        </div>

        {/* Info / Tips Card */}
        <div className="glass-card secondary">
          <div className="card-heading">
            <h2>Why Register?</h2>
            <p>
              Registering links your wallet to a unique username and unlocks
              personalized blockchain-based features.
            </p>
          </div>

          <ul className="feature-list">
            <li>✔️ Secure, blockchain-verified identity</li>
            <li>💬 Access decentralized chat and friends network</li>
            <li>🔐 No passwords or centralized storage</li>
            <li>🌐 Instant access to the CryptoComm ecosystem</li>
          </ul>

          <div className="metric-grid">
            <div className="metric-card">
              <strong>10k+</strong>
              <span>Registered Users</span>
            </div>
            <div className="metric-card">
              <strong>3s</strong>
              <span>Average Transaction Time</span>
            </div>
            <div className="metric-card">
              <strong>100%</strong>
              <span>Data Ownership</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="page-footer">
        <p>Powered by Ethereum • Built with ❤️ by CryptoComm</p>
      </footer>
    </section>
  );
};

export default RegisterPage;
