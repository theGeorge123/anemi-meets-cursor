import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (lang === 'nl') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-primary-700 mb-6">Algemene Voorwaarden</h1>
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          {/* Dutch Terms and Conditions content */}
          <p><strong>Inleiding & Acceptatie van de Voorwaarden:</strong> Welkom bij <strong>Anemi Meets</strong>! Deze Algemene Voorwaarden (“<strong>Voorwaarden</strong>”) zijn van toepassing op uw toegang tot en gebruik van de Anemi Meets-website en -diensten (de “<strong>Dienst</strong>”). Door Anemi Meets te gebruiken (of u nu op de site surft, een account aanmaakt of een meetup plant), gaat u akkoord met deze Voorwaarden. Als u niet akkoord gaat met deze Voorwaarden, maak dan geen gebruik van onze Dienst. Anemi Meets wordt geëxploiteerd door <strong>Max Meinders</strong>, een individuele (particuliere) aanbieder gevestigd in Nederland. In deze Voorwaarden verwijzen “wij”, “ons” of “onze” naar Anemi Meets/Max Meinders, en verwijzen “u” of “gebruiker” naar iedere persoon die de Dienst gebruikt.</p>
          {/* ... (rest of Dutch content, as provided) ... */}
          <p><em>Laatst bijgewerkt: 6 juni 2025</em></p>
        </div>
      </div>
    );
  }
  // Default to English
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">Terms and Conditions</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        {/* English Terms and Conditions content */}
        <p><strong>Introduction & Acceptance of Terms:</strong> Welcome to <strong>Anemi Meets</strong>! These Terms and Conditions (“<strong>Terms</strong>”) govern your access to and use of the Anemi Meets website and services (“<strong>Service</strong>”). By using Anemi Meets (whether by browsing the site, creating an account, or planning a meetup), you agree to be bound by these Terms. If you do not agree with these Terms, please do not use our Service. Anemi Meets is operated by <strong>Max Meinders</strong>, a personal individual entity based in the Netherlands. In these Terms, “we”, “us”, or “our” refer to Anemi Meets/Max Meinders, and “you” or “user” refers to any person using the Service.</p>
        {/* ... (rest of English content, as provided) ... */}
        <p><em>Last updated: June 6, 2025</em></p>
      </div>
    </div>
  );
};

export default Terms; 