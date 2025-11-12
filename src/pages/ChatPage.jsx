
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import lighthouse from "@lighthouse-web3/sdk";
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
  const userContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const messageContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // 🔹 Fetch user's friends from blockchain
  const fetchFriends = async () => {
    if (!isConnected || !account) return;
    try {
      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const userContract = new ethers.Contract(userContractAddress, userABI, signer);

      const [_, __, friendList] = await userContract.getUser(account);

      const formattedFriends = await Promise.all(
        friendList.map(async (f, i) => {
          try {
            const [friendName] = await userContract.getUser(f);
            return {
              id: i + 1,
              name: friendName || `Friend ${i + 1}`,
              address: f,
            };
          } catch {
            return { id: i + 1, name: `Friend ${i + 1}`, address: f };
          }
        })
      );

      setFriends(formattedFriends);
      setFilteredFriends(formattedFriends);

      if (location.state?.friend) {
        const existing = formattedFriends.find(
          (f) => f.address.toLowerCase() === location.state.friend.toLowerCase()
        );
        setSelectedFriend(
          existing || { name: "Unknown", address: location.state.friend }
        );
      } else if (formattedFriends.length > 0) {
        setSelectedFriend(formattedFriends[0]);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  // 🔹 Filter friends with search
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredFriends(friends);
    } else {
      const lower = search.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (f) =>
            f.name.toLowerCase().includes(lower) ||
            f.address.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, friends]);

  // 🔹 Fetch messages between user and selected friend
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
        type: m.msgType || "text",
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

  // 🔹 Send a text message
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

      const tx = await messageContract.sendMessage(selectedFriend.address, newMessage, "text");
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

  // 🔹 Upload file via Lighthouse and send IPFS link
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedFriend?.address) return alert("Select a friend first!");

    try {
      setLoading(true);
      const output = await lighthouse.upload(
        [file], // must be an array
        import.meta.env.VITE_LIGHTHOUSE_API_KEY
      );
      const fileLink = `https://gateway.lighthouse.storage/ipfs/${output.data.Hash}`;

      const network = { chainId: 31337, name: "hardhat" };
      const provider = new ethers.BrowserProvider(window.ethereum, network);
      const signer = await provider.getSigner();
      const messageContract = new ethers.Contract(messageContractAddress, messageABI, signer);

      const tx = await messageContract.sendMessage(selectedFriend.address, fileLink, "file");
      await tx.wait();

      alert("📁 File sent successfully!");
      await fetchMessages();
    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload or transaction failed!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Initial fetch
  useEffect(() => {
    if (isConnected) fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, account]);

  useEffect(() => {
    if (selectedFriend) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriend]);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2>💬 Chats</h2>
          <button onClick={() => navigate("/friends")}>👥 Friends</button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!isConnected ? (
          <button onClick={connectWallet} className="connect-btn">
            🔗 Connect MetaMask
          </button>
        ) : filteredFriends.length === 0 ? (
          <p>No friends yet.</p>
        ) : (
          <ul className="friend-list">
            {filteredFriends.map((f) => (
              <li
                key={f.id}
                className={`friend-item ${selectedFriend?.address === f.address ? "active" : ""}`}
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
      </aside>

      {/* Main Chat Window */}
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
                  <div key={m.id} className={`message ${m.sender === "me" ? "sent" : "received"}`}>
                    {m.type === "file" ? (
                      <a
                        href={m.text}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-message"
                      >
                        📎 View File
                      </a>
                    ) : (
                      <p className="message-text">{m.text}</p>
                    )}
                    <span className="message-time">{m.time}</span>
                  </div>
                ))
              ) : (
                <p>No messages yet. Start chatting!</p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input (frontend-only changes: class names + removed inline style on file input) */}
            <div className="chat-input">
              {/* file-label class is styled in the updated CSS; clicking it opens the hidden file input */}
              <label htmlFor="file-upload" className="file-label" title="Attach file">📎</label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                accept="image/*, .pdf, .doc, .docx, .txt"
                /* Hidden via CSS (#file-upload { display: none; }) so inline style removed. */
              />
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              {/* send button now has .send-btn to match the new CSS (orange gradient) */}
              <button className="send-btn" onClick={sendMessage} disabled={loading}>
                📩
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

