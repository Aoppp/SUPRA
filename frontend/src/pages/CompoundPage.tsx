import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { AssemblyListItem } from '../types';
import { useLang } from '../context/LanguageContext';

export default function CompoundPage() {
  const { name } = useParams<{ name: string }>();
  const { tr } = useLang();
  const navigate = useNavigate();
  const decodedName = name ? decodeURIComponent(name) : '';

  const [assemblies, setAssemblies] = useState<AssemblyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedName) return;
    setLoading(true);
    api.getCompoundAssemblies(decodedName)
      .then(setAssemblies)
      .finally(() => setLoading(false));
  }, [decodedName]);

  const first = assemblies[0];

  const catLabel = (a: AssemblyListItem) => {
    const parts = [];
    if (a.is_food) parts.push(tr('categoryFood'));
    if (a.is_cosmetic) parts.push(tr('categoryCosmetic'));
    if (a.is_drug) parts.push(tr('categoryDrug'));
    return parts.join(' · ') || null;
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 inline-block bg-transparent border-none cursor-pointer"
      >
        ← {tr('backToSearch')}
      </button>

      {/* Compound header */}
      {first && (
        <div className="flex gap-5 mb-8">
          {first.compound_image && (
            <div className="w-32 h-32 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center p-2">
              <img
                src={first.compound_image}
                alt={decodedName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{decodedName}</h1>
            {first.english_name && (
              <p className="text-sm text-slate-400 italic mt-1">{first.english_name}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(first as AssemblyListItem & { compound_type?: string }).compound_type && (
                <Link
                  to={`/categories/${encodeURIComponent((first as AssemblyListItem & { compound_type?: string }).compound_type!)}`}
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 no-underline"
                >
                  {(first as AssemblyListItem & { compound_type?: string }).compound_type}
                </Link>
              )}
              {catLabel(first) && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {catLabel(first)}
                </span>
              )}
              {first.cas_number && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  CAS {first.cas_number}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assembly forms list */}
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
        {tr('selectAssemblyForm')}
        <span className="ml-2 text-sm font-normal text-slate-400">({assemblies.length} {tr('formsCount', { n: '' }).replace(/ \d+ /, ' ')})</span>
      </h2>

      <div className="space-y-3">
        {assemblies.map((a, idx) => (
          <Link
            key={a.id}
            to={`/assembly/${a.id}`}
            className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all no-underline group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Row header */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 w-5 shrink-0">#{idx + 1}</span>
                  {a.assembly_type && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      {a.assembly_type}
                    </span>
                  )}
                  {a.assembly_drive_method && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {a.assembly_drive_method.name}
                    </span>
                  )}
                  {a.morphology && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {a.morphology.name}
                    </span>
                  )}
                </div>

                {/* Key properties row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {a.particle_size && (
                    <span><span className="text-slate-400">{tr('particleSizeCol')}:</span> {a.particle_size} nm</span>
                  )}
                  {a.driving_forces?.length > 0 && (
                    <span className="truncate max-w-[300px]">
                      <span className="text-slate-400">{tr('drivingForceLabel')}:</span>{' '}
                      {a.driving_forces.map(d => d.name).join('；')}
                    </span>
                  )}
                  {a.doi && (
                    <span className="font-mono">DOI: {a.doi.length > 30 ? a.doi.slice(0, 30) + '…' : a.doi}</span>
                  )}
                </div>
              </div>

              <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
                {tr('viewDetail')} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {assemblies.length === 0 && !loading && (
        <p className="text-center text-slate-400 py-8">{tr('noResults')}</p>
      )}
    </div>
  );
}
