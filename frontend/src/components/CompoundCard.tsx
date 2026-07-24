import { Link } from 'react-router-dom';
import type { CompoundGroupItem } from '../types';
import { useLang } from '../context/LanguageContext';

interface Props {
  compound: CompoundGroupItem;
  onImageClick?: (src: string, alt: string) => void;
}

export default function CompoundCard({ compound, onImageClick }: Props) {
  const { tr } = useLang();

  const catLabel = () => {
    const parts = [];
    if (compound.is_food) parts.push(tr('categoryFood'));
    if (compound.is_cosmetic) parts.push(tr('categoryCosmetic'));
    if (compound.is_drug) parts.push(tr('categoryDrug'));
    return parts.join(' · ') || null;
  };

  return (
    <Link
      to={compound.forms_count === 1
        ? `/assembly/${compound.representative_id}`
        : `/compound/${encodeURIComponent(compound.name)}`}
      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group no-underline flex flex-col"
    >
      {/* Image area */}
      <div className="aspect-square bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
        {compound.compound_image ? (
          <img
            src={compound.compound_image}
            alt={compound.name}
            className="max-w-full max-h-full object-contain"
            onClick={onImageClick ? e => {
              e.preventDefault();
              onImageClick(compound.compound_image!, compound.name);
            } : undefined}
          />
        ) : (
          <span className="text-slate-300 dark:text-slate-600 text-4xl">—</span>
        )}

        {/* Application badge */}
        {catLabel() && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {catLabel()}
          </span>
        )}

        {/* Multi-form badge */}
        {compound.forms_count > 1 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white">
            {compound.forms_count} {tr('assemblyForm')}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {compound.name}
        </div>
        {compound.english_name && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{compound.english_name}</div>
        )}
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {compound.assembly_types.slice(0, 2).map(t => (
            <span key={t} className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
              {t}
            </span>
          ))}
          {compound.assembly_types.length > 2 && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500">
              +{compound.assembly_types.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
