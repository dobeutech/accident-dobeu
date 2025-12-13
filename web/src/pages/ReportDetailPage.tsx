import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { AccidentReport, ReportStatus } from '../types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Mail,
  Camera,
  Mic,
  FileText,
  Pencil,
  CheckCircle,
  Clock,
  X,
  Car,
  AlertCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function ReportDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const statusOptions: { value: ReportStatus; labelKey: string; color: string; darkColor: string }[] = [
    { value: 'draft', labelKey: 'status.draft', color: 'bg-gray-100 text-gray-700', darkColor: 'dark:bg-slate-700 dark:text-slate-300' },
    { value: 'submitted', labelKey: 'status.submitted', color: 'bg-blue-100 text-blue-700', darkColor: 'dark:bg-blue-900/50 dark:text-blue-300' },
    { value: 'under_review', labelKey: 'status.underReview', color: 'bg-yellow-100 text-yellow-700', darkColor: 'dark:bg-yellow-900/50 dark:text-yellow-300' },
    { value: 'closed', labelKey: 'status.closed', color: 'bg-green-100 text-green-700', darkColor: 'dark:bg-green-900/50 dark:text-green-300' },
  ];

  function getIncidentTypeConfig(type: string) {
    const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string; labelKey: string }> = {
      accident: { icon: Car, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50', labelKey: 'incident.accident' },
      incident: { icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', labelKey: 'incident.incident' },
      near_miss: { icon: AlertTriangle, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/50', labelKey: 'incident.nearMiss' },
    };
    return configs[type] || configs.accident;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await reportsApi.getById(id!);
      return response.data.report;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ReportStatus) => {
      const response = await reportsApi.update(id!, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label={t('common.loading')}>
        <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Report not found</h2>
        <p className="mt-2 text-gray-500 dark:text-slate-400">The report you're looking for doesn't exist.</p>
        <Link to="/reports" className="btn-primary mt-4 inline-block">
          Back to Reports
        </Link>
      </div>
    );
  }

  const report = data as AccidentReport;
  const incidentConfig = getIncidentTypeConfig(report.incidentType);
  const IncidentIcon = incidentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {report.reportNumber || `Report ${report.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium', incidentConfig.bgColor, incidentConfig.color)}>
                <IncidentIcon className="w-4 h-4" aria-hidden="true" />
                {t(incidentConfig.labelKey)}
              </span>
            </div>
          </div>
        </div>

        {/* Status dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="status-select" className="sr-only">Change status</label>
          <select
            id="status-select"
            className="input"
            value={report.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value as ReportStatus)}
            disabled={updateStatusMutation.isPending}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident details */}
          <section className="card p-6" aria-labelledby="incident-details-heading">
            <h2 id="incident-details-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Incident Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Date & Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    <time dateTime={report.incidentDate}>
                      {format(new Date(report.incidentDate), 'MMMM d, yyyy')}
                    </time>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {format(new Date(report.incidentDate), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-slate-500 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Location</p>
                  {report.address ? (
                    <p className="font-medium text-gray-900 dark:text-white">{report.address}</p>
                  ) : report.latitude ? (
                    <p className="font-medium text-gray-900 dark:text-white">
                      {report.latitude.toFixed(6)}, {report.longitude?.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-gray-400 dark:text-slate-500">No location recorded</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Custom fields */}
          {report.customFields && Object.keys(report.customFields).length > 0 && (
            <section className="card p-6" aria-labelledby="report-details-heading">
              <h2 id="report-details-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.customFields).map(([key, value]) => (
                  <div key={key} className="py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <p className="text-sm text-gray-500 dark:text-slate-400 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <section className="card p-6" aria-labelledby="photos-heading">
              <h2 id="photos-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" aria-hidden="true" />
                Photos ({report.photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list">
                {report.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedImage(photo.fileUrl || '')}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`View photo ${index + 1}`}
                  >
                    <img
                      src={photo.fileUrl}
                      alt={`Scene photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Audio recordings */}
          {report.audio && report.audio.length > 0 && (
            <section className="card p-6" aria-labelledby="audio-heading">
              <h2 id="audio-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" aria-hidden="true" />
                Audio Recordings ({report.audio.length})
              </h2>
              <ul className="space-y-3" role="list">
                {report.audio.map((audio, index) => (
                  <li
                    key={audio.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Recording {index + 1}</p>
                      {audio.durationSeconds && (
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Duration: {Math.floor(audio.durationSeconds / 60)}:
                          {(audio.durationSeconds % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    {audio.fileUrl && (
                      <audio controls className="h-10" aria-label={`Audio recording ${index + 1}`}>
                        <source src={audio.fileUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Driver info */}
          <section className="card p-6" aria-labelledby="driver-info-heading">
            <h2 id="driver-info-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Driver Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.driverName || 'Unknown Driver'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('role.driver')}</p>
                </div>
              </div>

              {report.driverEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
                  <a 
                    href={`mailto:${report.driverEmail}`} 
                    className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:underline"
                  >
                    {report.driverEmail}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="card p-6" aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h2>
            <ol className="space-y-4" role="list">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Report Created</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    <time dateTime={report.createdAt}>
                      {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                    </time>
                  </p>
                </div>
              </li>

              {report.updatedAt !== report.createdAt && (
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-4 h-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Last Updated</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      <time dateTime={report.updatedAt}>
                        {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}
                      </time>
                    </p>
                  </div>
                </li>
              )}

              {report.syncedAt && (
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Synced</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      <time dateTime={report.syncedAt}>
                        {format(new Date(report.syncedAt), 'MMM d, yyyy h:mm a')}
                      </time>
                    </p>
                  </div>
                </li>
              )}
            </ol>
          </section>
        </aside>
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size image viewer"
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-1"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image viewer"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
          <img
            src={selectedImage}
            alt="Full size scene photo"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
