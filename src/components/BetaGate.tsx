import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import BetaSignup from './BetaSignup';

const BetaGate = ({ children }: { children: React.ReactNode }) => {
  const { t, i18n } = useTranslation();
  const [allowed, setAllowed] = useState<null | boolean>(null);

  useEffect(() => {
    const checkBeta = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setAllowed(false);
        return;
      }
      const { data } = await supabase
        .from('beta_signups')
        .select('status')
        .eq('email', session.user.email)
        .maybeSingle();
      if (data?.status === 'accepted') {
        setAllowed(true);
      } else {
        setAllowed(false);
      }
    };
    checkBeta();
  }, []);

  if (allowed === null) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <span className="text-5xl mb-4">☕️</span>
        <h2 className="text-2xl font-bold mb-2">{t('beta.notAccepted')}</h2>
        <p className="text-lg text-gray-600 mb-4">
          {i18n.language === 'nl'
            ? 'Wil je meedoen? Meld je hieronder aan voor de beta!'
            : 'Want to join? Sign up for the beta below!'}
        </p>
        <BetaSignup />
        <button
          className="btn-secondary mt-4"
          onClick={() => supabase.auth.signOut()}
        >
          {i18n.language === 'nl' ? 'Uitloggen' : 'Log out'}
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

export default BetaGate; 