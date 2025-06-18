import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (lang === 'nl') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-primary-700 mb-6">Privacybeleid</h1>
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          {/* Dutch Privacy Policy content */}
          <p><strong>Inleiding:</strong> Wij van <strong>Anemi Meets</strong> hechten veel waarde aan uw privacy. In dit Privacybeleid wordt uiteengezet hoe wij uw persoonsgegevens verzamelen, gebruiken, opslaan en beschermen wanneer u gebruikmaakt van onze dienst. Anemi Meets wordt beheerd door <strong>Max Meinders</strong> als privé-entiteit in Nederland. Voor de toepasselijke privacywetgeving (zoals de Algemene Verordening Gegevensbescherming – AVG) is Max Meinders de "verwerkingsverantwoordelijke" voor de persoonsgegevens die via Anemi Meets worden verzameld. Als u vragen heeft over dit beleid, kunt u contact met ons opnemen via <a href="mailto:maxmeinders2002@gmail.com">maxmeinders2002@gmail.com</a>.</p>
          {/* ... (rest of Dutch content, as provided) ... */}
          <p><em>Laatst bijgewerkt: 6 juni 2025</em></p>
        </div>
      </div>
    );
  }
  // Default to English
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">Privacy Policy</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        {/* English Privacy Policy content */}
        <p><strong>Introduction:</strong> We at <strong>Anemi Meets</strong> value your privacy. This Privacy Policy outlines how we collect, use, store, and protect your personal data when you use our service. Anemi Meets is operated by <strong>Max Meinders</strong> as a personal entity in the Netherlands. For the purposes of data protection laws (such as the EU General Data Protection Regulation - GDPR), Max Meinders is the "data controller" of your personal data collected via Anemi Meets. If you have any questions about this policy, you can contact us at <a href="mailto:maxmeinders2002@gmail.com">maxmeinders2002@gmail.com</a>.</p>
        {/* ... (rest of English content, as provided) ... */}
        <p><em>Last updated: June 6, 2025</em></p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 