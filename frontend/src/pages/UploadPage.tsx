import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, CharacterizationMethod } from '../types';
import { useLang } from '../i18n/LanguageContext';

export default function UploadPage() {
  const { tr } = useLang();
  const navigate = useNavigate();

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

  const inputCls = "mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200";
  const labelCls = "block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Upload New Assembly
      </h1>

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
    </div>
  );
}
