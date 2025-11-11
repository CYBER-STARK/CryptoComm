import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import messageABI from "../utils/messageABI.json";
import userABI from "../utils/userABI.json";
import "./ChatPage.css";

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isConnected, connectWallet } = useContext(Web3Context);
  const chatEndRef = useRef(null);

  // ✅ Replace with your deployed contract addresses
  const messageContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const userContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch real friends from blockchain
  const fetchFriends = async () => {
    if (!isConnected || !account) return;
    try {
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const userContract = new ethers.Contract(userContractAddress, userABI, signer);

      const [name, addr, friendList] = await userContract.getUser(account);

      const formattedFriends = friendList.map((f, i) => ({
        id: i + 1,
        name: `Friend ${i + 1}`,
        address: f,
      }));
      setFriends(formattedFriends);

      // Default to first friend or location.state.friend
      if (location.state?.friend) {
        const existing = formattedFriends.find(
          (f) => f.address.toLowerCase() === location.state.friend.toLowerCase()
        );
        setSelectedFriend(
          existing || { name: "Friend", address: location.state.friend }
        );
      } else if (formattedFriends.length > 0) {
        setSelectedFriend(formattedFriends[0]);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  // 🔹 Fetch messages from blockchain
  const fetchMessages = async () => {
    if (!isConnected || !selectedFriend?.address) return;
    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const messageContract = new ethers.Contract(messageContractAddress, messageABI, signer);

      const onchainMessages = await messageContract.readMessages(selectedFriend.address);

      const formatted = onchainMessages.map((m, i) => ({
        id: i + 1,
        sender: m.sender.toLowerCase() === account.toLowerCase() ? "me" : "friend",
        text: m.message,
        time: new Date(Number(m.timestamp) * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessages(formatted);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Send message on blockchain
  const sendMessage = async () => {
    if (!isConnected) return alert("Connect your wallet first!");
    if (newMessage.trim() === "") return alert("Message cannot be empty!");
    if (!selectedFriend?.address) return alert("Select a friend first!");
    try {
      setLoading(true);
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const messageContract = new ethers.Contract(messageContractAddress, messageABI, signer);

      const tx = await messageContract.sendMessage(selectedFriend.address, newMessage);
      await tx.wait();

      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      console.error("Send message failed:", error);
      alert("Transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Auto load messages & friends
  useEffect(() => {
    if (isConnected) fetchFriends();
  }, [isConnected, account]);

  useEffect(() => {
    if (selectedFriend) fetchMessages();
  }, [selectedFriend]);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <h2>💬 Chats</h2>
        {!isConnected ? (
          <button onClick={connectWallet} className="connect-btn">
            🔗 Connect MetaMask
          </button>
        ) : friends.length === 0 ? (
          <p>No friends yet. Add some first!</p>
        ) : (
          <ul className="friend-list">
            {friends.map((f) => (
              <li
                key={f.id}
                className={`friend-item ${
                  selectedFriend?.address === f.address ? "active" : ""
                }`}
                onClick={() => setSelectedFriend(f)}
              >
                <p className="friend-name">{f.name}</p>
                <p className="friend-address">
                  {f.address.slice(0, 6)}...{f.address.slice(-4)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button onClick={() => navigate("/friends")} className="back-btn">
          👥 Back to Friends
        </button>
      </aside>

      {/* Main Chat */}
      <main className="chat-main">
        {selectedFriend ? (
          <>
            <header className="chat-header">
              <div>
                <h3>{selectedFriend.name}</h3>
                <p className="chat-address">{selectedFriend.address}</p>
              </div>
              <button onClick={() => navigate("/dashboard")} className="exit-btn">
                ⬅ Dashboard
              </button>
            </header>

            <div className="chat-messages">
              {loading ? (
                <p>⏳ Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`message ${m.sender === "me" ? "sent" : "received"}`}
                  >
                    <p className="message-text">{m.text}</p>
                    <span className="message-time">{m.time}</span>
                  </div>
                ))
              ) : (
                <p>No messages yet. Start chatting!</p>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} disabled={loading}>
                📩 Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat">
            <p>Select a friend to start chatting 💬</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
