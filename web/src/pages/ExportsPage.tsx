import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, exportsApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { AccidentReport, ExportFormat } from '../types';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  FileCode,
  Archive,
  Check,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function ExportsPage() {
  const { t } = useI18n();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats: { value: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Professional report format' },
    { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, description: 'Spreadsheet with all data' },
    { value: 'csv', label: 'CSV', icon: File, description: 'Simple comma-separated values' },
    { value: 'xml', label: 'XML', icon: FileCode, description: 'Structured data format' },
    { value: 'json', label: 'JSON', icon: FileCode, description: 'API-friendly format' },
    { value: 'zip', label: 'ZIP Bundle', icon: Archive, description: 'All files and photos' },
  ];

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300',
      submitted: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      under_review: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
      closed: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    };

    return (
      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
        {t(`status.${status === 'under_review' ? 'underReview' : status}`)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('exports.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {t('exports.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format selection */}
        <section className="card p-6" aria-labelledby="format-heading">
          <h2 id="format-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('exports.format')}
          </h2>
          <div className="space-y-2" role="radiogroup" aria-label="Export format">
            {exportFormats.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedFormat(fmt.value)}
                  role="radio"
                  aria-checked={selectedFormat === fmt.value}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500',
                    selectedFormat === fmt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  )}
                >
                  <Icon className={clsx(
                    'w-5 h-5',
                    selectedFormat === fmt.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
                  )} aria-hidden="true" />
                  <div className="flex-1">
                    <div className={clsx(
                      'font-medium',
                      selectedFormat === fmt.value ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                    )}>
                      {fmt.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{fmt.description}</div>
                  </div>
                  {selectedFormat === fmt.value && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Report selection */}
        <section className="lg:col-span-2 card" aria-labelledby="reports-heading">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 id="reports-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('exports.selectReports')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {t('exports.selected', { count: selectedReports.length, total: reports.length })}
              </p>
            </div>
            <button 
              onClick={selectAll} 
              className="btn-secondary text-sm"
              aria-label={selectedReports.length === reports.length ? 'Deselect all reports' : 'Select all reports'}
            >
              {selectedReports.length === reports.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                No reports available to export
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700" role="listbox" aria-multiselectable="true">
                {reports.map((report: AccidentReport) => (
                  <li key={report.id}>
                    <label
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => toggleReport(report.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-blue-500"
                        aria-label={`Select report ${report.reportNumber || report.id.slice(0, 8)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {report.reportNumber || report.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                          {report.driverName} • {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={handleExport}
              disabled={selectedReports.length === 0 || isExporting}
              className="w-full btn-primary flex items-center justify-center gap-2"
              aria-busy={isExporting}
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Exporting" />
              ) : (
                <>
                  <Download className="w-5 h-5" aria-hidden="true" />
                  {t('exports.export', { count: selectedReports.length })}
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* RMIS Integration info */}
      <section className="card p-6" aria-labelledby="rmis-heading">
        <h2 id="rmis-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('exports.rmisIntegration')}
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          {t('exports.rmisDescription')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Origami Risk', desc: 'Enterprise risk management platform' },
            { name: 'Riskonnect', desc: 'Integrated risk management solution' },
            { name: 'Custom API', desc: 'Connect to your own system' },
          ].map((integration) => (
            <article 
              key={integration.name} 
              className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{integration.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{integration.desc}</p>
              <button className="btn-secondary text-sm mt-3 inline-flex items-center gap-2">
                <Settings className="w-4 h-4" aria-hidden="true" />
                Configure
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
