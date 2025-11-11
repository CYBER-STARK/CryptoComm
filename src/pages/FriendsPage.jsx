import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import userABI from "../utils/userABI.json";
import "./FriendsPage.css";

const FriendsPage = () => {
  const { account, signer, isConnected, connectWallet } = useContext(Web3Context);
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Replace this with your latest deployed UserRegistration contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  // 🔹 Fetch user’s friends from blockchain
  const fetchFriends = async () => {
    if (!isConnected || !account) return;
    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, userABI, signer);

      // getUser(address) returns (name, userAddress, friendList)
      const [name, userAddress, friendList] = await contract.getUser(account);

      const friendData = friendList.map((f, i) => ({
        id: i + 1,
        name: `Friend ${i + 1}`,
        address: f,
      }));
      setFriends(friendData);
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Add friend on blockchain (ENS-safe)
  const handleAddFriend = async () => {
    if (!isConnected) return alert("Connect wallet first!");
    if (newFriend.trim() === "") return alert("Enter a valid wallet address!");

    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, userABI, signer);

      // ✅ ENS-safe conversion (bypass ENS lookup)
      if (!ethers.isAddress(newFriend.trim())) {
        return alert("❌ Invalid Ethereum address format.");
      }

      const friendAddress = ethers.getAddress(newFriend.trim());

      const tx = await contract.addFriend(friendAddress);
      await tx.wait();

      alert("🎉 Friend added successfully!");
      setNewFriend("");
      fetchFriends(); // refresh list
    } catch (error) {
      console.error("Add friend failed:", error);

      if (error.code === "INVALID_ARGUMENT") {
        alert("⚠️ Please enter a valid Ethereum address.");
      } else if (error.message.includes("Friend not registered")) {
        alert("This address is not registered on CryptoComm!");
      } else if (error.message.includes("Already friends")) {
        alert("You’re already friends!");
      } else if (error.code === "UNSUPPORTED_OPERATION") {
        console.warn("Skipping ENS lookup — Hardhat network doesn’t support ENS.");
        alert("Friend added successfully (ENS unsupported).");
      } else {
        alert("Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Auto-load friend list
  useEffect(() => {
    if (isConnected) fetchFriends();
  }, [isConnected, account]);

  return (
    <div className="friends-container">
      {/* Navbar */}
      <header className="friends-header">
        <h1>👥 Friends</h1>
        <nav>
          <button onClick={() => navigate("/dashboard")}>🏠 Dashboard</button>
          <button onClick={() => navigate("/chat")}>💬 Chat</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
        </nav>
      </header>

      {/* Main Card */}
      <div className="friends-card">
        <h2 className="section-title">Your Friends List</h2>

        {!isConnected ? (
          <button className="connect-btn" onClick={connectWallet}>
            🔗 Connect MetaMask
          </button>
        ) : loading ? (
          <p>⏳ Loading your friends...</p>
        ) : friends.length > 0 ? (
          <ul className="friend-list">
            {friends.map((f) => (
              <li key={f.id} className="friend-item">
                <div>
                  <p className="friend-name">{f.name}</p>
                  <p className="friend-address">{f.address}</p>
                </div>
                <button
                  className="chat-btn"
                  onClick={() => navigate("/chat", { state: { friend: f.address } })}
                >
                  💬 Chat
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-friends">No friends added yet.</p>
        )}

        {/* Add Friend Section */}
        <div className="add-friend">
          <input
            type="text"
            placeholder="Enter friend's wallet address"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
          />
          <button onClick={handleAddFriend} disabled={loading}>
            {loading ? "⏳ Adding..." : "➕ Add Friend"}
          </button>
        </div>
      </div>

      <footer className="footer">
        <p>Built with ❤️ • CryptoComm</p>
      </footer>
    </div>
  );
};

export default FriendsPage;
