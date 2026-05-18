import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, AssemblyListItem } from '../types';
const ADMIN_PASSWORD = 'Chaofenzi';

export default function UploadPage() {
  const navigate = useNavigate();

  // --- Password gate ---
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin-auth') === '1');
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);

  const handleLogin = () => {
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin-auth', '1');
      setAuthed(true);
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  };

  // --- Tabs ---
  const [tab, setTab] = useState<'upload' | 'delete'>('upload');

  // --- Upload form ---
  const [bbList, setBbList] = useState<BuildingBlock[]>([]);
  const [morphList, setMorphList] = useState<Morphology[]>([]);

  const [name, setName] = useState('');
  const [compoundImage, setCompoundImage] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [assemblyType, setAssemblyType] = useState('');
  const [particleSize, setParticleSize] = useState('');
  const [solvent, setSolvent] = useState('');
  const [concentration, setConcentration] = useState('');
  const [preparationMethod, setPreparationMethod] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');
  const [doi, setDoi] = useState('');
  const [description, setDescription] = useState('');
  const [buildingBlockId, setBuildingBlockId] = useState('');
  const [morphologyId, setMorphologyId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getBuildingBlockList().then(setBbList);
    api.getMorphologyList().then(setMorphList);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.createAssembly({
        name,
        compound_image: compoundImage || undefined,
        cas_number: casNumber || undefined,
        assembly_type: assemblyType || undefined,
        particle_size: particleSize || undefined,
        solvent: solvent || undefined,
        concentration: concentration || undefined,
        preparation_method: preparationMethod || undefined,
        size_nm_min: sizeMin ? Number(sizeMin) : undefined,
        size_nm_max: sizeMax ? Number(sizeMax) : undefined,
        doi: doi || undefined,
        description: description || undefined,
        building_block_id: buildingBlockId ? Number(buildingBlockId) : undefined,
        morphology_id: morphologyId ? Number(morphologyId) : undefined,
      });
      setSuccess('Assembly created successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      alert('Failed to create assembly.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete section ---
  const [deleteCas, setDeleteCas] = useState('');
  const [searchResults, setSearchResults] = useState<AssemblyListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [showFinalDialog, setShowFinalDialog] = useState(false);

  const handleCasSearch = async () => {
    if (!deleteCas.trim()) return;
    setSearching(true);
    setSearched(true);
    setConfirmId(null);
    try {
      const results = await api.searchByCas(deleteCas.trim());
      setSearchResults(results);
    } catch {
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    if (confirmId === id) {
      setShowFinalDialog(true);
    } else {
      setConfirmId(id);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmId === null) return;
    try {
      await api.deleteAssembly(confirmId);
      setSearchResults(prev => prev.filter(r => r.id !== confirmId));
      setConfirmId(null);
      setShowFinalDialog(false);
    } catch {
      alert('Delete failed');
    }
  };

  const inputCls = "mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200";
  const labelCls = "block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4";

  // --- Password gate ---
  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">管理</h1>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">管理</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('upload')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'upload'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          上传
        </button>
        <button
          onClick={() => { setTab('delete'); setConfirmId(null); setSearched(false); setSearchResults([]); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'delete'
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          删除
        </button>
      </div>

      {/* === Upload Tab === */}
      {tab === 'upload' && (
        <>
          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg p-4 text-sm">
              {success}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={labelCls}>
                  Assembly Name <span className="text-red-400">*</span>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g., Gallic Acid hydrogel" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Compound Image URL
                  <input type="text" value={compoundImage} onChange={e => setCompoundImage(e.target.value)}
                    placeholder="https://..." className={inputCls} />
                </label>
                <label className={labelCls}>
                  CAS Number
                  <input type="text" value={casNumber} onChange={e => setCasNumber(e.target.value)}
                    placeholder="e.g., 149-91-7" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Assembly Type
                  <input type="text" value={assemblyType} onChange={e => setAssemblyType(e.target.value)}
                    placeholder="e.g., Self-assembly; Hydrogel" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Particle Size
                  <input type="text" value={particleSize} onChange={e => setParticleSize(e.target.value)}
                    placeholder="e.g., ~1 μm (fiber diameter)" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Solvent
                  <input type="text" value={solvent} onChange={e => setSolvent(e.target.value)}
                    placeholder="e.g., Ultrapure water" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Concentration
                  <input type="text" value={concentration} onChange={e => setConcentration(e.target.value)}
                    placeholder="e.g., 40 mg/mL" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Size Min (nm)
                  <input type="number" value={sizeMin} onChange={e => setSizeMin(e.target.value)}
                    placeholder="e.g., 10" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Size Max (nm)
                  <input type="number" value={sizeMax} onChange={e => setSizeMax(e.target.value)}
                    placeholder="e.g., 200" className={inputCls} />
                </label>
                <label className={labelCls}>
                  DOI
                  <input type="text" value={doi} onChange={e => setDoi(e.target.value)}
                    placeholder="10.1002/adhm.202102476" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Building Block
                  <select value={buildingBlockId} onChange={e => setBuildingBlockId(e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {bbList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label className={labelCls}>
                  Morphology
                  <select value={morphologyId} onChange={e => setMorphologyId(e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {morphList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </label>
              </div>
              <label className={`${labelCls} mt-2`}>
                Preparation Method
                <textarea value={preparationMethod} onChange={e => setPreparationMethod(e.target.value)}
                  rows={3} placeholder="Step-by-step preparation procedure..." className={inputCls} />
              </label>
              <label className={`${labelCls} mt-2`}>
                Description
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} placeholder="Brief description of the assembly..." className={inputCls} />
              </label>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          )}
        </>
      )}

      {/* === Delete Tab === */}
      {tab === 'delete' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">按 CAS 号删除</h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={deleteCas}
              onChange={e => setDeleteCas(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCasSearch()}
              placeholder="CAS Number (e.g., 149-91-7)"
              className={`${inputCls} mt-0 flex-1`}
            />
            <button onClick={handleCasSearch} disabled={searching || !deleteCas.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searched && (
            <div>
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">未找到匹配条目。</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    找到 {searchResults.length} 条结果，点击"确认删除"两次以删除。
                  </p>
                  {searchResults.map(r => (
                    <div key={r.id}
                      className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-md px-4 py-3">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs ml-3">CAS: {r.cas_number ?? '—'}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">ID: {r.id}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(r.id)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          confirmId === r.id
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        {confirmId === r.id ? '确认删除' : '删除'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Final confirmation dialog */}
      {showFinalDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">二次确认</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              确定要删除此条目吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowFinalDialog(false); setConfirmId(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
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
