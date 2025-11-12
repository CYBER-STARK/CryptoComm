
import React from 'react';
import './pageTheme.css';
import { Search, Bell, Calendar } from 'lucide-react';


export default function TopNavBar({ currentUser, onSearch }) {
return (
<header className="top-nav glass-card">
<div className="top-nav-inner">
<div className="brand">
<div className="avatar-circle small">CC</div>
<h1 className="brand-title">CryptoComm</h1>
</div>


<div className="search-wrap">
<label className="search-label">
<Search className="search-icon" size={18} />
<input
type="text"
placeholder="Search..."
onChange={(e) => onSearch && onSearch(e.target.value)}
className="search-input"
/>
</label>
</div>


<div className="actions">
<button className="icon-btn" title="Notifications">
<Bell size={20} />
</button>


<button className="icon-btn" title="Calendar">
<Calendar size={20} />
</button>


<button className="profile-btn" aria-label={currentUser?.name} title={currentUser?.name}>
<img
src={currentUser?.profileImage}
alt={currentUser?.name}
className="profile-img"
/>
</button>
</div>
</div>
</header>
);
}
