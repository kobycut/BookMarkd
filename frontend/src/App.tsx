import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from './context/UserContext';

function AppContent() {
  const { user, loading } = useUser();

  if (loading) return <p>Loading...</p>;

  return user ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <UserProvider>
      <div className="size-full">
        <AppContent />
        <Toaster position="bottom-right" />
      </div>
    </UserProvider>
  );
}
