import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './routes/HomePage';
import { SessionPage } from './routes/SessionPage';
import { ReplayPage } from './routes/ReplayPage';
import { AboutPage } from './routes/AboutPage';
import { RevisePage } from './routes/RevisePage';
import { PrivacyPage } from './routes/PrivacyPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { AuthPage } from './features/auth/AuthPage';
import { useThemeStore } from './stores/useThemeStore';

export function App() {
  const editorTheme = useThemeStore((s) => s.editorTheme);
  const scope = useThemeStore((s) => s.scope);

  // When scope is 'page', expose the theme on <html> so the CSS zinc-scale overrides
  // re-tint the whole app. 'editor' scope leaves the default palette in place.
  useEffect(() => {
    const root = document.documentElement;
    if (scope === 'page') root.dataset.appTheme = editorTheme;
    else delete root.dataset.appTheme;
  }, [editorTheme, scope]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/revise" element={<RevisePage />} />
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
