import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';

type User = { username: string; email: string } | null;

const UserContext = createContext<{
  user: User;
  setUser: (user: User) => void;
  loading: boolean;
  logout: () => Promise<void>;
}>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.user) {
            setUser(data.user);
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
