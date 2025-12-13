import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, exportsApi } from '../lib/api';
import { AccidentReport, ExportFormat } from '../types';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  FileCode,
  Archive,
  Calendar,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const exportFormats: { value: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'pdf', label: 'PDF', icon: FileText, description: 'Professional report format' },
  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, description: 'Spreadsheet with all data' },
  { value: 'csv', label: 'CSV', icon: File, description: 'Simple comma-separated values' },
  { value: 'xml', label: 'XML', icon: FileCode, description: 'Structured data format' },
  { value: 'json', label: 'JSON', icon: FileCode, description: 'API-friendly format' },
  { value: 'zip', label: 'ZIP Bundle', icon: Archive, description: 'All files and photos' },
];

export function ExportsPage() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);

  const { data } = useQuery({
    queryKey: ['reports', 'export'],
    queryFn: async () => {
      const response = await reportsApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  const reports = data?.reports || [];

  const toggleReport = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r: AccidentReport) => r.id));
    }
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report to export');
      return;
    }

    setIsExporting(true);

    try {
      const response = await exportsApi.exportReports(selectedFormat, selectedReports);
      
      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `accident-reports-${format(new Date(), 'yyyy-MM-dd')}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error('Failed to export reports');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export incident reports in various formats for analysis or RMIS integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format selection */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>
          <div className="space-y-2">
            {exportFormats.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedFormat(fmt.value)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                    selectedFormat === fmt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={clsx(
                    'w-5 h-5',
                    selectedFormat === fmt.value ? 'text-primary-600' : 'text-gray-400'
                  )} />
                  <div className="flex-1">
                    <div className={clsx(
                      'font-medium',
                      selectedFormat === fmt.value ? 'text-primary-900' : 'text-gray-900'
                    )}>
                      {fmt.label}
                    </div>
                    <div className="text-xs text-gray-500">{fmt.description}</div>
                  </div>
                  {selectedFormat === fmt.value && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report selection */}
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Reports</h2>
              <p className="text-sm text-gray-500">
                {selectedReports.length} of {reports.length} selected
              </p>
            </div>
            <button onClick={selectAll} className="btn-secondary text-sm">
              {selectedReports.length === reports.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No reports available to export
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map((report: AccidentReport) => (
                  <label
                    key={report.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleReport(report.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {report.reportNumber || report.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.driverName} • {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      report.status === 'closed' ? 'bg-green-100 text-green-700' :
                      report.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleExport}
              disabled={selectedReports.length === 0 || isExporting}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RMIS Integration info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">RMIS Integration</h2>
        <p className="text-gray-600 mb-4">
          Connect to Risk Management Information Systems to automatically push report data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Origami Risk</h3>
            <p className="text-sm text-gray-500 mt-1">Enterprise risk management platform</p>
            <button className="btn-secondary text-sm mt-3">Configure</button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Riskonnect</h3>
            <p className="text-sm text-gray-500 mt-1">Integrated risk management solution</p>
            <button className="btn-secondary text-sm mt-3">Configure</button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Custom API</h3>
            <p className="text-sm text-gray-500 mt-1">Connect to your own system</p>
            <button className="btn-secondary text-sm mt-3">Configure</button>
          </div>
        </div>
      </div>
    </div>
  );
}
