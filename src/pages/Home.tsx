// import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Home = () => {
  const navigate = useNavigate();

  const handleStartMeetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      navigate('/create-meetup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary-600">anemi meets</h1>
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6 mb-8">
          <div className="flex-1 card bg-[#b2dfdb]/80 flex flex-col items-center p-6 min-w-[180px]">
            <span className="text-3xl mb-2">📝</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">Invullen</h2>
            <p className="text-gray-600 text-sm text-center">Vul je naam, e-mail en favoriete data in.</p>
          </div>
          <div className="flex-1 card bg-[#ff914d]/80 flex flex-col items-center p-6 min-w-[180px]">
            <span className="text-3xl mb-2">📤</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">Versturen</h2>
            <p className="text-gray-600 text-sm text-center">Stuur de uitnodiging met één klik naar je vriend(in).</p>
          </div>
          <div className="flex-1 card bg-[#c5cae9]/80 flex flex-col items-center p-6 min-w-[180px]">
            <span className="text-3xl mb-2">✅</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">Accepteren</h2>
            <p className="text-gray-600 text-sm text-center">Je vriend kiest en bevestigt de beste tijd. Klaar!</p>
          </div>
        </div>
        <div className="card bg-white/80 max-w-2xl mx-auto mt-4 mb-8">
          <p className="text-lg text-gray-800 text-center">
            Moe van het eindeloze appen over waar, wanneer en hoe laat?<br/>
            Met Anemi Meets plan je in één klik een ontmoeting die werkt voor jullie allebei.<br/>
            Jij verbindt sneller ⚡️ — en lokale plekken bloeien mee 🏙️.
          </p>
        </div>
        <div className="bg-[#b2dfdb]/80 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center gap-2">
            <span role="img" aria-label="connect">🤝</span> Versterk de connectie
          </h2>
          <p className="text-lg text-gray-700 text-center">
            Zet vandaag de eerste stap naar meer echte ontmoetingen.<br/>
            <span className="text-2xl">☕️✨</span>
          </p>
          <button
            onClick={handleStartMeetup}
            className="text-lg px-8 py-3 mt-4 rounded-2xl font-semibold shadow-xl bg-[#ff914d] text-white hover:bg-[#ffb184] transition-colors duration-300"
          >
            Start nu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 