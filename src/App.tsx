import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const AboutPage = lazy(() => import('@/features/about/AboutPage'));
const LicensePage = lazy(() => import('@/features/license/LicensePage'));
const ThemeDetailPage = lazy(() => import('@/features/detail/ThemeDetailPage'));
const BuilderPage = lazy(() => import('@/features/builder/BuilderPage'));
const SuccessPage = lazy(() => import('@/features/success/SuccessPage'));

export default function App() {
  const { t } = useI18n();

  return (
    <HashRouter>
      <div className="tdb-app">
        <a href="#main-content" className="skip-link">{t('app.skipToContent')}</a>
        <Header />
        <div id="main-content" tabIndex={-1}>
          <Suspense fallback={<main className="tdb-container page-block">{t('app.loading')}</main>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/license" element={<LicensePage />} />
              <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
              <Route path="/builder/:themeId" element={<BuilderPage />} />
              <Route path="/vsix/success" element={<SuccessPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </HashRouter>
  );
}
