import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportService, exportService } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    status: '',
    incident_type: '',
    page: 1
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportService.getAll(filters)
  });

  const exportMutation = useMutation({
    mutationFn: ({ format, reportIds }) => exportService.exportReports(format, reportIds),
    onSuccess: (data, variables) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-${Date.now()}.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export completed');
    },
    onError: () => toast.error('Export failed')
  });

  const handleExport = (format) => {
    const selectedReports = data?.data?.reports?.map(r => r.id) || [];
    exportMutation.mutate({ format, reportIds: selectedReports });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#FFA500',
      submitted: '#007AFF',
      under_review: '#5856D6',
      closed: '#34C759'
    };
    return colors[status] || '#999';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Accident Reports</h1>
        <div className="header-actions">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.incident_type}
            onChange={(e) => setFilters({ ...filters, incident_type: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="accident">Accident</option>
            <option value="incident">Incident</option>
            <option value="near_miss">Near Miss</option>
          </select>
          <div className="export-dropdown">
            <button className="btn-secondary">Export</button>
            <div className="export-menu">
              <button onClick={() => handleExport('pdf')}>PDF</button>
              <button onClick={() => handleExport('xlsx')}>Excel</button>
              <button onClick={() => handleExport('csv')}>CSV</button>
              <button onClick={() => handleExport('xml')}>XML</button>
              <button onClick={() => handleExport('json')}>JSON</button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Report Number</th>
                <th>Driver</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.reports?.map((report) => (
                <tr key={report.id}>
                  <td>{report.report_number}</td>
                  <td>{report.driver_name || 'N/A'}</td>
                  <td>{report.incident_type}</td>
                  <td>{format(new Date(report.incident_date || report.created_at), 'MMM dd, yyyy')}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="btn-link"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

