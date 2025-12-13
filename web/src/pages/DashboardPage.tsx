import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { socketService } from '../lib/socket';
import { useI18n } from '../lib/i18n';
import { AccidentReport } from '../types';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Car,
  AlertCircle,
  Eye,
  Camera,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'red';
  trend?: string;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <article className="card p-6" aria-label={`${title}: ${value}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              {trend}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colorClasses[color])}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function getStatusBadge(status: string, t: (key: string) => string) {
  const styles: Record<string, string> = {
    draft: 'badge-gray',
    submitted: 'badge-info',
    under_review: 'badge-warning',
    closed: 'badge-success',
  };

  const labels: Record<string, string> = {
    draft: t('status.draft'),
    submitted: t('status.submitted'),
    under_review: t('status.underReview'),
    closed: t('status.closed'),
  };

  return (
    <span className={clsx('badge', styles[status] || 'badge-gray')}>
      {labels[status] || status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function getIncidentIcon(type: string) {
  switch (type) {
    case 'accident':
      return <Car className="w-4 h-4 text-red-500 dark:text-red-400" aria-hidden="true" />;
    case 'incident':
      return <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />;
    case 'near_miss':
      return <AlertTriangle className="w-4 h-4 text-blue-500 dark:text-blue-400" aria-hidden="true" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400" aria-hidden="true" />;
  }
}

export function DashboardPage() {
  const { t } = useI18n();
  const [realtimePhotos, setRealtimePhotos] = useState<any[]>([]);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await reportsApi.getAll({ limit: 10 });
      return response.data;
    },
  });

  const reports = reportsData?.reports || [];
  const total = reportsData?.pagination?.total || 0;

  // Calculate stats
  const stats = {
    total,
    submitted: reports.filter((r: AccidentReport) => r.status === 'submitted').length,
    pendingReview: reports.filter((r: AccidentReport) => r.status === 'under_review').length,
    closed: reports.filter((r: AccidentReport) => r.status === 'closed').length,
  };

  // Subscribe to real-time photo updates
  useEffect(() => {
    const unsubscribe = socketService.subscribe('report:photo:new', (data: any) => {
      setRealtimePhotos((prev) => [data, ...prev.slice(0, 4)]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {t('dashboard.subtitle')}
        </p>
      </header>

      {/* Stats grid */}
      <section aria-label="Dashboard statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('dashboard.totalReports')}
            value={stats.total}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title={t('dashboard.newSubmissions')}
            value={stats.submitted}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title={t('dashboard.underReview')}
            value={stats.pendingReview}
            icon={Eye}
            color="red"
          />
          <StatCard
            title={t('dashboard.closed')}
            value={stats.closed}
            icon={CheckCircle}
            color="green"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <section className="lg:col-span-2 card" aria-labelledby="recent-reports-heading">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h2 id="recent-reports-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentReports')}
            </h2>
            <Link
              to="/reports"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium focus:outline-none focus:underline"
            >
              {t('dashboard.viewAll')} →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center" role="status" aria-label="Loading reports">
              <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
              <p className="mt-2 text-gray-500 dark:text-slate-400">{t('reports.noReports')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700" role="list">
              {reports.slice(0, 5).map((report: AccidentReport) => (
                <li key={report.id}>
                  <Link
                    to={`/reports/${report.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      {getIncidentIcon(report.incidentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {report.reportNumber || report.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(report.status, t)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                        {report.driverName || 'Unknown driver'} •{' '}
                        {format(new Date(report.incidentDate), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400 dark:text-slate-500">
                      {report.photoCount ? (
                        <span className="flex items-center gap-1" aria-label={`${report.photoCount} photos`}>
                          <Camera className="w-4 h-4" aria-hidden="true" />
                          {report.photoCount}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Live Photo Feed */}
        <section className="card" aria-labelledby="live-feed-heading" aria-live="polite">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <h2 id="live-feed-heading" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              {t('dashboard.livePhotoFeed')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Real-time photos from drivers in the field
            </p>
          </div>

          <div className="p-4">
            {realtimePhotos.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  {t('dashboard.noPhotos')}
                </p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {realtimePhotos.map((photo, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-600 overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt={`Scene photo from report ${photo.reportId?.slice(0, 8)}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Report {photo.reportId?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {format(new Date(photo.timestamp), 'h:mm:ss a')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
