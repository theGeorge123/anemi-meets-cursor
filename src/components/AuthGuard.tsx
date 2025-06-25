import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from './LoadingIndicator';

export const AuthGuard = ({ children }: { children: JSX.Element }) => {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setOk(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingIndicator />;
  if (!ok) return <Navigate to="/login" />;
  return children;
};
