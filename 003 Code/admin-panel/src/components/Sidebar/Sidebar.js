import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    {
      path: '/dashboard',
      label: '대시보드',
      icon: '📊'
    },
    {
      path: '/recipients',
      label: '수신자 관리',
      icon: '👥'
    },
    {
      path: '/messages',
      label: '메시지 관리',
      icon: '💬'
    },
    {
      path: '/custom-reminders',
      label: '맞춤 알림',
      icon: '⏰'
    },
    {
      path : "/api-dashboard",
      label : "API 관리",
      icon : "🛰"
    }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;