import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import LessonPage from '@/pages/LessonPage';
import ExercisePage from '@/pages/ExercisePage';
import CheatSheetPage from '@/pages/CheatSheetPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="exercise/:exerciseId" element={<ExercisePage />} />
          <Route path="cheatsheet" element={<CheatSheetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
