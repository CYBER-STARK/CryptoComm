import React, { useState, useEffect, useMemo, useContext } from "react";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Context.jsx";
import userABI from "../utils/userABI.json";
import TopNavBar from "./TopNavBar.jsx";
import "./pageTheme.css";

const FriendsPage = () => {
  const { account, isConnected, connectWallet } = useContext(Web3Context);

  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Replace with your actual deployed address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // ✅ Connect to contract
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, userABI, signer);
  };

  // 🔹 Fetch friend list
  const fetchFriends = async () => {
    if (!isConnected || !account) return;
    try {
      setLoading(true);
      const contract = await getContract();
      const [name, userAddress, friendList] = await contract.getUser(account);

      const friendData = await Promise.all(
        friendList.map(async (f, i) => {
          try {
            const [friendName] = await contract.getUser(f);
            return { id: i + 1, username: friendName, address: f };
          } catch {
            return { id: i + 1, username: "Unknown", address: f };
          }
        })
      );

      setFriends(friendData);
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search by username or address
  const handleSearch = async () => {
    if (!isConnected) return alert("Please connect wallet first!");
    if (query.trim() === "") return alert("Enter a username or address!");

    try {
      setLoading(true);
      const contract = await getContract();

      let friendAddress;
      if (ethers.isAddress(query)) {
        friendAddress = ethers.getAddress(query);
      } else {
        friendAddress = await contract.usernameToAddress(query);
        if (friendAddress === ethers.ZeroAddress) {
          alert("❌ No user found with that username.");
          setSearchResult(null);
          return;
        }
      }

      const [friendName] = await contract.getUser(friendAddress);
      setSearchResult({ username: friendName, address: friendAddress });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Add friend on-chain
  const handleAddFriend = async () => {
    if (!isConnected) return alert("Connect wallet first!");
    if (!searchResult) return alert("Search for a user first!");

    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.addFriend(searchResult.address);
      await tx.wait();

      alert(`🎉 You and ${searchResult.username} are now friends!`);
      setQuery("");
      setSearchResult(null);
      fetchFriends();
    } catch (error) {
      console.error("Add friend failed:", error);
      if (error.message.includes("Already friends")) {
        alert("You’re already friends!");
      } else {
        alert("Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchFriends();
  }, [isConnected, account]);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return friends;
    return friends.filter((f) =>
      f.username.toLowerCase().includes(query.toLowerCase().trim())
    );
  }, [query, friends]);

  return (
    <section className="page-section">
      <TopNavBar title="Friends"/>
      <header className="page-header">
        <h1>Find and Add Friends</h1>
        <p>
          Search for friends by username or wallet address. Add them to your
          on-chain friend list and start chatting securely.
        </p>
      </header>

      {!isConnected ? (
        <button className="primary-btn" onClick={connectWallet}>
          🔗 Connect MetaMask
        </button>
      ) : (
        <div className="content-grid dual">
          <div className="glass-card focus">
            <div className="card-heading">
              <h2>Your Friends</h2>
              <p>All your added friends appear here with their wallet addresses.</p>
            </div>

            {loading ? (
              <p>⏳ Loading...</p>
            ) : friends.length > 0 ? (
              <ul className="user-list">
                {filteredUsers.map((f) => (
                  <li key={f.address}>
                    <div>
                      <strong>@{f.username}</strong>
                      <span>{f.address}</span>
                    </div>
                    <span className="pill subtle">Friend</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No friends yet. Add one below!</p>
            )}
          </div>

          <div className="glass-card secondary">
            <div className="card-heading">
              <h2>Search & Add Friends</h2>
              <p>Enter a username or wallet address below.</p>
            </div>

            <div className="form-field">
              <input
                placeholder="Search friends…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="primary-btn" onClick={handleSearch} disabled={loading}>
                🔍 Search
              </button>
            </div>

            {searchResult && (
              <div className="search-result">
                <p>
                  Found: <strong>@{searchResult.username}</strong>
                </p>
                <span>{searchResult.address}</span>
                <button onClick={handleAddFriend} disabled={loading}>
                  {loading ? "⏳ Adding..." : "➕ Add Friend"}
                </button>
              </div>
            )}

            <div className="pending-section">
              <h3>Pending Requests</h3>
              {pending.length ? (
                <ul className="pending-list">
                  {pending.map((p) => (
                    <li key={p.address}>
                      @{p.username} — waiting for confirmation
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No pending requests.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FriendsPage;
