import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { reportsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function ReportsView() {
  const { selectedDataset } = useDataset();
  const [downloading, setDownloading] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  if (!selectedDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <p className="text-sm">Please select a dataset to export reports.</p>
      </div>
    );
  }

  const reports = [
    {
      id: 'pdf',
      title: 'Executive Sales Intelligence PDF',
      description: 'C-level formatted report complete with financial KPIs, seasonal demand climes, top products, and AI recommendations.',
      format: 'PDF Document (.pdf)',
      icon: FileText,
      color: 'blue',
      downloadUrl: reportsApi.getPdfUrl(selectedDataset.id),
      filename: `Sales_Intelligence_Report_${selectedDataset.name.replace(/\s+/g, '_')}.pdf`,
    },
    {
      id: 'excel',
      title: 'Multi-Tab Comprehensive Excel Workbook',
      description: 'Structured workbook containing Executive Summary, Raw Records, Seasonal Analysis, and Category Market Share sheets.',
      format: 'Excel Spreadsheet (.xlsx)',
      icon: FileSpreadsheet,
      color: 'teal',
      downloadUrl: reportsApi.getExcelUrl(selectedDataset.id),
      filename: `Sales_Telemetry_${selectedDataset.name.replace(/\s+/g, '_')}.xlsx`,
    },
    {
      id: 'csv',
      title: 'Normalized Raw Sales Records CSV',
      description: 'Machine-readable clean CSV dataset with all canonical fields mapped, sanitized, and enriched.',
      format: 'CSV Document (.csv)',
      icon: Download,
      color: 'orange',
      downloadUrl: reportsApi.getCsvUrl(selectedDataset.id),
      filename: `Sales_Records_${selectedDataset.name.replace(/\s+/g, '_')}.csv`,
    },
  ];

  const handleDownload = async (report) => {
    setDownloading((prev) => ({ ...prev, [report.id]: true }));
    setStatusMessage({ type: 'info', text: `Generating ${report.title}...` });

    try {
      let res;
      let mimeType = 'application/octet-stream';

      if (report.id === 'pdf') {
        res = await reportsApi.downloadPdf(selectedDataset.id);
        mimeType = 'application/pdf';
      } else if (report.id === 'excel') {
        res = await reportsApi.downloadExcel(selectedDataset.id);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        res = await reportsApi.downloadCsv(selectedDataset.id);
        mimeType = 'text/csv';
      }

      // Create blob and download link
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `✅ ${report.title} downloaded successfully!`,
      });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: direct browser URL navigation with token
      window.open(report.downloadUrl, '_blank');
      setStatusMessage({
        type: 'info',
        text: `Download triggered via direct export link.`,
      });
    } finally {
      setDownloading((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Report Generation & Telemetry Export Suite
        </h2>
        <p className="text-xs text-slate-400">
          Generate executive-ready PDF briefs, multi-tab Excel workbooks, and raw CSV files
        </p>
      </div>

      {/* Status Alert Banner (if downloading or completed) */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Dataset Context Card */}
      <div className="glass-card rounded-2xl p-5 border border-panelBorder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-bold text-blue-400 tracking-wider block mb-1">
            Active Dataset Export Context
          </span>
          <h3 className="text-base font-bold text-white">{selectedDataset.name}</h3>
          <p className="text-xs text-slate-400">
            {selectedDataset.rowCount} Records • {selectedDataset.columnCount} Columns • Uploaded on{' '}
            {new Date(selectedDataset.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Verified</span>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => {
          const Icon = r.icon;
          const isCurrentDownloading = !!downloading[r.id];

          return (
            <div
              key={r.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between border border-panelBorder hover:border-blue-500/40 transition-all"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  {r.format}
                </span>
                <h4 className="text-base font-bold text-white mb-2">{r.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-panelBorder flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isCurrentDownloading}
                  onClick={() => handleDownload(r)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glowBlue transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCurrentDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating File...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export &amp; Download</span>
                    </>
                  )}
                </button>

                {/* Direct link alternative */}
                <a
                  href={r.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-center text-slate-400 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 py-1"
                >
                  <span>Direct browser link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
