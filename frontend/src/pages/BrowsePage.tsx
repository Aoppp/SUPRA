import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import type { SearchResult } from '../types';
import { useLang } from '../i18n/LanguageContext';

export default function BrowsePage() {
  const { tr } = useLang();
  const [data, setData] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.search({ page, page_size: 50 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">{tr('browseAll')}</h1>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500">{tr('loading')}</p>
      ) : data ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {data.total} {tr('entries')} · {tr('pageOf', { page: data.page, total: totalPages })}
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{tr('idCol')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{tr('nameCol')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{tr('buildingBlockCol')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{tr('morphologyCol')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{tr('sizeCol')}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map(a => (
                  <tr key={a.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 tabular-nums">{a.id}</td>
                    <td className="px-4 py-3">
                      <Link to={`/assembly/${a.id}`} className="text-blue-600 hover:underline font-medium">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.building_block?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.morphology?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {a.size_nm_min != null && a.size_nm_max != null
                        ? `${a.size_nm_min}–${a.size_nm_max}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
