import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './components/DashboardPage';
import { BookClubsPage } from './components/BookClubsPage';
import { RecommendationPage } from './components/RecommendationPage';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from './context/UserContext';

function AppContent() {
  const { user, loading } = useUser();

  if (loading) return <p>Loading...</p>;

  return user ? (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="recommend" element={<RecommendationPage />} />
        <Route path="clubs" element={<BookClubsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  ) : (
    <LoginPage />
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="size-full">
          <AppContent />
          <Toaster position="bottom-right" />
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}
