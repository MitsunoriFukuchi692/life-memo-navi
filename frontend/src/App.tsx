import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FieldSelectPage from './pages/FieldSelectPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import TimelinePage from './pages/TimelinePage';
import PhotosPage from './pages/PhotosPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* 分野選択トップ */}
        <Route path="/" element={<PrivateRoute><FieldSelectPage /></PrivateRoute>} />
        {/* 分野別ダッシュボード */}
        <Route path="/field/:fieldType" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/field/:fieldType/interview" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
        <Route path="/field/:fieldType/timeline" element={<PrivateRoute><TimelinePage /></PrivateRoute>} />
        <Route path="/field/:fieldType/photos" element={<PrivateRoute><PhotosPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
