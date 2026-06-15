import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, DrivingForce, AssemblyDriveMethod, SearchResult } from '../types';
import { useLang } from '../context/LanguageContext';

export default function SearchPage() {
  const { tr } = useLang();

  const [bbList, setBbList] = useState<BuildingBlock[]>([]);
  const [morphList, setMorphList] = useState<Morphology[]>([]);
  const [dfList, setDfList] = useState<DrivingForce[]>([]);
  const [dmList, setDmList] = useState<AssemblyDriveMethod[]>([]);

  // Primary filters
  const [name, setName] = useState('');
  const [appFilter, setAppFilter] = useState(''); // '' | 'cosmetic' | 'drug' | 'food'
  const [buildingBlock, setBuildingBlock] = useState('');
  const [assemblyType, setAssemblyType] = useState('');

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [morphology, setMorphology] = useState('');
  const [drivingForce, setDrivingForce] = useState('');
  const [assemblyDriveMethod, setAssemblyDriveMethod] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  // Restore scroll position after navigating back
  useEffect(() => {
    if (!loading && result) {
      const saved = sessionStorage.getItem('search_scroll');
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, Number(saved));
          sessionStorage.removeItem('search_scroll');
        });
      }
    }
  }, [loading, result]);

  useEffect(() => {
    api.getBuildingBlockList().then(setBbList);
    api.getMorphologyList().then(setMorphList);
    api.getDrivingForceList().then(setDfList);
    api.getAssemblyDriveMethodList().then(setDmList);
  }, []);

  const doSearch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const r = await api.search({
        name: name || undefined,
        building_block: buildingBlock || undefined,
        morphology: morphology || undefined,
        driving_force: drivingForce || undefined,
        assembly_type: assemblyType || undefined,
        assembly_drive_method: assemblyDriveMethod || undefined,
        is_cosmetic: appFilter === 'cosmetic' ? true : undefined,
        is_drug: appFilter === 'drug' ? true : undefined,
        is_food: appFilter === 'food' ? true : undefined,
        size_min: sizeMin ? Number(sizeMin) : undefined,
        size_max: sizeMax ? Number(sizeMax) : undefined,
        page: pageNum,
        page_size: 20,
      });
      setResult(r);
      setSearchParams({ page: String(pageNum) });
    } finally {
      setLoading(false);
    }
  }, [name, buildingBlock, morphology, drivingForce, assemblyType, assemblyDriveMethod, appFilter, sizeMin, sizeMax]);

  const initialPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
  useEffect(() => { doSearch(initialPage); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = result ? Math.ceil(result.total / result.page_size) : 0;

  const catLabel = (a: { is_cosmetic: boolean; is_drug: boolean; is_food: boolean }) => {
    const parts = [];
    if (a.is_food) parts.push(tr('categoryFood'));
    if (a.is_cosmetic) parts.push(tr('categoryCosmetic'));
    if (a.is_drug) parts.push(tr('categoryDrug'));
    if (parts.length === 0) return null;
    return parts.join(' · ');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        {tr('searchTitle')}
      </h1>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        {/* Primary row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={tr('assemblyName')}
            className="flex-1 min-w-[200px] rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={buildingBlock}
            onChange={e => setBuildingBlock(e.target.value)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{tr('allBuildingBlocks')}</option>
            {bbList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select
            value={assemblyType}
            onChange={e => setAssemblyType(e.target.value)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{tr('assemblyTypeCol')}</option>
            {['水凝胶','纳米粒','纳米纤维','纳米胶束','纳米凝胶','超分子聚集体','纳米乳','脂质体'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => doSearch(1)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? tr('searching') : tr('searchBtn')}
          </button>
        </div>

        {/* Application filter tabs */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setAppFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === '' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
          >
            {tr('filterAll')}
          </button>
          <button
            onClick={() => setAppFilter(appFilter === 'food' ? '' : 'food')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'food' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}
          >
            {tr('isFoodLabel')}
          </button>
          <button
            onClick={() => setAppFilter(appFilter === 'cosmetic' ? '' : 'cosmetic')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'cosmetic' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-pink-400'}`}
          >
            {tr('isCosmeticLabel')}
          </button>
          <button
            onClick={() => setAppFilter(appFilter === 'drug' ? '' : 'drug')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'drug' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-amber-400'}`}
          >
            {tr('isDrugLabel')}
          </button>
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAdvanced ? '−' : '+'} {tr('advancedFilters')}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('morphology')}</span>
              <select value={morphology} onChange={e => setMorphology(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">{tr('allMorphologies')}</option>
                {morphList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('drivingForce')}</span>
              <select value={drivingForce} onChange={e => setDrivingForce(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">{tr('allDrivingForces')}</option>
                {dfList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('assemblyDriveMethod')}</span>
              <select value={assemblyDriveMethod} onChange={e => setAssemblyDriveMethod(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">全部</option>
                {dmList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('sizeMin')}</span>
              <input type="number" value={sizeMin} onChange={e => setSizeMin(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('sizeMax')}</span>
              <input type="number" value={sizeMax} onChange={e => setSizeMax(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </label>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results - Card Grid */}
      {result && !loading && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {tr('foundResults', { total: result.total })}
            {totalPages > 1 && ` · ${tr('pageOf', { page: result.page, total: totalPages })}`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {result.results.map(a => (
              <Link
                key={a.id}
                to={`/assembly/${a.id}`}
                onClick={() => sessionStorage.setItem('search_scroll', String(window.scrollY))}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
              >
                {/* Compound Image */}
                <div className="aspect-square bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
                  {a.compound_image ? (
                    <img
                      src={a.compound_image} alt={a.name}
                      className="max-w-full max-h-full object-contain"
                      onClick={e => { e.preventDefault(); setLightbox({ src: a.compound_image!, alt: a.name }); }}
                    />
                  ) : a.smiles ? (
                    <img
                      src={`/api/structure-image/${a.id}`}
                      alt={a.name}
                      className="max-w-full max-h-full object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onClick={e => { e.preventDefault(); setLightbox({ src: `/api/structure-image/${a.id}`, alt: a.name }); }}
                    />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-4xl">—</span>
                  )}
                  {/* Application badge */}
                  {catLabel(a) && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {catLabel(a)}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {a.name}
                  </h3>
                  {a.english_name && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate italic mt-0.5">{a.english_name}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.building_block && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {a.building_block.name}
                      </span>
                    )}
                    {a.assembly_type && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        {a.assembly_type}
                      </span>
                    )}
                    {a.assembly_drive_method && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                        {a.assembly_drive_method.name}
                      </span>
                    )}
                  </div>
                  {a.driving_forces.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {a.driving_forces.map(df => (
                        <span key={df.id} className="px-1 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                          {df.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {result.results.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">{tr('noResults')}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">{tr('noResultsHint')}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => doSearch(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.src} alt={lightbox.alt}
            className="max-w-full max-h-full object-contain bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
