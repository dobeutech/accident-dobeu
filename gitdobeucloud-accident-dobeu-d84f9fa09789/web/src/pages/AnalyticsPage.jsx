import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getAll({ limit: 1000 })
  });

  const reports = data?.data?.reports || [];

  // Calculate statistics
  const stats = {
    total: reports.length,
    byType: reports.reduce((acc, r) => {
      acc[r.incident_type] = (acc[r.incident_type] || 0) + 1;
      return acc;
    }, {}),
    byStatus: reports.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {})
  };

  const chartData = [
    { name: 'Accident', value: stats.byType.accident || 0 },
    { name: 'Incident', value: stats.byType.incident || 0 },
    { name: 'Near Miss', value: stats.byType.near_miss || 0 }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>By Status</h3>
          <ul>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status}>
                {status}: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="chart-container">
        <h2>Reports by Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#007AFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

