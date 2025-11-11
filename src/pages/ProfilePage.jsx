import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import userABI from "../utils/userABI.json";
import "./ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { account, signer, isConnected, connectWallet } = useContext(Web3Context);
  const [username, setUsername] = useState("");
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🪙 Replace with your deployed UserRegistration contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // 🔹 Fetch user info from blockchain
  const fetchUserInfo = async () => {
    if (!isConnected || !account) return;
    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, userABI, signer);

      const [name, userAddress, friends] = await contract.getUser(account);

      setUsername(name || "Unnamed");
      setFriendCount(friends.length);
    } catch (error) {
      console.error("Error fetching profile info:", error);
      alert("Unable to fetch user data. Please ensure you’re registered.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Load data automatically
  useEffect(() => {
    if (isConnected) {
      fetchUserInfo();
    }
  }, [isConnected, account]);

  return (
    <div className="profile-container">
      {/* Navbar */}
      <header className="profile-header">
        <h1>👤 Your Profile</h1>
        <nav>
          <button onClick={() => navigate("/dashboard")}>🏠 Dashboard</button>
          <button onClick={() => navigate("/friends")}>👥 Friends</button>
          <button onClick={() => navigate("/chat")}>💬 Chat</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-card">
          {loading ? (
            <p>⏳ Loading profile from blockchain...</p>
          ) : (
            <>
              <h2>
                Welcome, <span className="highlight">{username}</span> 👋
              </h2>
              <p className="tagline">
                Your Decentralized Identity on the Blockchain
              </p>

              <div className="wallet-section">
                <h3>🪙 Wallet Address</h3>
                <p className="wallet-address">
                  {account
                    ? `${account.slice(0, 8)}...${account.slice(-6)}`
                    : "Not connected"}
                </p>
              </div>

              <div className="info-section">
                <div className="info-box">
                  <h4>Friends</h4>
                  <p>{friendCount}</p>
                </div>
                <div className="info-box">
                  <h4>Messages Sent</h4>
                  <p>—</p>
                </div>
                <div className="info-box">
                  <h4>Account Type</h4>
                  <p>Standard User</p>
                </div>
              </div>

              {!isConnected ? (
                <button className="logout-btn" onClick={connectWallet}>
                  🔗 Connect Wallet
                </button>
              ) : (
                <button className="logout-btn" onClick={() => navigate("/")}>
                  🔐 Disconnect Wallet
                </button>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="profile-footer">
        <p>🧩 Built for Web3 • CryptoComm</p>
      </footer>
    </div>
  );
};

export default ProfilePage;
