import { useState, useEffect, useRef } from 'react';
import * as api from '../api/client';
import type { WorkProgress } from '../types';

const WORKBENCH_PASSWORD = 'Chaofenzi';

export default function WorkbenchPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('workbench-auth') === '1');
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);

  const handleLogin = () => {
    if (pwd === WORKBENCH_PASSWORD) {
      sessionStorage.setItem('workbench-auth', '1');
      setAuthed(true);
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  };

  const [entries, setEntries] = useState<WorkProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [personName, setPersonName] = useState('');
  const [fileType, setFileType] = useState('data');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkProgress | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchList = () => {
    api.getWorkProgressList()
      .then(setEntries)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const handleUpload = async () => {
    if (!personName.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('person_name', personName);
      fd.set('file_name', file?.name ?? '—');
      fd.set('file_type', fileType);
      fd.set('description', description);
      if (file) fd.set('file', file);

      await api.uploadWorkProgress(fd);
      setPersonName('');
      setDescription('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchList();
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (item: WorkProgress) => {
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteWorkProgress(deleteTarget.id);
      setEntries(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Delete failed');
    }
  };

  const getTypeBadge = (t?: string) => {
    const colors: Record<string, string> = {
      data: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      report: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      literature: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
      other: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700',
    };
    const label = t === 'data' ? 'Data' : t === 'report' ? 'Report' : t === 'literature' ? 'Literature' : 'Other';
    return <span className={`inline-block px-2 py-0.5 rounded text-xs border ${colors[t ?? 'other']}`}>{label}</span>;
  };

  const inputCls = "block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
  const labelCls = "text-sm font-medium text-slate-600 dark:text-slate-400";

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Workbench</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter password to access.</p>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mb-3"
            autoFocus
          />
          {pwdError && <p className="text-red-500 text-xs mb-3">Incorrect password.</p>}
          <button onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Workbench</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Internal team workspace — upload and track work progress files.
      </p>

      {/* Upload form */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Upload New Entry</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="block">
            <span className={labelCls}>Name <span className="text-red-400">*</span></span>
            <input type="text" value={personName} onChange={e => setPersonName(e.target.value)}
              placeholder="e.g., A同学" className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className={labelCls}>Type</span>
            <select value={fileType} onChange={e => setFileType(e.target.value)} className={`${inputCls} mt-1`}>
              <option value="data">Data</option>
              <option value="report">Report</option>
              <option value="literature">Literature</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>File</span>
            <input ref={fileRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className={`${inputCls} mt-1 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300`} />
          </label>
          <label className="block">
            <span className={labelCls}>Description</span>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Updated assembly data v2" className={`${inputCls} mt-1`} />
          </label>
        </div>
        <button onClick={handleUpload} disabled={uploading || !personName.trim()}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Progress table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Person</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">File / Folder</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Description</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Time</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Download</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No entries yet.</td></tr>
            ) : (
              entries.map(e => (
                <tr key={e.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{e.person_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.file_name}</td>
                  <td className="px-4 py-3">{getTypeBadge(e.file_type)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate">{e.description ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{e.created_at ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {e.file_path ? (
                      <a href={e.file_path} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                        Download
                      </a>
                    ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteClick(e)}
                      className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">警告</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              该操作将会从工作台中删除此条目，是否确认？
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
              {deleteTarget.person_name} · {deleteTarget.file_name} · ID: {deleteTarget.id}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
