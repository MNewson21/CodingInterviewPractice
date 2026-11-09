import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteFallback } from './components/RouteFallback';
import { CanonicalUrl } from './components/CanonicalUrl';
import { HomePage } from './routes/HomePage';
import { NotFoundPage } from './routes/NotFoundPage';
import { AuthProvider } from './lib/auth';
import { useThemeStore } from './stores/useThemeStore';
import { CUSTOM_THEME_ID, buildZincRamp, ZINC_VAR_NAMES } from './features/editor/themes';

/*
 * Route-level code splitting.
 *
 * HomePage and NotFoundPage stay eagerly imported: Home is the landing route, so
 * deferring it would only add a round trip to the most common entry point, and
 * NotFound is too small to be worth a chunk of its own.
 *
 * Everything below is split because each pulls in a dependency the landing page has
 * no use for - Monaco's React wrapper (Session, Replay), react-markdown + remark-gfm
 * (Session, Privacy), and the ~600-line pattern library (Revise). Before this split
 * the app shipped as one 1.2 MB chunk, so a visitor who never opened a problem still
 * downloaded the editor and the markdown renderer.
 */
const SessionPage = lazy(() => import('./routes/SessionPage').then((m) => ({ default: m.SessionPage })));
const ReplayPage = lazy(() => import('./routes/ReplayPage').then((m) => ({ default: m.ReplayPage })));
const AboutPage = lazy(() => import('./routes/AboutPage').then((m) => ({ default: m.AboutPage })));
const RevisePage = lazy(() => import('./routes/RevisePage').then((m) => ({ default: m.RevisePage })));
const ProgressPage = lazy(() => import('./routes/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const TracksPage = lazy(() => import('./routes/TracksPage').then((m) => ({ default: m.TracksPage })));
const TrackDetailPage = lazy(() => import('./routes/TrackDetailPage').then((m) => ({ default: m.TrackDetailPage })));
const PrivacyPage = lazy(() => import('./routes/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then((m) => ({ default: m.AuthPage })));

export function App() {
  const editorTheme = useThemeStore((s) => s.editorTheme);
  const customColor = useThemeStore((s) => s.customColor);
  const scope = useThemeStore((s) => s.scope);

  // When scope is 'page', re-tint the whole app. Built-in modes use a CSS
  // `[data-app-theme]` ramp; a custom colour is applied as inline `--color-zinc-*`
  // variables generated from that colour. 'editor' scope leaves the default palette.
  useEffect(() => {
    const root = document.documentElement;
    const clearRamp = () => ZINC_VAR_NAMES.forEach((name) => root.style.removeProperty(name));

    if (scope === 'page' && editorTheme === CUSTOM_THEME_ID) {
      delete root.dataset.appTheme;
      const ramp = buildZincRamp(customColor);
      for (const [name, value] of Object.entries(ramp)) root.style.setProperty(name, value);
    } else if (scope === 'page') {
      clearRamp();
      root.dataset.appTheme = editorTheme;
    } else {
      clearRamp();
      delete root.dataset.appTheme;
    }
  }, [editorTheme, customColor, scope]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <CanonicalUrl />
          {/*
            One Suspense boundary around the whole switch rather than one per route:
            only a single route is ever mounted, so the extra boundaries would add
            nothing. It sits inside ErrorBoundary so a chunk that fails to load (stale
            hash after a deploy, flaky network) surfaces the app's error screen with
            its reload action instead of an unhandled rejection.
          */}
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/revise" element={<RevisePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/tracks" element={<TracksPage />} />
              <Route path="/tracks/:trackId" element={<TrackDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/session/:problemId" element={<SessionPage />} />
              <Route path="/replay/:sessionId" element={<ReplayPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
