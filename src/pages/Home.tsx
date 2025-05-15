import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Home = () => {
  const { t } = useTranslation();
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
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('home.mission')}
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          {t('home.vision')}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStartMeetup}
          className="btn-primary text-lg px-8 py-3"
        >
          {t('common.startMeetup')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">
            Simple Planning
          </h2>
          <p className="text-gray-600">
            Choose your preferred dates and times, and let your friend pick what works best for them.
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">
            Local Cafes
          </h2>
          <p className="text-gray-600">
            Discover cozy cafes in your city, perfect for meaningful conversations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 