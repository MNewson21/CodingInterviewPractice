import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { SessionPage } from './routes/SessionPage';
import { ReplayPage } from './routes/ReplayPage';
import { AuthPage } from './features/auth/AuthPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/session/:problemId" element={<SessionPage />} />
        <Route path="/replay/:sessionId" element={<ReplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}
