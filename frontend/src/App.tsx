import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const WorkbenchPage = lazy(() => import('./pages/WorkbenchPage'));
const CompoundPage = lazy(() => import('./pages/CompoundPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories/:type" element={<CategoryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/compound/:name" element={<CompoundPage />} />
                <Route path="/assembly/:id" element={<DetailPage />} />
                <Route path="/polysaccharide/:id" element={<DetailPage />} />
                <Route path="/browse" element={<Navigate to="/search" replace />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/workbench" element={<WorkbenchPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
