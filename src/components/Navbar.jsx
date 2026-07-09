import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, MessageSquare, LogIn, LogOut, User, ChevronDown, Menu, X } from 'lucide-react';

function Navbar({ user, onLogout, onOpenAuth }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--island' : ''}`}>
      <div className="navbar-inner">
        <div className="logo-wrapper">
          <div className="logo-icon">🌾</div>
          <span className="logo-text">PanganDali</span>
        </div>

        <div className="nav-actions">
          <div className="search-bar">
            <Search size={15} />
            <input type="text" placeholder="Cari..." />
          </div>

          <button className="icon-btn" title="Notifikasi">
            <Bell size={18} />
          </button>
          
          <button className="icon-btn" title="Pesan">
            <MessageSquare size={18} />
          </button>

          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button 
                className="user-avatar-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar-circle">
                  {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <ChevronDown size={14} className="text-muted" />
              </button>
              
              <div className={`user-dropdown ${dropdownOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="dropdown-name">{user.name}</div>
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-role">{user.role}</div>
                </div>
                
                <button className="dropdown-item">
                  <User size={16} /> Profile Saya
                </button>
                
                <button 
                  className="dropdown-item logout" 
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-cta-nav" onClick={onOpenAuth}>
              <span>Masuk</span>
              <LogIn size={15} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
