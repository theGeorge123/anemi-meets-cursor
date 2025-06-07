import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white flex flex-col items-center">
      {/* Main Hero */}
      <section className="w-full flex flex-col-reverse md:flex-row items-center justify-between max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Left: Text */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-700 mb-4 font-nunito">
            {t('home.title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6 font-lato">
            {t('home.subtitle')}
          </p>
          <Link to="/create-meetup">
            <button className="bg-orange-400 text-white font-bold rounded-full px-8 py-3 text-lg shadow-lg hover:bg-orange-500 transition mb-4">
              {t('home.ctaPlan')}
            </button>
          </Link>
        </div>
        {/* Right: Illustration */}
        <div className="flex-1 flex justify-center mb-8 md:mb-0">
          {/* Replace with your own SVG/illustration */}
          <div className="relative w-64 h-48 md:w-80 md:h-64">
            <svg viewBox="0 0 320 220" fill="none" className="w-full h-full">
              <rect x="10" y="30" width="300" height="180" rx="24" fill="#e0f2f1"/>
              <circle cx="80" cy="80" r="18" fill="#ff914d"/>
              <circle cx="220" cy="120" r="14" fill="#26a69a"/>
              <circle cx="160" cy="170" r="10" fill="#ff914d"/>
              <rect x="70" y="70" width="20" height="20" rx="10" fill="#fff" />
              <rect x="210" y="110" width="16" height="16" rx="8" fill="#fff" />
              <rect x="150" y="160" width="12" height="12" rx="6" fill="#fff" />
              {/* Coffee cup */}
              <ellipse cx="270" cy="60" rx="18" ry="8" fill="#fff" />
              <rect x="258" y="50" width="24" height="12" rx="6" fill="#ff914d" />
              <ellipse cx="270" cy="50" rx="12" ry="5" fill="#fff" />
            </svg>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Step 1 */}
          <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center animate-fade-in">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="font-bold text-lg text-primary-700 mb-2">{t('home.fillIn')}</h3>
            <p className="text-gray-600">{t('home.fillInDesc')}</p>
          </div>
          {/* Step 2 */}
          <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mb-3">
              <span className="text-2xl">📤</span>
            </div>
            <h3 className="font-bold text-lg text-primary-700 mb-2">{t('home.send')}</h3>
            <p className="text-gray-600">{t('home.sendDesc')}</p>
          </div>
          {/* Step 3 */}
          <div className="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-bold text-lg text-primary-700 mb-2">{t('home.accept')}</h3>
            <p className="text-gray-600">{t('home.acceptDesc')}</p>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="w-full max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-primary-700 mb-4 text-center">{t('common.testimonialsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center border-2 border-orange-200" style={{ width: 180, height: 180 }}>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <span className="text-2xl">😊</span>
            </div>
            <blockquote className="text-base text-gray-700 font-medium italic text-center mt-2">
              {t('home.testimonial')}
            </blockquote>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center border-2 border-orange-200" style={{ width: 180, height: 180 }}>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <span className="text-2xl">☕️</span>
            </div>
            <blockquote className="text-base text-gray-700 font-medium italic text-center mt-2">
              “I love how easy it is to pick a café!”
            </blockquote>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center border-2 border-orange-200" style={{ width: 180, height: 180 }}>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <span className="text-2xl">🎉</span>
            </div>
            <blockquote className="text-base text-gray-700 font-medium italic text-center mt-2">
              “No more endless group chats. Just coffee!”
            </blockquote>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center border-2 border-orange-200" style={{ width: 180, height: 180 }}>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <span className="text-2xl">💬</span>
            </div>
            <blockquote className="text-base text-gray-700 font-medium italic text-center mt-2">
              “Finally found a way to actually meet up with friends!”
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
