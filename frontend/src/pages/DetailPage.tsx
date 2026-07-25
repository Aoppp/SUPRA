import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { AssemblyDetail } from '../types';
import { useLang } from '../context/LanguageContext';

function Section({ title, children, span = false }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow ${span ? 'md:col-span-2' : ''}`}>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  if (children === null || children === undefined || children === '' || children === '-') return null;
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <dt className="text-xs text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 dark:text-slate-300 text-right max-w-[65%] leading-snug">{children}</dd>
    </div>
  );
}

function Tag({ children, color = 'slate' }: { children: string; color?: string }) {
  const colors: Record<string, string> = {
    slate:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    green:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',
    amber:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    pink:   'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700',
    teal:   'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700',
    red:    'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.slate}`}>{children}</span>;
}

function SolubilityBadge({ value }: { value: string }) {
  const map: Record<string, { color: string }> = {
    '易溶': { color: 'green' }, '可溶': { color: 'blue' },
    '微溶': { color: 'amber' }, '难溶': { color: 'red' }, '不溶': { color: 'red' },
  };
  const cfg = map[value.trim()] ?? { color: 'slate' };
  return <Tag color={cfg.color}>{value}</Tag>;
}

function AssemblySystem({ components }: { components: string }) {
  const parts = components.split(/[+＋]/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            {p}
          </span>
          {i < parts.length - 1 && (
            <span className="text-slate-400 dark:text-slate-500 font-bold text-base select-none">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tr } = useLang();
  const navigate = useNavigate();
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
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
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

  const bioIssues = data.bioavailability
    ? data.bioavailability.split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-5 inline-flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors">
        ← {tr('backToSearch')}
      </button>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {/* Compound Image */}
        <div className="w-full sm:w-44 h-44 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shrink-0">
          {data.compound_image ? (
            <img src={data.compound_image} alt={data.name}
              className="max-w-full max-h-full object-contain cursor-pointer rounded"
              onClick={() => setLightbox({ src: data.compound_image!, alt: data.name })} />
          ) : data.smiles ? (
            <img src={`/api/structure-image/${data.id}`} alt={data.name}
              className="max-w-full max-h-full object-contain cursor-pointer rounded"
              onClick={() => setLightbox({ src: `/api/structure-image/${data.id}`, alt: data.name })} />
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-5xl">—</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            {data.compound_type && (
              <Link to={`/categories/${encodeURIComponent(data.compound_type)}`}
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 no-underline hover:opacity-80">
                {data.compound_type}
              </Link>
            )}
            {catLabel() && (
              data.foodmate_url ? (
                <a href={data.foodmate_url} target="_blank" rel="noopener noreferrer"
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:underline">
                  {catLabel()} ↗
                </a>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {catLabel()}
                </span>
              )
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{data.name}</h1>
          {data.english_name && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic mt-1">{data.english_name}</p>
          )}

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
            {data.cas_number && <span>CAS <span className="text-slate-700 dark:text-slate-300 font-medium">{data.cas_number}</span></span>}
            {data.molecular_weight && <span>{tr('molecularWeight')} <span className="text-slate-700 dark:text-slate-300 font-medium">{data.molecular_weight} g/mol</span></span>}
            {data.log_p != null && <span>logP <span className="text-slate-700 dark:text-slate-300 font-medium">{data.log_p}</span></span>}
            {data.water_solubility && <span className="flex items-center gap-1">{tr('waterSolubility')} <SolubilityBadge value={data.water_solubility} /></span>}
          </div>

          {data.view_count != null && data.view_count > 0 && (
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">Viewed {data.view_count} times</p>
          )}
        </div>
      </div>

      {/* ── Assembly System Banner (if multi-component) ─ */}
      {data.assembly_components && (
        <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {tr('assemblyComponents')}
            </span>
            {data.is_single_component === false && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300">
                {tr('multiComponent')}
              </span>
            )}
            {data.is_single_component === true && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {tr('singleComponent')}
              </span>
            )}
            {data.component_count && (
              <span className="text-xs text-indigo-400 dark:text-indigo-500">{data.component_count}</span>
            )}
          </div>
          <AssemblySystem components={data.assembly_components} />
        </div>
      )}

      {/* ── Content Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1. Molecular Information */}
        <Section title={tr('moleculeInfo')}>
          <dl>
            <Field label="CAS">{data.cas_number}</Field>
            <Field label={tr('molecularWeight')}>
              {data.molecular_weight ? `${data.molecular_weight} g/mol` : undefined}
            </Field>
            <Field label={tr('buildingBlockSection')}>{data.building_block?.name}</Field>
            {data.smiles && (
              <div className="py-2">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('smiles')}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all leading-relaxed">{data.smiles}</p>
              </div>
            )}
            {data.molecular_characteristics && (
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('molecularCharacteristics')}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.molecular_characteristics}</p>
              </div>
            )}
          </dl>
        </Section>

        {/* 2. Physicochemical Properties (NEW) */}
        <Section title={tr('physicochemical')}>
          <dl>
            {data.water_solubility && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-700/50">
                <dt className="text-xs text-slate-400 dark:text-slate-500">{tr('waterSolubility')}</dt>
                <dd><SolubilityBadge value={data.water_solubility} /></dd>
              </div>
            )}
            <Field label={tr('logP')}>
              {data.log_p != null ? (
                <span className={data.log_p < 0 ? 'text-blue-600 dark:text-blue-400' : data.log_p > 3 ? 'text-amber-600 dark:text-amber-400' : undefined}>
                  {data.log_p}
                </span>
              ) : undefined}
            </Field>
            {bioIssues.length > 0 && (
              <div className="py-1.5 border-b border-slate-50 dark:border-slate-700/50">
                <dt className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{tr('bioavailability')}</dt>
                <dd className="flex flex-wrap gap-1 justify-end">
                  {bioIssues.map((issue, i) => <Tag key={i} color="red">{issue}</Tag>)}
                </dd>
              </div>
            )}
            {data.natural_source && (
              <div className="pt-2 mt-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('naturalSource')}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.natural_source}</p>
              </div>
            )}
            {!data.water_solubility && data.log_p == null && bioIssues.length === 0 && !data.natural_source && (
              <p className="text-xs text-slate-400 py-2">{tr('noData')}</p>
            )}
          </dl>
        </Section>

        {/* 3. Assembly Parameters */}
        <Section title={tr('assemblyParameters')}>
          <dl>
            <Field label={tr('assemblyDriveMethod')}>{data.assembly_drive_method?.name}</Field>
            <Field label={tr('assemblyTypeCol')}>{data.assembly_type}</Field>
            <Field label={tr('morphology')}>{data.morphology?.name}</Field>
            <Field label={tr('responsiveness')}>{data.responsiveness}</Field>
            <Field label={tr('surfaceModification')}>{data.surface_modification}</Field>
          </dl>
          {data.driving_forces.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{tr('drivingForcesSection')}</p>
              <div className="flex flex-wrap gap-1">
                {data.driving_forces.map(df => <Tag key={df.id} color="amber">{df.name}</Tag>)}
              </div>
            </div>
          )}
        </Section>

        {/* 4. Solvent System */}
        <Section title={tr('solventSystem')}>
          <dl>
            <Field label={tr('aqueousPhase')}>{data.aqueous_phase}</Field>
            <Field label={tr('organicPhase')}>{data.organic_phase}</Field>
            <Field label={tr('solute')}>{data.solute}</Field>
            <Field label={tr('concentration')}>{data.concentration}</Field>
            <Field label={tr('componentRatio')}>{data.component_ratio}</Field>
          </dl>
        </Section>

        {/* 5. Physical Properties */}
        <Section title={tr('physicalProperties')}>
          <dl>
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

        {/* 6. Application Classification */}
        <Section title={tr('applicationClassification')}>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.is_food && <Tag color="blue">{tr('categoryFood')}</Tag>}
            {data.is_cosmetic && <Tag color="pink">{tr('categoryCosmetic')}</Tag>}
            {data.is_drug && <Tag color="amber">{tr('categoryDrug')}</Tag>}
            {!data.is_food && !data.is_cosmetic && !data.is_drug && (
              <span className="text-xs text-slate-400">{tr('noData')}</span>
            )}
          </div>
          <dl>
            <Field label={tr('cosmeticNote')}>{data.cosmetic_note}</Field>
            <Field label={tr('drugNote')}>{data.drug_note}</Field>
            <Field label={tr('foodNote')}>{data.food_note}</Field>
            <Field label={tr('foodCategory')}>{data.food_category}</Field>
            <Field label={tr('foodDailyIntake')}>{data.food_daily_intake}</Field>
          </dl>
          {data.regulations && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{tr('regulations')}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.regulations}</p>
            </div>
          )}
        </Section>

        {/* 7. Biological Activity */}
        <Section title={tr('biologicalActivity')} span>
          {data.biological_activity ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.biological_activity}</p>
          ) : (
            <p className="text-sm text-slate-400">{tr('noData')}</p>
          )}
          {data.properties.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{tr('propertiesSection')}</p>
              <div className="flex flex-wrap gap-1">
                {data.properties.map(p => <Tag key={p.id} color="green">{p.name}</Tag>)}
              </div>
            </div>
          )}
        </Section>

        {/* 8. Preparation Method */}
        <Section title={tr('preparationMethod')} span>
          {data.preparation_method ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.preparation_method}</p>
          ) : <p className="text-sm text-slate-400">{tr('noData')}</p>}
        </Section>

        {/* 9. Preparation Conditions */}
        <Section title={tr('experimentalData')} span>
          <dl>
            <Field label={tr('stirringCondition')}>{data.stirring_condition}</Field>
            <Field label={tr('assemblyTime')}>{data.assembly_time}</Field>
            <Field label={tr('externalUrl')}>
              {data.url && (
                <a href={data.url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-xs">{data.url}</a>
              )}
            </Field>
          </dl>
        </Section>

        {/* 10. DOI */}
        {data.doi && (
          <Section title={tr('doi')} span>
            <a href={`https://doi.org/${data.doi}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm break-all">
              {data.doi}
            </a>
          </Section>
        )}

        {/* 11. Notes */}
        {data.notes && (
          <Section title={tr('notes')} span>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.notes}</p>
          </Section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt={lightbox.alt}
            className="max-w-full max-h-full object-contain bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-3"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
