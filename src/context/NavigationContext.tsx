import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { NavigationContext } from './navigation';

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
