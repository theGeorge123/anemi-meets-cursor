import { createContext } from 'react';

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