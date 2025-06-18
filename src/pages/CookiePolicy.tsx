import { useTranslation } from 'react-i18next';

const CookiePolicy = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (lang === 'nl') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-primary-700 mb-6">Cookiebeleid</h1>
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          {/* Dutch Cookie Policy content */}
          <p><strong>Inleiding:</strong> In dit Cookiebeleid wordt uitgelegd hoe <strong>Anemi Meets</strong> (beheerd door Max Meinders in Nederland) cookies en vergelijkbare technologieën gebruikt op onze website. Door onze site te gebruiken, stemt u in met het gebruik van cookies zoals beschreven in dit beleid.</p>
          {/* ... (rest of Dutch content, as provided) ... */}
          <p><em>Laatst bijgewerkt: 6 juni 2025</em></p>
        </div>
      </div>
    );
  }
  // Default to English
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">Cookies Policy</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        {/* English Cookie Policy content */}
        <p><strong>Introduction:</strong> This Cookies Policy explains how <strong>Anemi Meets</strong> (operated by Max Meinders in the Netherlands) uses cookies and similar technologies on our website. By using our site, you consent to the use of cookies as described in this policy.</p>
        {/* ... (rest of English content, as provided) ... */}
        <p><em>Last updated: June 6, 2025</em></p>
      </div>
    </div>
  );
};

export default CookiePolicy; 