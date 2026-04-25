import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import ProjectDashboard from './pages/ProjectDashboard';
import Editor from './pages/Editor';
import ProjectSettings from './pages/ProjectSettings';
import DataEditor from './pages/DataEditor';
import BookViewer from './pages/BookViewer';
import BookFileEditor from './pages/BookFileEditor';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:projectId" element={<Layout />}>
          <Route index element={<ProjectDashboard />} />
          <Route path="post/new" element={<Editor />} />
          <Route path="post/:slug" element={<Editor />} />
          <Route path="data/new" element={<DataEditor />} />
          <Route path="book/:bookSlug" element={<BookViewer />} />
          <Route path="book/:bookSlug/edit" element={<BookFileEditor />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
