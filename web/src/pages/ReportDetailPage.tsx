import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import { AccidentReport, ReportStatus } from '../types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  Mic,
  FileText,
  Pencil,
  CheckCircle,
  Clock,
  Eye,
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

const statusOptions: { value: ReportStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-700' },
];

function getIncidentTypeConfig(type: string) {
  const configs: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    accident: { icon: Car, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Vehicle Accident' },
    incident: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Injury/Incident' },
    near_miss: { icon: AlertTriangle, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Near Miss' },
  };
  return configs[type] || configs.accident;
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Report not found</h2>
        <p className="mt-2 text-gray-500">The report you're looking for doesn't exist.</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {report.reportNumber || `Report ${report.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium', incidentConfig.bgColor, incidentConfig.color)}>
                <IncidentIcon className="w-4 h-4" />
                {incidentConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Status dropdown */}
        <div className="flex items-center gap-3">
          <select
            className="input"
            value={report.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value as ReportStatus)}
            disabled={updateStatusMutation.isPending}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(report.incidentDate), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(report.incidentDate), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  {report.address ? (
                    <p className="font-medium text-gray-900">{report.address}</p>
                  ) : report.latitude ? (
                    <p className="font-medium text-gray-900">
                      {report.latitude.toFixed(6)}, {report.longitude?.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-gray-400">No location recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Custom fields */}
          {report.customFields && Object.keys(report.customFields).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.customFields).map(([key, value]) => (
                  <div key={key} className="py-2 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium text-gray-900">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photos ({report.photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {report.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedImage(photo.fileUrl || '')}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={photo.fileUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio recordings */}
          {report.audio && report.audio.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Audio Recordings ({report.audio.length})
              </h2>
              <div className="space-y-3">
                {report.audio.map((audio, index) => (
                  <div
                    key={audio.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Recording {index + 1}</p>
                      {audio.durationSeconds && (
                        <p className="text-sm text-gray-500">
                          Duration: {Math.floor(audio.durationSeconds / 60)}:
                          {(audio.durationSeconds % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    {audio.fileUrl && (
                      <audio controls className="h-10">
                        <source src={audio.fileUrl} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Driver info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {report.driverName || 'Unknown Driver'}
                  </p>
                  <p className="text-sm text-gray-500">Driver</p>
                </div>
              </div>

              {report.driverEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${report.driverEmail}`} className="text-primary-600 hover:underline">
                    {report.driverEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Report Created</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {report.updatedAt !== report.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {report.syncedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Synced</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(report.syncedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
