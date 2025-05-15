import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full py-8 mt-16 flex flex-col items-center text-sm text-gray-500 bg-white/60 backdrop-blur border-t border-gray-200">
    <div className="flex gap-6 mb-2">
      <Link to="/privacy" className="hover:text-primary-600 underline">Privacybeleid</Link>
      <Link to="/cookies" className="hover:text-primary-600 underline">Cookiebeleid</Link>
      <Link to="/terms" className="hover:text-primary-600 underline">Gebruiksvoorwaarden</Link>
    </div>
    <div>&copy; {new Date().getFullYear()} anemi meets</div>
  </footer>
);

export default Footer; 