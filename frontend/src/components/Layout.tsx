import { Link, Outlet } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const { tr } = useLang();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-800 dark:text-slate-100 no-underline">
            {tr('siteTitle')}
          </Link>
          <nav className="flex gap-4 text-sm items-center">
            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 no-underline transition-colors">
              {tr('search')}
            </Link>
            <Link to="/browse" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 no-underline transition-colors">
              {tr('browse')}
            </Link>
            <Link to="/upload" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 no-underline transition-colors">
              {tr('upload')}
            </Link>
            <Link to="/workbench" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 no-underline transition-colors">
              {tr('workbench')}
            </Link>
            <ThemeToggle />
            <LanguageToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
