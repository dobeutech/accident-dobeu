import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { AccidentReport, ReportStatus, IncidentType } from '../types';
import {
  Search,
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

function getStatusBadge(status: string, t: (key: string) => string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300',
    submitted: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    under_review: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    closed: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  };

  const labels: Record<string, string> = {
    draft: t('status.draft'),
    submitted: t('status.submitted'),
    under_review: t('status.underReview'),
    closed: t('status.closed'),
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', styles[status])}>
      {labels[status] || status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function getIncidentTypeBadge(type: string, t: (key: string) => string) {
  const config: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
    accident: { icon: Car, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30', labelKey: 'incident.accident' },
    incident: { icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30', labelKey: 'incident.incident' },
    near_miss: { icon: AlertTriangle, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', labelKey: 'incident.nearMiss' },
  };

  const { icon: Icon, color, labelKey } = config[type] || config.accident;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium', color)}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {t(labelKey)}
    </span>
  );
}

export function ReportsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<IncidentType | ''>('');
  const limit = 20;

  const statusOptions: { value: ReportStatus | ''; labelKey: string }[] = [
    { value: '', labelKey: 'reports.allStatuses' },
    { value: 'draft', labelKey: 'status.draft' },
    { value: 'submitted', labelKey: 'status.submitted' },
    { value: 'under_review', labelKey: 'status.underReview' },
    { value: 'closed', labelKey: 'status.closed' },
  ];

  const typeOptions: { value: IncidentType | ''; labelKey: string }[] = [
    { value: '', labelKey: 'reports.allTypes' },
    { value: 'accident', labelKey: 'incident.accident' },
    { value: 'incident', labelKey: 'incident.incident' },
    { value: 'near_miss', labelKey: 'incident.nearMiss' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (statusFilter) { params.status = statusFilter; }
      if (typeFilter) { params.incident_type = typeFilter; }
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
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {t('reports.subtitle')}
          </p>
        </header>
        <Link 
          to="/exports" 
          className="btn-secondary inline-flex items-center gap-2"
          aria-label={t('reports.export')}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          {t('reports.export')}
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <label htmlFor="report-search" className="sr-only">{t('reports.search')}</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" aria-hidden="true" />
            <input
              id="report-search"
              type="search"
              placeholder={t('reports.search')}
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              className="input w-full md:w-48"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReportStatus | '');
                setPage(1);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label htmlFor="type-filter" className="sr-only">Filter by type</label>
            <select
              id="type-filter"
              className="input w-full md:w-48"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as IncidentType | '');
                setPage(1);
              }}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Report
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Media
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div 
                      className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" 
                      role="status"
                      aria-label={t('common.loading')}
                    />
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-slate-400">
                    {t('reports.noReports')}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report: AccidentReport) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        to={`/reports/${report.id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:underline"
                      >
                        {report.reportNumber || report.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {getIncidentTypeBadge(report.incidentType, t)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {report.driverName || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {report.driverEmail}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        <time dateTime={report.incidentDate}>
                          {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                        </time>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {format(new Date(report.incidentDate), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {report.address ? (
                        <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-slate-300 max-w-xs">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="truncate">{report.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-sm">No location</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(report.status, t)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
                        {report.photoCount ? (
                          <span className="flex items-center gap-1 text-sm" aria-label={`${report.photoCount} photos`}>
                            <Camera className="w-4 h-4" aria-hidden="true" />
                            {report.photoCount}
                          </span>
                        ) : null}
                        {report.audioCount ? (
                          <span className="flex items-center gap-1 text-sm" aria-label={`${report.audioCount} audio recordings`}>
                            <Mic className="w-4 h-4" aria-hidden="true" />
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
        <nav 
          className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between"
          aria-label="Pagination"
        >
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, pagination.total)} of {pagination.total} reports
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary p-2"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-sm text-gray-600 dark:text-slate-300">
              Page {page} of {pagination.pages}
            </span>
            <button
              className="btn-secondary p-2"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
