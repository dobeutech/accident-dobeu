import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initSocket, disconnectSocket } from '../services/socketService';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (token) {
      initSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/reports', label: 'Reports', icon: '📄' },
    { path: '/form-config', label: 'Form Builder', icon: '⚙️' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="dashboard-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Accident Reporter</h2>
          <p className="fleet-name">{user?.fleet_name || 'Fleet'}</p>
        </div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname.startsWith(item.path) ? 'active' : ''}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div className="user-info">
            <p>{user?.email}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

