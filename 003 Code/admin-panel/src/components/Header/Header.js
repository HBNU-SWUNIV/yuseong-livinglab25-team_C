import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">유성안심문자 관리자</h1>
        </div>
        
        <div className="header-right">
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-name">관리자</span>
              <span className="user-menu-arrow">▼</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <button 
                  className="user-menu-item"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;