import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Account = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-lg mx-auto py-12 flex flex-col items-center">
      <div className="bg-[#b2dfdb]/80 rounded-full shadow-2xl p-6 mb-6 flex items-center justify-center">
        <span className="text-6xl" role="img" aria-label="avatar">👤</span>
      </div>
      <div className="card bg-white/80 w-full mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">Jouw account</h1>
        {user ? (
          <>
            <div className="text-lg text-gray-700 mb-2">Ingelogd als:</div>
            <div className="text-xl font-semibold text-primary-700 mb-4">{user.email}</div>
            <button onClick={handleLogout} className="btn-secondary w-full">Uitloggen</button>
          </>
        ) : (
          <>
            <div className="text-lg text-gray-700 mb-4">Je bent nog niet ingelogd.</div>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">Inloggen</button>
          </>
        )}
      </div>
      <div className="bg-[#ff914d]/10 rounded-3xl p-6 shadow text-center mt-4">
        <p className="text-lg text-primary-700 font-semibold mb-2">Welkom bij Anemi Meets!</p>
        <p className="text-gray-700">Hier kun je je account beheren, uitloggen of je gegevens bekijken.<br/>We maken het makkelijk om echte connecties te versterken <span role="img" aria-label="connect">🤝</span></p>
      </div>
    </div>
  );
};

export default Account; 