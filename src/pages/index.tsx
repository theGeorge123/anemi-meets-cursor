import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<nav className="...">
  {/* ... andere links ... */}
  <Link to="/dashboard" className="...">
    {t('dashboard.title')}
  </Link>
</nav> 