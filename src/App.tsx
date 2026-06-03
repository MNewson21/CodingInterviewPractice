import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { SessionPage } from './routes/SessionPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:problemId" element={<SessionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
