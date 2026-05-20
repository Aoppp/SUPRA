import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import type { BuildingBlock, Morphology, DrivingForce, Property, SearchResult } from '../types';
import { useLang } from '../context/LanguageContext';

export default function SearchPage() {
  const { tr } = useLang();

  const [bbList, setBbList] = useState<BuildingBlock[]>([]);
  const [morphList, setMorphList] = useState<Morphology[]>([]);
  const [dfList, setDfList] = useState<DrivingForce[]>([]);
  const [propList, setPropList] = useState<Property[]>([]);

  const [name, setName] = useState('');
  const [buildingBlock, setBuildingBlock] = useState('');
  const [morphology, setMorphology] = useState('');
  const [drivingForce, setDrivingForce] = useState('');
  const [property, setProperty] = useState('');
  const [solvent, setSolvent] = useState('');
  const [assemblyType, setAssemblyType] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    api.getBuildingBlockList().then(setBbList);
    api.getMorphologyList().then(setMorphList);
    api.getDrivingForceList().then(setDfList);
    api.getPropertyList().then(setPropList);
  }, []);

  const doSearch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const r = await api.search({
        name: name || undefined,
        building_block: buildingBlock || undefined,
        morphology: morphology || undefined,
        driving_force: drivingForce || undefined,
        property: property || undefined,
        solvent: solvent || undefined,
        assembly_type: assemblyType || undefined,
        size_min: sizeMin ? Number(sizeMin) : undefined,
        size_max: sizeMax ? Number(sizeMax) : undefined,
        page: pageNum,
        page_size: 20,
      });
      setResult(r);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, [name, buildingBlock, morphology, drivingForce, property, solvent, assemblyType, sizeMin, sizeMax]);

  useEffect(() => { doSearch(1); }, []);

  const totalPages = result ? Math.ceil(result.total / result.page_size) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        {tr('searchTitle')}
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('assemblyName')}</span>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g., Fmoc-FF hydrogel"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('buildingBlock')}</span>
            <select
              value={buildingBlock}
              onChange={e => setBuildingBlock(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors"
            >
              <option value="">{tr('allBuildingBlocks')}</option>
              {bbList.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('morphology')}</span>
            <select
              value={morphology}
              onChange={e => setMorphology(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors"
            >
              <option value="">{tr('allMorphologies')}</option>
              {morphList.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('drivingForce')}</span>
            <select
              value={drivingForce}
              onChange={e => setDrivingForce(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors"
            >
              <option value="">{tr('allDrivingForces')}</option>
              {dfList.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('property')}</span>
            <select
              value={property}
              onChange={e => setProperty(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors"
            >
              <option value="">{tr('allProperties')}</option>
              {propList.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('solvent')}</span>
            <input
              type="text" value={solvent} onChange={e => setSolvent(e.target.value)}
              placeholder="e.g., Water"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('assemblyTypeCol')}</span>
            <input
              type="text" value={assemblyType} onChange={e => setAssemblyType(e.target.value)}
              placeholder="e.g., Self-assembly; Hydrogel"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('sizeMin')}</span>
            <input
              type="number" value={sizeMin} onChange={e => setSizeMin(e.target.value)}
              placeholder="e.g., 10"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{tr('sizeMax')}</span>
            <input
              type="number" value={sizeMax} onChange={e => setSizeMax(e.target.value)}
              placeholder="e.g., 200"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </label>
        </div>

        <button
          onClick={() => doSearch(1)}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? tr('searching') : tr('searchBtn')}
        </button>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto animate-pulse">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {tr('foundResults', { total: result.total })}
            {totalPages > 1 && ` · ${tr('pageOf', { page: result.page, total: totalPages })}`}
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                <tr>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('nameCol')}</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('compoundImageCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('casCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('assemblyTypeCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('solventCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('drivingForceCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('morphologyCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('particleSizeCol')}</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('bioActivityCol')}</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{tr('doiCol')}</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map(a => (
                  <tr key={a.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
                    <td className="px-3 py-3">
                      <Link to={`/assembly/${a.id}`} className="text-blue-600 hover:underline font-medium">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {a.compound_image ? (
                        <img
                          src={a.compound_image} alt={a.name}
                          className="w-10 h-10 object-contain inline-block rounded border cursor-pointer hover:border-blue-400 hover:shadow-sm transition"
                          onClick={() => setLightbox({ src: a.compound_image!, alt: a.name })}
                        />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">{a.cas_number ?? '-'}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-normal min-w-[140px]">{a.assembly_type ?? '-'}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{a.solvent ?? '-'}</td>
                    <td className="px-3 py-3">
                      {a.driving_forces.length > 0
                        ? a.driving_forces.map(df => (
                            <span key={df.id} className="inline-block px-1.5 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 mr-1 mb-0.5">{df.name}</span>
                          ))
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400 text-xs">{a.morphology?.name ?? '-'}</td>
                    <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">{a.particle_size ?? '-'}</td>
                    <td className="px-3 py-3">
                      {a.properties.length > 0
                        ? a.properties.map(p => (
                            <span key={p.id} className="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 mr-1 mb-0.5">{p.name}</span>
                          ))
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {a.doi ? (
                        <a
                          href={`https://doi.org/${a.doi}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 transition-colors"
                          title={`DOI: ${a.doi}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {result.results.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">{tr('noResults')}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">
                        {tr('noResultsHint') ?? 'Try adjusting your search terms or filters.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
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
