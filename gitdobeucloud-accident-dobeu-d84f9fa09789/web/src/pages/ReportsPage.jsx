import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportService, exportService } from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import { REPORT_STATUS, REPORT_STATUS_COLORS, INCIDENT_TYPE, DEFAULT_PAGE_SIZE } from '../constants';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    status: '',
    incident_type: '',
    page: 1,
    limit: DEFAULT_PAGE_SIZE
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportService.getAll(filters)
  });

  const reports = data?.data?.reports || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / filters.limit);

  const exportMutation = useMutation({
    mutationFn: ({ format, reportIds }) => exportService.exportReports(format, reportIds),
    onSuccess: (data, variables) => {
      const blob = new Blob([data.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-${Date.now()}.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up to prevent memory leak
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Export completed');
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Export failed');
    }
  });

  const handleExport = (format) => {
    const selectedReports = data?.data?.reports?.map(r => r.id) || [];
    exportMutation.mutate({ format, reportIds: selectedReports });
  };

  const getStatusColor = (status) => {
    return REPORT_STATUS_COLORS[status] || '#999';
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
            <option value={REPORT_STATUS.DRAFT}>Draft</option>
            <option value={REPORT_STATUS.SUBMITTED}>Submitted</option>
            <option value={REPORT_STATUS.UNDER_REVIEW}>Under Review</option>
            <option value={REPORT_STATUS.CLOSED}>Closed</option>
          </select>
          <select
            value={filters.incident_type}
            onChange={(e) => setFilters({ ...filters, incident_type: e.target.value, page: 1 })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value={INCIDENT_TYPE.ACCIDENT}>Accident</option>
            <option value={INCIDENT_TYPE.INCIDENT}>Incident</option>
            <option value={INCIDENT_TYPE.NEAR_MISS}>Near Miss</option>
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
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports found</p>
        </div>
      ) : (
        <>
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
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.report_number}</td>
                    <td>{report.driver_name || 'N/A'}</td>
                    <td>{report.incident_type}</td>
                    <td>{formatDate(report.incident_date || report.created_at)}</td>
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
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {filters.page} of {totalPages} ({total} total)
              </span>
              <button 
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

