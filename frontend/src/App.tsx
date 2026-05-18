import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './i18n/ThemeContext';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import BrowsePage from './pages/BrowsePage';
import UploadPage from './pages/UploadPage';
import WorkbenchPage from './pages/WorkbenchPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/assembly/:id" element={<DetailPage />} />
              <Route path="/polysaccharide/:id" element={<DetailPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/workbench" element={<WorkbenchPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
