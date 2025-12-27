import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h2>Account Information</h2>
          <div className="info-row">
            <label>Email:</label>
            <p>{user?.email}</p>
          </div>
          <div className="info-row">
            <label>Role:</label>
            <p>{user?.role}</p>
          </div>
          <div className="info-row">
            <label>Fleet:</label>
            <p>{user?.fleet_name || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

