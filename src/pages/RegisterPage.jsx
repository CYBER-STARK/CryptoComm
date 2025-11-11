import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import userABI from "../utils/userABI.json";
import "./RegisterPage.css";

const RegisterPage = () => {
  const { account, signer, isConnected, connectWallet } = useContext(Web3Context);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const navigate = useNavigate();

  // ✅ Replace with your deployed UserRegistration contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // 🔹 Check if user already registered
  useEffect(() => {
  const checkUserStatus = async () => {
    if (!isConnected || !account) return;
    try {
      // ✅ Create provider with Hardhat network manually to avoid ENS errors
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, userABI, signer);

      const exists = await contract.userExists(account);
      if (exists) {
        setAlreadyRegistered(true);
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (err) {
      if (err.code === "UNSUPPORTED_OPERATION") {
        console.warn("Skipping ENS lookup (Hardhat network)");
      } else {
        console.error("Error checking user:", err);
      }
    }
  };
  checkUserStatus();
}, [isConnected, account, navigate]);


  // ✅ Register user in smart contract
  const registerUser = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (username.trim() === "") {
      alert("Please enter a username!");
      return;
    }

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
      console.error(error);
      if (error.message.includes("User already exists")) {
        alert("This account already exists!");
      } else if (error.message.includes("Username already taken")) {
        alert("This username is already taken!");
      } else {
        alert("Registration failed. Check console for details.");
      }
      if (loading) {
  return (
    <div className="register-container">
      <div className="register-card">
        <h2>⏳ Processing Transaction...</h2>
        <p>Please confirm the transaction in MetaMask.</p>
      </div>
    </div>
  );
}

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">🪄 Register on CryptoComm</h1>
        <p className="register-subtitle">
          Create your decentralized identity on the blockchain.
        </p>

        {/* 🔹 Wallet Info Section */}
        {!isConnected ? (
          <button className="connect-btn" onClick={connectWallet}>
            🔗 Connect MetaMask
          </button>
        ) : (
          <p className="wallet-address">
            ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}

        {/* 🔹 If already registered, show message */}
        {alreadyRegistered ? (
          <div className="registered-msg">
            <p>🎉 You’re already registered on CryptoComm!</p>
            <p>Redirecting to Dashboard...</p>
          </div>
        ) : (
          <>
            {/* 🔹 Username Input */}
            <div className="input-group">
              <label htmlFor="username">Choose Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* 🔹 Register Button */}
            <button
              className="register-btn"
              onClick={registerUser}
              disabled={loading || !isConnected}
            >
              {loading ? "⏳ Registering..." : "📝 Create Account"}
            </button>

            <p className="note">
              Once registered, your username is stored permanently on Ethereum.
            </p>
          </>
        )}

        <footer className="footer">
          <p>Powered by Ethereum • Built with ❤️</p>
        </footer>
      </div>
    </div>
  );
};

export default RegisterPage;
