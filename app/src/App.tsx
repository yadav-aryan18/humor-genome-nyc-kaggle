import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Loader2 } from 'lucide-react';
import { SettingsProvider } from '@/lib/settings';
import { StudioLayout } from '@/components/StudioLayout';
import Home from '@/pages/Home';

const CopilotPage = lazy(() => import('@/pages/studio/CopilotPage'));
const ExplainerPage = lazy(() => import('@/pages/studio/ExplainerPage'));
const TranslatorPage = lazy(() => import('@/pages/studio/TranslatorPage'));
const ImprovPage = lazy(() => import('@/pages/studio/ImprovPage'));
const Tight5Page = lazy(() => import('@/pages/studio/Tight5Page'));
const LabPage = lazy(() => import('@/pages/studio/LabPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<StudioLayout />}>
          <Route index element={<Navigate to="/studio/copilot" replace />} />
          <Route path="copilot" element={<Suspense fallback={<PageLoader />}><CopilotPage /></Suspense>} />
          <Route path="explain" element={<Suspense fallback={<PageLoader />}><ExplainerPage /></Suspense>} />
          <Route path="translate" element={<Suspense fallback={<PageLoader />}><TranslatorPage /></Suspense>} />
          <Route path="improv" element={<Suspense fallback={<PageLoader />}><ImprovPage /></Suspense>} />
          <Route path="tight5" element={<Suspense fallback={<PageLoader />}><Tight5Page /></Suspense>} />
          <Route path="lab" element={<Suspense fallback={<PageLoader />}><LabPage /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SettingsProvider>
  );
}
