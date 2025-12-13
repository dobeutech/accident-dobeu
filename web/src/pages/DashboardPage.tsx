import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { socketService } from '../lib/socket';
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
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'badge-gray',
    submitted: 'badge-info',
    under_review: 'badge-warning',
    closed: 'badge-success',
  };

  return (
    <span className={clsx('badge', styles[status] || 'badge-gray')}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function getIncidentIcon(type: string) {
  switch (type) {
    case 'accident':
      return <Car className="w-4 h-4 text-red-500" />;
    case 'incident':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'near_miss':
      return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
}

export function DashboardPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your fleet's incident reports
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="New Submissions"
          value={stats.submitted}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Under Review"
          value={stats.pendingReview}
          icon={Eye}
          color="red"
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
            <Link
              to="/reports"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-gray-500">No reports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((report: AccidentReport) => (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {getIncidentIcon(report.incidentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {report.reportNumber || report.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {report.driverName || 'Unknown driver'} •{' '}
                      {format(new Date(report.incidentDate), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.photoCount ? (
                      <span className="flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        {report.photoCount}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Live Photo Feed */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Live Photo Feed
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time photos from drivers in the field
            </p>
          </div>

          <div className="p-4">
            {realtimePhotos.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">
                  No live photos yet. Photos will appear here as drivers capture them.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {realtimePhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt="Scene photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Report {photo.reportId?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(photo.timestamp), 'h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
