// import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartMeetup = () => {
      navigate('/create-meetup');
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary-600">anemi meets</h1>
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6 mb-8">
          <button
            type="button"
            onClick={handleStartMeetup}
            className="flex-1 card bg-[#b2dfdb]/80 flex flex-col items-center p-6 min-w-[180px] cursor-pointer transition transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#ff914d]/40"
            style={{ border: '2px solid #b2dfdb' }}
            aria-label={t('home.fillIn')}
          >
            <span className="text-3xl mb-2">📝</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">{t('home.fillIn')}</h2>
            <p className="text-gray-600 text-sm text-center">{t('home.fillInDesc')}</p>
          </button>
          <div className="flex-1 card bg-[#ff914d]/80 flex flex-col items-center p-6 min-w-[180px]">
            <span className="text-3xl mb-2">📤</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">{t('home.send')}</h2>
            <p className="text-gray-600 text-sm text-center">{t('home.sendDesc')}</p>
          </div>
          <div className="flex-1 card bg-[#c5cae9]/80 flex flex-col items-center p-6 min-w-[180px]">
            <span className="text-3xl mb-2">✅</span>
            <h2 className="text-lg font-semibold text-primary-700 mb-1">{t('home.accept')}</h2>
            <p className="text-gray-600 text-sm text-center">{t('home.acceptDesc')}</p>
          </div>
        </div>
        <div className="card bg-white/80 max-w-2xl mx-auto mt-4 mb-8">
          <p className="text-lg text-gray-800 text-center">
            {t('home.tired')}<br/>
            {t('home.oneClick')}<br/>
            {t('home.connectFaster')}
          </p>
        </div>
        <div className="bg-[#b2dfdb]/80 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center gap-2">
            <span role="img" aria-label="connect">🤝</span> {t('home.strengthen')}
          </h2>
          <p className="text-lg text-gray-700 text-center">
            {t('home.firstStep')}<br/>
            <span className="text-2xl">☕️✨</span>
          </p>
          <button
            onClick={handleStartMeetup}
            className="text-lg px-8 py-3 mt-4 rounded-2xl font-semibold shadow-xl bg-[#ff914d] text-white hover:bg-[#ffb184] transition-colors duration-300"
          >
            {t('home.startNow')}
          </button>
        </div>
      </div>
      {/* Speelse gratis-tekst onder de drie vakjes */}
      <div className="mt-8 text-center">
        <span className="inline-block bg-[#fff7f3] text-primary-700 font-extrabold rounded-xl px-8 py-5 shadow text-3xl">
          {t('home.freeText')}
        </span>
      </div>
      {/* Testimonial sectie */}
      <div className="max-w-xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-primary-700 mb-2 text-center">{t('common.testimonialsTitle')}</h2>
        <div className="italic text-gray-700 bg-white/70 rounded-xl p-4 shadow text-center">
          {t('common.testimonial1')}
        </div>
      </div>
    </div>
  );
};

export default Home; 