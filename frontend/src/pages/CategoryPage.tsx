import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api/client';
import type { SearchResult } from '../types';
import { useLang } from '../context/LanguageContext';

export default function CategoryPage() {
  const { type } = useParams<{ type: string }>();
  const { tr } = useLang();
  const decodedType = type ? decodeURIComponent(type) : '';

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [appFilter, setAppFilter] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const doSearch = useCallback(async (pageNum: number, appF: string) => {
    setLoading(true);
    try {
      const r = await api.search({
        compound_type: decodedType,
        is_cosmetic: appF === 'cosmetic' ? true : undefined,
        is_drug: appF === 'drug' ? true : undefined,
        is_food: appF === 'food' ? true : undefined,
        page: pageNum,
        page_size: 20,
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, [decodedType]);

  useEffect(() => {
    setPage(1);
    setResult(null);
    doSearch(1, appFilter);
  }, [decodedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAppFilter = (f: string) => {
    const next = appFilter === f ? '' : f;
    setAppFilter(next);
    setPage(1);
    doSearch(1, next);
  };

  const handlePage = (p: number) => {
    setPage(p);
    doSearch(p, appFilter);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const totalPages = result ? Math.ceil(result.total / result.page_size) : 0;

  const catLabel = (a: { is_cosmetic: boolean; is_drug: boolean; is_food: boolean }) => {
    const parts = [];
    if (a.is_food) parts.push(tr('categoryFood'));
    if (a.is_cosmetic) parts.push(tr('categoryCosmetic'));
    if (a.is_drug) parts.push(tr('categoryDrug'));
    return parts.length ? parts.join(' · ') : null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back + title */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 no-underline">
          {tr('backToHome')}
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
          {tr('categoryPageTitle', { type: decodedType })}
        </h1>
        {result && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tr('foundResults', { total: result.total })}
          </p>
        )}
      </div>

      {/* Application filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleAppFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === '' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
        >
          {tr('filterAll')}
        </button>
        <button
          onClick={() => handleAppFilter('food')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'food' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}
        >
          {tr('isFoodLabel')}
        </button>
        <button
          onClick={() => handleAppFilter('cosmetic')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'cosmetic' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-pink-400'}`}
        >
          {tr('isCosmeticLabel')}
        </button>
        <button
          onClick={() => handleAppFilter('drug')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${appFilter === 'drug' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-amber-400'}`}
        >
          {tr('isDrugLabel')}
        </button>
      </div>

      {/* Loading skeleton */}
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

      {/* No results */}
      {result && result.results.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-lg">{tr('noResults')}</p>
          <p className="text-sm mt-1">{tr('noResultsHint')}</p>
        </div>
      )}

      {/* Card grid */}
      {result && result.results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {result.results.map(a => (
              <Link
                key={a.id}
                to={`/assembly/${a.id}`}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group no-underline"
              >
                <div className="aspect-square bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
                  {a.compound_image ? (
                    <img
                      src={a.compound_image} alt={a.name}
                      className="max-w-full max-h-full object-contain"
                      onClick={e => { e.preventDefault(); setLightbox({ src: a.compound_image!, alt: a.name }); }}
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
                  <div className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {a.name}
                  </div>
                  {a.english_name && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{a.english_name}</div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {a.assembly_type && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                        {a.assembly_type}
                      </span>
                    )}
                    {a.particle_size && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {a.particle_size} nm
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                &laquo;
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">
                {tr('pageOf', { page, total: totalPages })}
              </span>
              <button
                onClick={() => handlePage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
