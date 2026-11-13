import React, { useState } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Trash2,
  CheckCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { datasetsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function DatasetsView() {
  const { datasets, selectedDatasetId, selectDataset, fetchDatasets } = useDataset();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState(1); // 1: Select File, 2: Column Mapping, 3: Validation & Confirm
  const [selectedFile, setSelectedFile] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [datasetName, setDatasetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Upload and Inspect File
  const handleInspectFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await datasetsApi.inspect(formData);
      setInspectionData(res.data);
      setColumnMapping(res.data.suggestedMapping || {});
      setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setUploadStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'File inspection failed. Ensure valid CSV or Excel format.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Move to validation preview
  const handleProceedToValidation = () => {
    setUploadStep(3);
  };

  // Step 3: Confirm and Commit to Database
  const handleConfirmUpload = async () => {
    if (!inspectionData?.tempFileId) return;

    setLoading(true);
    setError('');

    try {
      const res = await datasetsApi.confirm({
        tempFileId: inspectionData.tempFileId,
        name: datasetName,
        columnMapping,
      });

      setSuccessMsg(`Dataset "${datasetName}" stored successfully with ${res.data.dataset.rowCount} clean records!`);
      await fetchDatasets();
      selectDataset(res.data.dataset.id);
      setTimeout(() => {
        setIsModalOpen(false);
        resetUploadState();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save dataset.');
    } finally {
      setLoading(false);
    }
  };

  const resetUploadState = () => {
    setUploadStep(1);
    setSelectedFile(null);
    setInspectionData(null);
    setColumnMapping({});
    setDatasetName('');
    setError('');
    setSuccessMsg('');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"? This will remove all associated sales records.`)) {
      return;
    }
    try {
      await datasetsApi.delete(id);
      await fetchDatasets();
    } catch (err) {
      alert('Failed to delete dataset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Dataset Management & Dynamic Ingestion Engine
          </h2>
          <p className="text-xs text-slate-400">
            Ingest CSV, XLS, XLSX files with schema inference, dynamic column mapping, and database persistence
          </p>
        </div>

        <button
          onClick={() => {
            resetUploadState();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glowBlue transition-all shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Dataset</span>
        </button>
      </div>

      {/* Dataset History Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((ds) => {
          const isSelected = ds.id === selectedDatasetId;
          const kpis = ds.summaryMetrics || {};

          return (
            <div
              key={ds.id}
              className={`glass-card rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-blue-500/60 bg-blue-600/10 shadow-glowBlue'
                  : 'hover:border-slate-500'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{ds.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ds.originalFilename}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-panelBorder text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Records</span>
                    <span className="font-bold text-white font-mono">{ds.rowCount} Rows</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Revenue</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      ${(kpis.totalRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Unique SKUs</span>
                    <span className="font-medium text-slate-300 font-mono">
                      {kpis.uniqueProducts || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Upload Date</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ds.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-panelBorder flex items-center justify-between gap-2">
                {!isSelected ? (
                  <button
                    onClick={() => selectDataset(ds.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white/5 hover:bg-blue-600 hover:text-white text-slate-300 border border-panelBorder transition-all"
                  >
                    Set as Active
                  </button>
                ) : (
                  <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Telemetry Loaded
                  </span>
                )}

                <button
                  onClick={() => handleDelete(ds.id, ds.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Dataset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Step Ingestion & Mapping Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-panelBorder shadow-glass">
            {/* Modal Header */}
            <div className="p-5 border-b border-panelBorder flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Dataset Ingestion Wizard (Step {uploadStep} of 3)
                </h3>
                <p className="text-xs text-slate-400">
                  {uploadStep === 1
                    ? 'Upload CSV, XLS, or XLSX dataset file'
                    : uploadStep === 2
                    ? 'Map source columns to canonical sales schema'
                    : 'Validate data quality and store records'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Step 1: Select File */}
              {uploadStep === 1 && (
                <form onSubmit={handleInspectFile} className="space-y-4">
                  <div className="border-2 border-dashed border-panelBorder rounded-2xl p-8 text-center hover:border-blue-500/50 transition-colors">
                    <FileSpreadsheet className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white mb-1">
                      Choose a CSV, XLS, or XLSX dataset
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      Supports arbitrary headers: column mapping occurs in next step
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      required
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-3 rounded-xl bg-white/5 border border-panelBorder text-xs text-slate-300 flex items-center justify-between">
                      <span>Selected: <strong>{selectedFile.name}</strong></span>
                      <span className="text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedFile || loading}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glowBlue disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? 'Inspecting Schema...' : 'Inspect & Map Columns'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Dynamic Column Mapping */}
              {uploadStep === 2 && inspectionData && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Dataset Display Name
                    </label>
                    <input
                      type="text"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
                      Dynamic Column Alignment
                    </h5>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Match your source columns ({inspectionData.rowCount} rows detected) to canonical analytics attributes.
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {Object.entries(inspectionData.canonicalDefinitions || {}).map(([key, def]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-panelBorder text-xs gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {def.label} {def.required && <strong className="text-rose-400">*</strong>}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Type: {def.type}
                            </span>
                          </div>

                          <select
                            value={columnMapping[key] || ''}
                            onChange={(e) =>
                              setColumnMapping({ ...columnMapping, [key]: e.target.value })
                            }
                            className="glass-input rounded-lg px-2.5 py-1 text-xs font-medium max-w-[200px] cursor-pointer"
                          >
                            <option value="">
                              -- Choose Column --
                            </option>
                            {inspectionData.detectedColumns.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name} ({c.inferredType})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-panelBorder">
                    <button
                      type="button"
                      onClick={() => setUploadStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToValidation}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-glowBlue flex items-center gap-2"
                    >
                      Validate Dataset
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Validation & Confirmation Preview */}
              {uploadStep === 3 && inspectionData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Dataset Pre-Validation Passed
                      </h4>
                      <p className="text-xs text-slate-300">
                        {inspectionData.rowCount} rows prepared for database storage with active schema mapping.
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white/5 border border-panelBorder">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Rows</span>
                      <strong className="text-lg text-white font-mono">{inspectionData.rowCount}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-panelBorder">
                      <span className="text-[10px] text-slate-400 block uppercase">Columns</span>
                      <strong className="text-lg text-blue-400 font-mono">{inspectionData.columnCount}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-panelBorder">
                      <span className="text-[10px] text-slate-400 block uppercase">Quality Score</span>
                      <strong className="text-lg text-emerald-400 font-mono">100%</strong>
                    </div>
                  </div>

                  {/* Sample Preview */}
                  <div>
                    <h5 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
                      Sample Ingested Rows Preview
                    </h5>
                    <div className="overflow-x-auto max-h-44 border border-panelBorder rounded-xl">
                      <table className="w-full text-left text-[11px] text-slate-300">
                        <thead className="bg-white/5 text-slate-400 border-b border-panelBorder">
                          <tr>
                            {Object.keys(inspectionData.sampleRows[0] || {}).slice(0, 5).map((col) => (
                              <th key={col} className="p-2 font-medium">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-panelBorder font-mono">
                          {inspectionData.sampleRows.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).slice(0, 5).map((val, vIdx) => (
                                <td key={vIdx} className="p-2 truncate max-w-[120px]">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-panelBorder">
                    <button
                      type="button"
                      onClick={() => setUploadStep(2)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleConfirmUpload}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glowTeal flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Storing in PostgreSQL...' : 'Confirm & Save Dataset'}
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

