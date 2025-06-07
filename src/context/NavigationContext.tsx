import React, { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface NavigationContextType {
  activePath: string;
  isAuthenticated: boolean;
  history: string[];
  goBack: () => void;
  setActivePath: (path: string) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  activePath: '/',
  isAuthenticated: false,
  history: [],
  goBack: () => {},
  setActivePath: () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);
  const [history, setHistory] = useState<string[]>([location.pathname]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setActivePath(location.pathname);
    setHistory(prev => prev[prev.length - 1] === location.pathname ? prev : [...prev, location.pathname]);
  }, [location.pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkAuth();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      navigate(newHistory[newHistory.length - 1]);
    }
  };

  return (
    <NavigationContext.Provider value={{ activePath, isAuthenticated, history, goBack, setActivePath }}>
      {children}
    </NavigationContext.Provider>
  );
};
