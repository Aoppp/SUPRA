import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { AssemblyDetail } from '../types';
import { useLang } from '../context/LanguageContext';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tr } = useLang();
  const [data, setData] = useState<AssemblyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAssembly(Number(id))
      .then(setData)
      .catch(() => setError(tr('notFound')))
      .finally(() => setLoading(false));
  }, [id, tr]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="max-w-4xl mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        {tr('backToSearch')}
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{data.name}</h1>
      {data.morphology && (
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {data.morphology.name}{data.morphology.description ? ` — ${data.morphology.description}` : ''}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{tr('detailTitle')}</h2>
          <dl className="space-y-2 text-sm">
            {data.solvent && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('solvent')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.solvent}</dd>
              </div>
            )}
            {data.concentration && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('concentration')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.concentration}</dd>
              </div>
            )}
            {(data.size_nm_min != null || data.size_nm_max != null) && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('sizeRange')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.size_nm_min ?? '?'} – {data.size_nm_max ?? '?'} nm</dd>
              </div>
            )}
            {data.doi && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('doi')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.doi}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Description */}
        {data.description && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{tr('description')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Preparation Method */}
        {data.preparation_method && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{tr('preparationMethod')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{data.preparation_method}</p>
          </div>
        )}

        {/* Building Block */}
        {data.building_block && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{tr('buildingBlockSection')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('nameCol')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.building_block.name}</dd>
              </div>
              {data.building_block.molecular_formula && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{tr('molecularFormula')}</dt>
                  <dd className="font-medium font-mono">{data.building_block.molecular_formula}</dd>
                </div>
              )}
              {data.building_block.category && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{tr('category')}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">{data.building_block.category}</dd>
                </div>
              )}
              {data.building_block.smiles && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs mb-1">{tr('smiles')}</dt>
                  <dd className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">{data.building_block.smiles}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Characterization Method */}
        {data.characterization_method && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{tr('characterizationMethod')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">{tr('nameCol')}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{data.characterization_method.name}</dd>
              </div>
              {data.characterization_method.category && (
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{tr('category')}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">{data.characterization_method.category}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Driving Forces */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
            {tr('drivingForcesSection')} ({data.driving_forces.length})
          </h2>
          {data.driving_forces.length > 0 ? (
            <ul className="space-y-2">
              {data.driving_forces.map(df => (
                <li key={df.id} className="text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{df.name}</span>
                  {df.category && <span className="text-slate-400 dark:text-slate-500 ml-2">({df.category})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">{tr('noData')}</p>
          )}
        </div>

        {/* Properties */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
            {tr('propertiesSection')} ({data.properties.length})
          </h2>
          {data.properties.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.properties.map(p => (
                <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  {p.name}
                  {p.category && <span className="text-blue-400 ml-1">({p.category})</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">{tr('noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
