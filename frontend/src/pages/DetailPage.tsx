import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/client';
import type { AssemblyDetail } from '../types';
import { useLang } from '../context/LanguageContext';

function Section({ title, children, span = false }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow ${span ? 'md:col-span-2' : ''}`}>
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '' || children === '-') return null;
  return (
    <div className="flex justify-between items-start gap-2 py-1">
      <dt className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{children}</dd>
    </div>
  );
}

function Tag({ children, color = 'slate' }: { children: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700',
    teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.slate}`}>{children}</span>;
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tr } = useLang();
  const [data, setData] = useState<AssemblyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAssembly(Number(id))
      .then(setData)
      .catch(() => setError(tr('notFound')))
      .finally(() => setLoading(false));
  }, [id, tr]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="max-w-5xl mx-auto px-4 py-8 text-red-500">{error}</div>;
  if (!data) return null;

  const catLabel = () => {
    const parts = [];
    if (data.is_food) parts.push(tr('categoryFood'));
    if (data.is_cosmetic) parts.push(tr('categoryCosmetic'));
    if (data.is_drug) parts.push(tr('categoryDrug'));
    return parts.join(' · ') || null;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        {tr('backToSearch')}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        {/* Compound Image */}
        <div className="w-full sm:w-48 h-48 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shrink-0">
          {data.compound_image ? (
            <img
              src={data.compound_image} alt={data.name}
              className="max-w-full max-h-full object-contain cursor-pointer rounded"
              onClick={() => setLightbox({ src: data.compound_image!, alt: data.name })}
            />
          ) : data.smiles ? (
            <img
              src={`/api/structure-image/${data.id}`}
              alt={data.name}
              className="max-w-full max-h-full object-contain cursor-pointer rounded"
              onClick={() => setLightbox({ src: `/api/structure-image/${data.id}`, alt: data.name })}
            />
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-5xl">—</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data.name}</h1>
          {data.english_name && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic mt-1">{data.english_name}</p>
          )}
          {catLabel() && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.foodmate_url ? (
                <a href={data.foodmate_url} target="_blank" rel="noopener noreferrer"
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:underline">
                  {catLabel()} ↗
                </a>
              ) : (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                  {catLabel()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 🧬 Molecular Information */}
        <Section title={tr('moleculeInfo')}>
          <dl className="space-y-0.5">
            <Field label="CAS">{data.cas_number}</Field>
            <Field label={tr('buildingBlockSection')}>{data.building_block?.name}</Field>
            {data.molecular_characteristics && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('molecularCharacteristics')}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.molecular_characteristics}</p>
              </div>
            )}
          </dl>
        </Section>

        {/* 🏷️ Application Classification */}
        <Section title={tr('applicationClassification')}>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.is_food && <Tag color="blue">{tr('categoryFood')}</Tag>}
            {data.is_cosmetic && <Tag color="pink">{tr('categoryCosmetic')}</Tag>}
            {data.is_drug && <Tag color="amber">{tr('categoryDrug')}</Tag>}
            {!data.is_food && !data.is_cosmetic && !data.is_drug && (
              <span className="text-xs text-slate-400">{tr('noData')}</span>
            )}
          </div>
          <dl className="space-y-0.5">
            <Field label={tr('cosmeticNote')}>{data.cosmetic_note}</Field>
            <Field label={tr('drugNote')}>{data.drug_note}</Field>
            <Field label={tr('foodNote')}>{data.food_note}</Field>
            <Field label={tr('foodCategory')}>{data.food_category}</Field>
            <Field label={tr('foodDailyIntake')}>{data.food_daily_intake}</Field>
          </dl>
          {data.regulations && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('regulations')}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.regulations}</p>
            </div>
          )}
        </Section>

        {/* 🔬 Assembly Parameters */}
        <Section title={tr('assemblyParameters')}>
          <dl className="space-y-0.5">
            <Field label={tr('assemblyDriveMethod')}>{data.assembly_drive_method?.name}</Field>
            <Field label={tr('assemblyTypeCol')}>{data.assembly_type}</Field>
            <Field label={tr('componentCount')}>{data.component_count}</Field>
            <Field label={tr('morphology')}>{data.morphology?.name}</Field>
            <Field label={tr('responsiveness')}>{data.responsiveness}</Field>
            <Field label={tr('surfaceModification')}>{data.surface_modification}</Field>
          </dl>
          {data.driving_forces.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('drivingForcesSection')}</p>
              <div className="flex flex-wrap gap-1">
                {data.driving_forces.map(df => <Tag key={df.id} color="amber">{df.name}</Tag>)}
              </div>
            </div>
          )}
        </Section>

        {/* 🧪 Solvent System */}
        <Section title={tr('solventSystem')}>
          <dl className="space-y-0.5">
            <Field label={tr('aqueousPhase')}>{data.aqueous_phase}</Field>
            <Field label={tr('organicPhase')}>{data.organic_phase}</Field>
            <Field label={tr('solute')}>{data.solute}</Field>
            <Field label={tr('concentration')}>{data.concentration}</Field>
            <Field label={tr('componentRatio')}>{data.component_ratio}</Field>
          </dl>
        </Section>

        {/* 📐 Physical Properties */}
        <Section title={tr('physicalProperties')}>
          <dl className="space-y-0.5">
            <Field label={tr('particleSizeCol')}>{data.particle_size}</Field>
            {(data.size_nm_min != null || data.size_nm_max != null) && (
              <Field label={tr('sizeRange')}>{data.size_nm_min ?? '?'} – {data.size_nm_max ?? '?'} nm</Field>
            )}
            <Field label={tr('sizeNote')}>{data.size_note}</Field>
            <Field label={tr('sizeSource')}>{data.size_source}</Field>
            <Field label={tr('assemblyTemperature')}>{data.assembly_temperature}</Field>
            <Field label={tr('temperatureNote')}>{data.temperature_note}</Field>
            <Field label={tr('phValue')}>{data.ph_value}</Field>
            <Field label={tr('phNote')}>{data.ph_note}</Field>
          </dl>
        </Section>

        {/* 🧫 Biological Activity & Methods */}
        <Section title={tr('biologicalActivity')} span>
          {data.biological_activity ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.biological_activity}</p>
          ) : (
            <p className="text-sm text-slate-400">{tr('noData')}</p>
          )}
          {data.properties.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('propertiesSection')}</p>
              <div className="flex flex-wrap gap-1">
                {data.properties.map(p => <Tag key={p.id} color="green">{p.name}</Tag>)}
              </div>
            </div>
          )}
        </Section>

        {/* 📋 Methods */}
        <Section title={tr('preparationMethod')} span>
          {data.preparation_method ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.preparation_method}</p>
          ) : <p className="text-sm text-slate-400">{tr('noData')}</p>}
        </Section>

        {/* 📋 Other Info */}
        <Section title={tr('experimentalData')} span>
          <dl className="space-y-0.5">
            <Field label={tr('stirringCondition')}>{data.stirring_condition}</Field>
            <Field label={tr('assemblyTime')}>{data.assembly_time}</Field>
            {data.characterization_method && (
              <Field label={tr('characterizationMethod')}>{data.characterization_method.name}</Field>
            )}
            <Field label={tr('doi')}>
              {data.doi && (
                <a href={`https://doi.org/${data.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {data.doi}
                </a>
              )}
            </Field>
            <Field label={tr('externalUrl')}>
              {data.url && (
                <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all text-xs">{data.url}</a>
              )}
            </Field>
          </dl>
        </Section>

        {/* SMILES */}
        {data.smiles && (
          <Section title={tr('smiles')} span>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">{data.smiles}</p>
          </Section>
        )}

        {/* Notes */}
        {data.notes && (
          <Section title={tr('notes')} span>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.notes}</p>
          </Section>
        )}
      </div>

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
