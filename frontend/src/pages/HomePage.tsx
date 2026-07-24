import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { CompoundTypeCount } from '../types';
import { useLang } from '../context/LanguageContext';

const TYPE_COLORS: Record<string, string> = {
  '萜类':    'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
  '多酚':    'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  '醌类':    'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-200',
  '生物碱':  'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-800 dark:text-violet-200',
  '生物碱类':'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700 text-violet-800 dark:text-violet-200',
  '多糖类':  'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-200',
  '皂苷':    'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200',
  '植物甾醇':'bg-lime-50 dark:bg-lime-900/30 border-lime-200 dark:border-lime-700 text-lime-800 dark:text-lime-200',
  '黄酮类':  'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  '双胍类':  'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200',
};

const TYPE_DESCRIPTIONS: Record<string, { en: string; zh: string }> = {
  '萜类':    { zh: '单萜、倍半萜、二萜等天然萜类化合物', en: 'Monoterpenes, sesquiterpenes, diterpenes and other natural terpenoids' },
  '多酚':    { zh: '含多个酚羟基的植物次生代谢产物', en: 'Plant secondary metabolites containing multiple phenolic hydroxyl groups' },
  '醌类':    { zh: '含醌式结构的天然芳香化合物', en: 'Natural aromatic compounds containing quinone structures' },
  '生物碱':  { zh: '含氮杂环的天然有机化合物', en: 'Nitrogen-containing heterocyclic natural organic compounds' },
  '生物碱类':{ zh: '含氮杂环的天然有机化合物', en: 'Nitrogen-containing heterocyclic natural organic compounds' },
  '多糖类':  { zh: '由单糖聚合而成的天然高分子', en: 'Natural macromolecules polymerized from monosaccharides' },
  '皂苷':    { zh: '糖与非糖部分结合的两亲性天然产物', en: 'Amphiphilic natural products combining sugar and aglycone' },
  '植物甾醇':{ zh: '植物来源的固醇类化合物', en: 'Sterol compounds of plant origin' },
  '黄酮类':  { zh: '以黄酮母核为基础的多酚化合物', en: 'Polyphenolic compounds based on the flavone skeleton' },
  '双胍类':  { zh: '含双胍官能团的化合物', en: 'Compounds containing biguanide functional groups' },
};

export default function HomePage() {
  const { tr, lang } = useLang();
  const navigate = useNavigate();
  const [types, setTypes] = useState<CompoundTypeCount[]>([]);
  const [totalCompounds, setTotalCompounds] = useState<number>(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getCompoundTypes().then(data => {
      setTypes(data);
      setTotalCompounds(data.reduce((s, d) => s + d.count, 0));
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?name=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">{tr('heroTitle')}</h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">{tr('heroSubtitle')}</p>

          {/* Quick search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tr('quickSearchPlaceholder')}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {tr('searchBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-5 flex justify-center gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalCompounds}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('statsTotal')}</div>
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{types.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('statsTypes')}</div>
          </div>
        </div>
      </div>

      {/* Compound type cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-6">{tr('browseByType')}</h2>

        {types.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-28 rounded-xl border bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {types.map(({ type, count }) => {
              const colorClass = TYPE_COLORS[type] ?? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
              const desc = TYPE_DESCRIPTIONS[type];
              return (
                <Link
                  key={type}
                  to={`/categories/${encodeURIComponent(type)}`}
                  className={`group rounded-xl border p-5 no-underline transition-all hover:shadow-md hover:-translate-y-0.5 ${colorClass}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-lg font-bold">{type}</span>
                    <span className="text-xs font-semibold bg-white/60 dark:bg-black/20 rounded-full px-2 py-0.5 ml-2 shrink-0">
                      {count}
                    </span>
                  </div>
                  {desc && (
                    <p className="text-xs leading-relaxed opacity-75 line-clamp-2">
                      {lang === 'zh' ? desc.zh : desc.en}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Browse all link */}
        <div className="mt-8 text-center">
          <Link
            to="/search"
            className="inline-block px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg text-sm hover:border-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors no-underline"
          >
            {tr('browseAll')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
