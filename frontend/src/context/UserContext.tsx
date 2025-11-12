import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import { api } from '../api/client';

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
      const result = await api.verifyToken();
      if (result?.user) {
        setUser(result.user);
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
