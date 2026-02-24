import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FieldSelectPage from './pages/FieldSelectPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import TimelinePage from './pages/TimelinePage';
import PhotosPage from './pages/PhotosPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/home" element={<PrivateRoute><FieldSelectPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
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
