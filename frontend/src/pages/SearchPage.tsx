import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, DrivingForce, AssemblyDriveMethod, CompoundGroupResult, CompoundTypeCount } from '../types';
import { useLang } from '../context/LanguageContext';
import CompoundCard from '../components/CompoundCard';

const SEARCH_CACHE_KEY = 'search_cache_v2';

export default function SearchPage() {
  const { tr } = useLang();

  const [bbList, setBbList] = useState<BuildingBlock[]>([]);
  const [morphList, setMorphList] = useState<Morphology[]>([]);
  const [dfList, setDfList] = useState<DrivingForce[]>([]);
  const [dmList, setDmList] = useState<AssemblyDriveMethod[]>([]);
  const [compoundTypes, setCompoundTypes] = useState<CompoundTypeCount[]>([]);

  // Try restore cached state on mount
  const cached = (() => {
    try { return JSON.parse(sessionStorage.getItem(SEARCH_CACHE_KEY) || 'null'); } catch { return null; }
  })();

  const [searchParams, setSearchParams] = useSearchParams();
  const cachedPage = Number(searchParams.get('page')) || (cached?.page || 1);
  const page = cachedPage;

  const [name, setName] = useState(() => searchParams.get('name') || cached?.name || '');
  const [compoundType, setCompoundType] = useState(cached?.compoundType || '');
  const [appFilter, setAppFilter] = useState(cached?.appFilter || '');
  const [buildingBlock, setBuildingBlock] = useState(cached?.buildingBlock || '');
  const [assemblyType, setAssemblyType] = useState(cached?.assemblyType || '');

  const [showAdvanced, setShowAdvanced] = useState(cached?.showAdvanced || false);
  const [morphology, setMorphology] = useState(cached?.morphology || '');
  const [drivingForce, setDrivingForce] = useState(cached?.drivingForce || '');
  const [assemblyDriveMethod, setAssemblyDriveMethod] = useState(cached?.assemblyDriveMethod || '');
  const [sizeMin, setSizeMin] = useState(cached?.sizeMin || '');
  const [sizeMax, setSizeMax] = useState(cached?.sizeMax || '');

  const [result, setResult] = useState<CompoundGroupResult | null>(cached?.result || null);
  const [loading, setLoading] = useState(!cached?.result);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const restoredRef = useRef(false);

  useLayoutEffect(() => {
    if (!restoredRef.current) {
      restoredRef.current = true;
      const saved = sessionStorage.getItem('search_scroll');
      if (saved) {
        window.scrollTo({ top: Number(saved), behavior: 'instant' });
        sessionStorage.removeItem('search_scroll');
      }
    }
  });

  useEffect(() => {
    api.getBuildingBlockList().then(setBbList);
    api.getMorphologyList().then(setMorphList);
    api.getDrivingForceList().then(setDfList);
    api.getAssemblyDriveMethodList().then(setDmList);
    api.getCompoundTypes().then(setCompoundTypes);
  }, []);

  const doSearch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const r = await api.searchCompounds({
        name: name || undefined,
        compound_type: compoundType || undefined,
        assembly_type: assemblyType || undefined,
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
  }, [name, compoundType, assemblyType, appFilter, sizeMin, sizeMax, setSearchParams]);

  const initialPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;

  useEffect(() => {
    if (cached?.result && cached.page === initialPage) return; // already loaded from cache
    doSearch(initialPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = result ? Math.ceil(result.total / result.page_size) : 0;

  const saveCacheAndScroll = () => {
    sessionStorage.setItem('search_scroll', String(window.scrollY));
    sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({
      page, name, compoundType, appFilter, buildingBlock, assemblyType,
      showAdvanced, morphology, drivingForce, assemblyDriveMethod,
      sizeMin, sizeMax, result,
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        {tr('searchTitle')}
      </h1>

      {/* Loading indicator when showing stale data */}
      {loading && result && (
        <div className="fixed top-14 left-0 right-0 z-10 flex justify-center">
          <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-b-md shadow-md opacity-80">
            {tr('refreshing') || '...'}
          </div>
        </div>
      )}

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
            value={compoundType}
            onChange={e => setCompoundType(e.target.value)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{tr('allCompoundTypes')}</option>
            {compoundTypes.map(ct => (
              <option key={ct.type} value={ct.type}>{ct.type} ({ct.count})</option>
            ))}
          </select>
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

      {/* Loading skeleton (only when no cached data) */}
      {!result && loading && (
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
      {result && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {tr('foundResults', { total: result.total })}
            {totalPages > 1 && ` · ${tr('pageOf', { page: result.page, total: totalPages })}`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {result.results.map(c => (
              <div key={c.representative_id} onClick={saveCacheAndScroll}>
                <CompoundCard
                  compound={c}
                  onImageClick={(src, alt) => setLightbox({ src, alt })}
                />
              </div>
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
