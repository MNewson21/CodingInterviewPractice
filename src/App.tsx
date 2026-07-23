import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './routes/HomePage';
import { SessionPage } from './routes/SessionPage';
import { ReplayPage } from './routes/ReplayPage';
import { AboutPage } from './routes/AboutPage';
import { RevisePage } from './routes/RevisePage';
import { ProgressPage } from './routes/ProgressPage';
import { TracksPage } from './routes/TracksPage';
import { TrackDetailPage } from './routes/TrackDetailPage';
import { PrivacyPage } from './routes/PrivacyPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { AuthPage } from './features/auth/AuthPage';
import { useThemeStore } from './stores/useThemeStore';
import { CUSTOM_THEME_ID, buildZincRamp, ZINC_VAR_NAMES } from './features/editor/themes';

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
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}
