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
import OrgDashboard from './pages/OrgDashboard';
import AIInterview from "./pages/AIInterview";
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ShukatsuPage from './pages/ShukatsuPage'; // ← 追加
import PaymentSuccessPage from './pages/PaymentSuccessPage'; // ← 追加
import ShukatsuLandingPage from './pages/ShukatsuLandingPage'; // ← 追加
import VoiceChat from './pages/VoiceChat'; // ← 追加
import SalesReportPage from './pages/SalesReportPage'; // ← 営業日報

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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/home" element={<PrivateRoute><FieldSelectPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/field/:fieldType" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/field/:fieldType/interview" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
        <Route path="/field/:fieldType/timeline" element={<PrivateRoute><TimelinePage /></PrivateRoute>} />
        <Route path="/field/:fieldType/photos" element={<PrivateRoute><PhotosPage /></PrivateRoute>} />
        <Route path="/org-dashboard" element={<OrgDashboard />} />
        <Route path="/ai-interview" element={<PrivateRoute><AIInterview /></PrivateRoute>} />
        <Route path="/shukatsu" element={<PrivateRoute><ShukatsuPage /></PrivateRoute>} /> {/* ← 追加 */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} /> {/* ← 追加 */}
        <Route path="/shukatsu-lp" element={<ShukatsuLandingPage />} /> {/* ← 追加 */}
        <Route path="/voice-chat" element={<PrivateRoute><VoiceChat /></PrivateRoute>} /> {/* ← 追加 */}
        <Route path="/field/:fieldType/sales-report" element={<PrivateRoute><SalesReportPage /></PrivateRoute>} /> {/* ← 営業日報 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
