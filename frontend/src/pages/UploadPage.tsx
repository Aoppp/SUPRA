import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, DrivingForce, Property, AssemblyDriveMethod, AssemblyListItem } from '../types';
import Toast from '../components/Toast';
const ADMIN_PASSWORD = 'Chaofenzi';

type FormData = Record<string, string | boolean>;

function makeForm(): FormData {
  return {
    name: '',
    english_name: '',
    compound_image: '',
    smiles: '',
    cas_number: '',
    assembly_type: '',
    particle_size: '',
    aqueous_phase: '',
    organic_phase: '',
    solute: '',
    concentration: '',
    component_ratio: '',
    preparation_method: '',
    size_nm_min: '',
    size_nm_max: '',
    size_note: '',
    size_source: '',
    doi: '',
    biological_activity: '',
    assembly_temperature: '',
    temperature_note: '',
    ph_value: '',
    ph_note: '',
    stirring_condition: '',
    assembly_time: '',
    molecular_characteristics: '',
    notes: '',
    cosmetic_note: '',
    drug_note: '',
    food_note: '',
    food_category: '',
    food_daily_intake: '',
    regulations: '',
    component_count: '',
    responsiveness: '',
    surface_modification: '',
    url: '',
    building_block_id: '',
    morphology_id: '',
    assembly_drive_method_id: '',
  };
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  const cls = "block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4";
  return <label className={span ? `${cls} md:col-span-2` : cls}>{label}{children}</label>;
}

const inputCls = "mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

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
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

  // --- Reference data ---
  const [bbList, setBbList] = useState<BuildingBlock[]>([]);
  const [morphList, setMorphList] = useState<Morphology[]>([]);
  const [dfList, setDfList] = useState<DrivingForce[]>([]);
  const [propList, setPropList] = useState<Property[]>([]);
  const [driveList, setDriveList] = useState<AssemblyDriveMethod[]>([]);
  // --- Single upload ---
  const [form, setForm] = useState<FormData>(makeForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFood, setIsFood] = useState(false);
  const [isDrug, setIsDrug] = useState(false);
  const [isCosmetic, setIsCosmetic] = useState(false);
  const [selDf, setSelDf] = useState<number[]>([]);
  const [selProps, setSelProps] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // --- Sections toggle ---
  const [showMolecular, setShowMolecular] = useState(true);
  const [showApp, setShowApp] = useState(true);
  const [showAssembly, setShowAssembly] = useState(true);
  const [showSolvent, setShowSolvent] = useState(false);
  const [showPhysical, setShowPhysical] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showOther, setShowOther] = useState(false);

  // --- Batch upload ---
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ created: number; errors: { row: number; error: string }[]; total_rows: number } | null>(null);

  useEffect(() => {
    api.getBuildingBlockList().then(setBbList);
    api.getMorphologyList().then(setMorphList);
    api.getDrivingForceList().then(setDfList);
    api.getPropertyList().then(setPropList);
    api.getAssemblyDriveMethodList().then(setDriveList);
  }, []);

  const upd = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!(form.name as string).trim()) return;
    setSubmitting(true);
    try {
      // Upload image file first if selected
      let imagePath = (form.compound_image as string) || undefined;
      if (imageFile) {
        const res = await api.uploadImage(imageFile);
        imagePath = res.path;
      }

      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(form)) {
        if (k === 'compound_image') continue; // handled above
        if (v === '' || v === undefined || v === null) continue;
        if (['size_nm_min', 'size_nm_max', 'building_block_id', 'morphology_id', 'assembly_drive_method_id'].includes(k)) {
          payload[k] = Number(v);
        } else {
          payload[k] = v;
        }
      }
      payload.compound_image = imagePath;
      payload.is_food = isFood;
      payload.is_drug = isDrug;
      payload.is_cosmetic = isCosmetic;
      if (selDf.length > 0) payload.driving_force_ids = selDf;
      if (selProps.length > 0) payload.property_ids = selProps;

      await api.createAssembly(payload);
      setSuccess('Assembly created successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create assembly.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete section ---
  const [deleteCas, setDeleteCas] = useState('');
  const [searchResults, setSearchResults] = useState<AssemblyListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssemblyListItem | null>(null);

  const handleBatchUpload = async () => {
    if (!batchFile) return;
    setBatchUploading(true);
    setBatchResult(null);
    try {
      const result = await api.batchUploadAssemblies(batchFile);
      setBatchResult(result);
      setBatchFile(null);
      const input = document.getElementById('batch-file-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setBatchResult({ created: 0, errors: [{ row: 0, error: msg }], total_rows: 0 });
    } finally {
      setBatchUploading(false);
    }
  };

  const handleCasSearch = async () => {
    if (!deleteCas.trim()) return;
    setSearching(true);
    setSearched(true);
    setDeleteTarget(null);
    try {
      const results = await api.searchByCas(deleteCas.trim());
      setSearchResults(results);
    } catch {
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteClick = (item: AssemblyListItem) => {
    setDeleteTarget(item);
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteAssembly(deleteTarget.id);
      setSearchResults(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: `"${deleteTarget.name}" deleted`, type: 'success' });
    } catch {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const SectionTitle = ({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-200 py-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
      <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
      {title}
    </button>
  );

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
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          onClick={() => { setTab('delete'); setDeleteTarget(null); setSearched(false); setSearchResults([]); }}
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
          {!success && (
            <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
              <button
                onClick={() => { setUploadMode('single'); setBatchResult(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'single'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                单次上传
              </button>
              <button
                onClick={() => { setUploadMode('batch'); setSuccess(''); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'batch'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                批量上传
              </button>
            </div>
          )}

          {batchResult && (
            <div className={`rounded-lg p-4 text-sm mb-4 ${
              batchResult.errors.length > 0
                ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            }`}>
              <p className="font-medium">批量导入完成</p>
              <p>总行数: {batchResult.total_rows} · 成功: {batchResult.created} · 失败: {batchResult.errors.length}</p>
              {batchResult.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs space-y-0.5">
                  {batchResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>第 {e.row} 行: {e.error}</li>
                  ))}
                  {batchResult.errors.length > 10 && <li>... 还有 {batchResult.errors.length - 10} 条错误</li>}
                </ul>
              )}
              <button onClick={() => setBatchResult(null)} className="mt-2 text-xs underline hover:no-underline">
                关闭
              </button>
            </div>
          )}

          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg p-4 text-sm">
              {success}
            </div>
          ) : uploadMode === 'batch' ? (
            /* === Batch Upload Form === */
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">批量上传 Excel</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                上传 .xlsx 文件，前3行为合并表头，第4行起为数据。支持嵌入图片自动提取。
              </p>

              <details className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">支持的表头字段 (点击展开)</summary>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded grid grid-cols-2 gap-x-4 gap-y-1">
                  <span><b>name</b> (必填)</span> <span>组装体名称</span>
                  <span>english_name</span> <span>英文名</span>
                  <span>compound_image</span> <span>图片路径或嵌入图片</span>
                  <span>smiles</span> <span>SMILES</span>
                  <span>cas_number</span> <span>CAS号</span>
                  <span>assembly_type</span> <span>组装体类型</span>
                  <span>particle_size</span> <span>粒径</span>
                  <span>aqueous_phase</span> <span>水相</span>
                  <span>organic_phase</span> <span>有机相</span>
                  <span>solute</span> <span>溶质</span>
                  <span>concentration</span> <span>浓度</span>
                  <span>component_ratio</span> <span>组分比例</span>
                  <span>preparation_method</span> <span>制备方法</span>
                  <span>size_nm_min</span> <span>最小尺寸</span>
                  <span>size_nm_max</span> <span>最大尺寸</span>
                  <span>size_note</span> <span>尺寸备注</span>
                  <span>size_source</span> <span>尺寸来源</span>
                  <span>doi</span> <span>DOI</span>
                  <span>biological_activity</span> <span>生物活性</span>
                  <span>assembly_temperature</span> <span>组装温度</span>
                  <span>temperature_note</span> <span>温度备注</span>
                  <span>ph_value</span> <span>pH值</span>
                  <span>ph_note</span> <span>pH备注</span>
                  <span>stirring_condition</span> <span>搅拌条件</span>
                  <span>assembly_time</span> <span>组装时间</span>
                  <span>molecular_characteristics</span> <span>分子特征</span>
                  <span>notes</span> <span>备注</span>
                  <span>is_cosmetic</span> <span>化妆品 (是/否)</span>
                  <span>cosmetic_note</span> <span>化妆品备注</span>
                  <span>is_drug</span> <span>药品 (是/否)</span>
                  <span>drug_note</span> <span>药品备注</span>
                  <span>is_food</span> <span>食品 (是/否)</span>
                  <span>food_note</span> <span>食品备注</span>
                  <span>food_category</span> <span>食品类别</span>
                  <span>food_daily_intake</span> <span>每日摄入量</span>
                  <span>regulations</span> <span>法规</span>
                  <span>component_count</span> <span>组分数</span>
                  <span>responsiveness</span> <span>响应性</span>
                  <span>surface_modification</span> <span>表面修饰</span>
                  <span>url</span> <span>外部链接</span>
                  <span>building_block</span> <span>化合物类型 (名称)</span>
                  <span>morphology</span> <span>形貌 (名称)</span>
                  <span>assembly_drive_method</span> <span>驱动方式 (名称)</span>
                  <span>driving_forces</span> <span>驱动力 (分号分隔)</span>
                  <span>properties</span> <span>性质 (分号分隔)</span>
                </div>
              </details>

              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Excel 文件 (.xlsx)</span>
                <input
                  id="batch-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => { setBatchFile(e.target.files?.[0] ?? null); setBatchResult(null); }}
                  className={`${inputCls} mt-1 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300`}
                />
              </label>

              <button
                onClick={handleBatchUpload}
                disabled={batchUploading || !batchFile}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {batchUploading ? '导入中...' : '开始批量导入'}
              </button>
            </div>
          ) : (
            /* === Single Upload Form === */
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">

              {/* 1. 基本信息 */}
              <div>
                <SectionTitle title="基本信息" expanded={true} onToggle={() => {}} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                  <Field label="组装体名称 *">
                    <input type="text" value={form.name as string} onChange={e => upd('name', e.target.value)}
                      placeholder="e.g., Gallic Acid hydrogel" className={inputCls} />
                  </Field>
                  <Field label="英文名称">
                    <input type="text" value={form.english_name as string} onChange={e => upd('english_name', e.target.value)}
                      placeholder="English name" className={inputCls} />
                  </Field>
                  <Field label="化合物图片 (文件上传)">
                    <input type="file" accept="image/*"
                      onChange={e => { setImageFile(e.target.files?.[0] ?? null); }}
                      className={`${inputCls} file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300`} />
                  </Field>
                  <Field label="或图片 URL">
                    <input type="text" value={form.compound_image as string} onChange={e => upd('compound_image', e.target.value)}
                      placeholder="https://..." className={inputCls} />
                  </Field>
                  <Field label="CAS 号">
                    <input type="text" value={form.cas_number as string} onChange={e => upd('cas_number', e.target.value)}
                      placeholder="e.g., 149-91-7" className={inputCls} />
                  </Field>
                  <Field label="SMILES">
                    <input type="text" value={form.smiles as string} onChange={e => upd('smiles', e.target.value)}
                      placeholder="C1=CC=C..." className={inputCls} />
                  </Field>
                  <Field label="化合物类型 (Building Block)">
                    <select value={form.building_block_id as string} onChange={e => upd('building_block_id', e.target.value)} className={inputCls}>
                      <option value="">—</option>
                      {bbList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label="外部链接 URL">
                    <input type="text" value={form.url as string} onChange={e => upd('url', e.target.value)}
                      placeholder="https://..." className={inputCls} />
                  </Field>
                </div>
              </div>

              {/* 2. 分子信息 */}
              <div>
                <SectionTitle title="分子信息" expanded={showMolecular} onToggle={() => setShowMolecular(!showMolecular)} />
                {showMolecular && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="分子特征参数" span>
                      <textarea value={form.molecular_characteristics as string} onChange={e => upd('molecular_characteristics', e.target.value)}
                        rows={3} placeholder="分子量、logP、氢键供体/受体数等..." className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              {/* 3. 应用分类 */}
              <div>
                <SectionTitle title="应用分类" expanded={showApp} onToggle={() => setShowApp(!showApp)} />
                {showApp && (
                  <div className="space-y-3 mt-2">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input type="checkbox" checked={isFood} onChange={e => setIsFood(e.target.checked)}
                          className="rounded border-slate-300" /> 食品
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input type="checkbox" checked={isDrug} onChange={e => setIsDrug(e.target.checked)}
                          className="rounded border-slate-300" /> 药品
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input type="checkbox" checked={isCosmetic} onChange={e => setIsCosmetic(e.target.checked)}
                          className="rounded border-slate-300" /> 化妆品
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      {isFood && (
                        <>
                          <Field label="食品备注">
                            <input type="text" value={form.food_note as string} onChange={e => upd('food_note', e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="食品类别">
                            <input type="text" value={form.food_category as string} onChange={e => upd('food_category', e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="每日摄入量">
                            <input type="text" value={form.food_daily_intake as string} onChange={e => upd('food_daily_intake', e.target.value)} className={inputCls} />
                          </Field>
                        </>
                      )}
                      {isDrug && (
                        <Field label="药品备注">
                          <input type="text" value={form.drug_note as string} onChange={e => upd('drug_note', e.target.value)} className={inputCls} />
                        </Field>
                      )}
                      {isCosmetic && (
                        <Field label="化妆品备注">
                          <input type="text" value={form.cosmetic_note as string} onChange={e => upd('cosmetic_note', e.target.value)} className={inputCls} />
                        </Field>
                      )}
                      <Field label="法规信息" span>
                        <textarea value={form.regulations as string} onChange={e => upd('regulations', e.target.value)}
                          rows={2} className={inputCls} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. 组装参数 */}
              <div>
                <SectionTitle title="组装参数" expanded={showAssembly} onToggle={() => setShowAssembly(!showAssembly)} />
                {showAssembly && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="驱动方式">
                      <select value={form.assembly_drive_method_id as string} onChange={e => upd('assembly_drive_method_id', e.target.value)} className={inputCls}>
                        <option value="">—</option>
                        {driveList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </Field>
                    <Field label="组装体类型">
                      <input type="text" value={form.assembly_type as string} onChange={e => upd('assembly_type', e.target.value)}
                        placeholder="e.g., Self-assembly; Hydrogel" className={inputCls} />
                    </Field>
                    <Field label="组分数">
                      <input type="text" value={form.component_count as string} onChange={e => upd('component_count', e.target.value)}
                        placeholder="e.g., 2" className={inputCls} />
                    </Field>
                    <Field label="形貌">
                      <select value={form.morphology_id as string} onChange={e => upd('morphology_id', e.target.value)} className={inputCls}>
                        <option value="">—</option>
                        {morphList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </Field>
                    <Field label="响应性">
                      <input type="text" value={form.responsiveness as string} onChange={e => upd('responsiveness', e.target.value)}
                        placeholder="e.g., pH-responsive" className={inputCls} />
                    </Field>
                    <Field label="表面修饰">
                      <input type="text" value={form.surface_modification as string} onChange={e => upd('surface_modification', e.target.value)}
                        placeholder="e.g., PEGylation" className={inputCls} />
                    </Field>
                    <Field label="驱动力 (多选)" span>
                      <div className="mt-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-md">
                        {dfList.map(df => (
                          <label key={df.id} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                            <input type="checkbox" checked={selDf.includes(df.id)}
                              onChange={() => setSelDf(prev => prev.includes(df.id) ? prev.filter(id => id !== df.id) : [...prev, df.id])}
                              className="rounded" /> {df.name}
                          </label>
                        ))}
                      </div>
                    </Field>
                    <Field label="性质 (多选)" span>
                      <div className="mt-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-md">
                        {propList.map(p => (
                          <label key={p.id} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                            <input type="checkbox" checked={selProps.includes(p.id)}
                              onChange={() => setSelProps(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                              className="rounded" /> {p.name}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}
              </div>

              {/* 5. 溶剂体系 */}
              <div>
                <SectionTitle title="溶剂体系" expanded={showSolvent} onToggle={() => setShowSolvent(!showSolvent)} />
                {showSolvent && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="水相">
                      <input type="text" value={form.aqueous_phase as string} onChange={e => upd('aqueous_phase', e.target.value)}
                        placeholder="e.g., Ultrapure water" className={inputCls} />
                    </Field>
                    <Field label="有机相">
                      <input type="text" value={form.organic_phase as string} onChange={e => upd('organic_phase', e.target.value)}
                        placeholder="e.g., Ethanol" className={inputCls} />
                    </Field>
                    <Field label="溶质">
                      <input type="text" value={form.solute as string} onChange={e => upd('solute', e.target.value)}
                        placeholder="Solute" className={inputCls} />
                    </Field>
                    <Field label="浓度">
                      <input type="text" value={form.concentration as string} onChange={e => upd('concentration', e.target.value)}
                        placeholder="e.g., 40 mg/mL" className={inputCls} />
                    </Field>
                    <Field label="组分比例">
                      <input type="text" value={form.component_ratio as string} onChange={e => upd('component_ratio', e.target.value)}
                        placeholder="e.g., 1:1" className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              {/* 6. 物理性质 */}
              <div>
                <SectionTitle title="物理性质" expanded={showPhysical} onToggle={() => setShowPhysical(!showPhysical)} />
                {showPhysical && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="粒径">
                      <input type="text" value={form.particle_size as string} onChange={e => upd('particle_size', e.target.value)}
                        placeholder="e.g., ~1 μm" className={inputCls} />
                    </Field>
                    <Field label="最小尺寸 (nm)">
                      <input type="number" value={form.size_nm_min as string} onChange={e => upd('size_nm_min', e.target.value)}
                        className={inputCls} />
                    </Field>
                    <Field label="最大尺寸 (nm)">
                      <input type="number" value={form.size_nm_max as string} onChange={e => upd('size_nm_max', e.target.value)}
                        className={inputCls} />
                    </Field>
                    <Field label="尺寸备注">
                      <input type="text" value={form.size_note as string} onChange={e => upd('size_note', e.target.value)}
                        className={inputCls} />
                    </Field>
                    <Field label="尺寸来源">
                      <input type="text" value={form.size_source as string} onChange={e => upd('size_source', e.target.value)}
                        placeholder="e.g., DLS, TEM" className={inputCls} />
                    </Field>
                    <Field label="组装温度">
                      <input type="text" value={form.assembly_temperature as string} onChange={e => upd('assembly_temperature', e.target.value)}
                        placeholder="e.g., 25°C" className={inputCls} />
                    </Field>
                    <Field label="温度备注">
                      <input type="text" value={form.temperature_note as string} onChange={e => upd('temperature_note', e.target.value)}
                        className={inputCls} />
                    </Field>
                    <Field label="pH 值">
                      <input type="text" value={form.ph_value as string} onChange={e => upd('ph_value', e.target.value)}
                        placeholder="e.g., 7.4" className={inputCls} />
                    </Field>
                    <Field label="pH 备注">
                      <input type="text" value={form.ph_note as string} onChange={e => upd('ph_note', e.target.value)}
                        className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              {/* 7. 生物活性 */}
              <div>
                <SectionTitle title="生物活性与方法" expanded={showBio} onToggle={() => setShowBio(!showBio)} />
                {showBio && (
                  <div className="space-y-4 mt-2">
                    <Field label="生物活性" span>
                      <textarea value={form.biological_activity as string} onChange={e => upd('biological_activity', e.target.value)}
                        rows={4} className={inputCls} />
                    </Field>
                    <Field label="制备方法" span>
                      <textarea value={form.preparation_method as string} onChange={e => upd('preparation_method', e.target.value)}
                        rows={3} className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              {/* 8. 其他信息 */}
              <div>
                <SectionTitle title="其他信息" expanded={showOther} onToggle={() => setShowOther(!showOther)} />
                {showOther && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="搅拌条件">
                      <input type="text" value={form.stirring_condition as string} onChange={e => upd('stirring_condition', e.target.value)}
                        placeholder="e.g., 500 rpm" className={inputCls} />
                    </Field>
                    <Field label="组装时间">
                      <input type="text" value={form.assembly_time as string} onChange={e => upd('assembly_time', e.target.value)}
                        placeholder="e.g., 24 h" className={inputCls} />
                    </Field>
                    <Field label="DOI">
                      <input type="text" value={form.doi as string} onChange={e => upd('doi', e.target.value)}
                        placeholder="10.1002/adhm.202102476" className={inputCls} />
                    </Field>
                    <Field label="备注" span>
                      <textarea value={form.notes as string} onChange={e => upd('notes', e.target.value)}
                        rows={3} className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              <button onClick={handleSubmit} disabled={submitting || !(form.name as string).trim()}
                className="w-full mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer">
                {submitting ? '提交中...' : '提交'}
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
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searched && (
            <div>
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">未找到匹配条目。</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(r => (
                    <div key={r.id}
                      className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-md px-4 py-3">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs ml-3">CAS: {r.cas_number ?? '—'}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">ID: {r.id}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(r)}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">警告</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              该操作将会从数据库中删除数据（后续如果继续使用则需要重新上传），是否确认？
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
              {deleteTarget.name} · CAS: {deleteTarget.cas_number ?? '—'} · ID: {deleteTarget.id}
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
      {toast && <Toast message={toast.message} type={toast.type} onDone={clearToast} />}
    </div>
  );
}
