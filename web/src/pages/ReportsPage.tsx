import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { AccidentReport, ReportStatus, IncidentType } from '../types';
import {
  Search,
  Filter,
  Car,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Camera,
  Mic,
  Download,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const statusOptions: { value: ReportStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'closed', label: 'Closed' },
];

const typeOptions: { value: IncidentType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'accident', label: 'Vehicle Accident' },
  { value: 'incident', label: 'Injury/Incident' },
  { value: 'near_miss', label: 'Near Miss' },
];

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700',
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', styles[status])}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function getIncidentTypeBadge(type: string) {
  const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    accident: { icon: Car, color: 'text-red-600 bg-red-50', label: 'Accident' },
    incident: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50', label: 'Incident' },
    near_miss: { icon: AlertTriangle, color: 'text-blue-600 bg-blue-50', label: 'Near Miss' },
  };

  const { icon: Icon, color, label } = config[type] || config.accident;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium', color)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<IncidentType | ''>('');
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reports', page, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.incident_type = typeFilter;
      const response = await reportsApi.getAll(params);
      return response.data;
    },
  });

  const reports = data?.reports || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Client-side search filter
  const filteredReports = search
    ? reports.filter((r: AccidentReport) =>
        r.reportNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all incident reports
          </p>
        </div>
        <Link to="/exports" className="btn-secondary inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Reports
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="input w-full md:w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReportStatus | '');
              setPage(1);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            className="input w-full md:w-48"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as IncidentType | '');
              setPage(1);
            }}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report: AccidentReport) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        to={`/reports/${report.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {report.reportNumber || report.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {getIncidentTypeBadge(report.incidentType)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {report.driverName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.driverEmail}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(report.incidentDate), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {report.address ? (
                        <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{report.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No location</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-gray-500">
                        {report.photoCount ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Camera className="w-4 h-4" />
                            {report.photoCount}
                          </span>
                        ) : null}
                        {report.audioCount ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mic className="w-4 h-4" />
                            {report.audioCount}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, pagination.total)} of {pagination.total} reports
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary p-2"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {pagination.pages}
            </span>
            <button
              className="btn-secondary p-2"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
