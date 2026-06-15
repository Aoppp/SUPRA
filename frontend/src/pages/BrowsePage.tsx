import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as api from '../api/client';
import type { SearchResult } from '../types';
import { useLang } from '../context/LanguageContext';

const CACHE_KEY_PREFIX = 'browse_data_v1_';

export default function BrowsePage() {
  const { tr } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const cacheKey = `${CACHE_KEY_PREFIX}${page}`;

  // Try cache-first: restore data instantly from sessionStorage
  const [data, setData] = useState<SearchResult | null>(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached?.results) return cached;
    } catch { /* ignore */ }
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const restoredRef = useRef(false);

  // Restore scroll position synchronously before first paint
  useLayoutEffect(() => {
    if (!restoredRef.current) {
      restoredRef.current = true;
      const saved = sessionStorage.getItem('browse_scroll');
      if (saved) {
        window.scrollTo(0, Number(saved));
        sessionStorage.removeItem('browse_scroll');
      }
    }
  });

  // Fetch fresh data (runs even if cached data is shown)
  useEffect(() => {
    setLoading(true);
    api.search({ page, page_size: 20 })
      .then(result => {
        setData(result);
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      })
      .finally(() => setLoading(false));
  }, [page, cacheKey]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

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
        {tr('browseAll')}
      </h1>

      {/* Show cached data immediately, with a subtle refresh indicator */}
      {loading && data && (
        <div className="fixed top-14 left-0 right-0 z-10 flex justify-center">
          <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-b-md shadow-md opacity-80">
            {tr('refreshing') || '...'}
          </div>
        </div>
      )}

      {!data && loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {data.total} {tr('entries')} · {tr('pageOf', { page: data.page, total: totalPages })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.results.map(a => (
              <Link
                key={a.id}
                to={`/assembly/${a.id}`}
                onClick={() => sessionStorage.setItem('browse_scroll', String(window.scrollY))}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
              >
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
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      onClick={e => { e.preventDefault(); setLightbox({ src: `/api/structure-image/${a.id}`, alt: a.name }); }}
                    />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 text-4xl">—</span>
                  )}
                  {catLabel(a) && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {catLabel(a)}
                    </span>
                  )}
                </div>

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
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setSearchParams({ page: String(i + 1) })}
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
        </>
      ) : null}

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
