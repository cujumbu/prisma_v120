import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, HelpCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">{t('welcomeMessage')}</h1>
      <p className="text-xl mb-8">{t('supportPortalDescription')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/claim" className="btn-primary inline-flex items-center justify-center">
          <FileText className="mr-2" />
          {t('submitWarrantyCase')}
        </Link>
        <Link to="/return" className="btn-primary inline-flex items-center justify-center">
          <RotateCcw className="mr-2" />
          {t('createReturn')}
        </Link>
        <Link to="/faq" className="btn-secondary inline-flex items-center justify-center">
          <HelpCircle className="mr-2" />
          {t('viewFAQ')}
        </Link>
        <Link to="/status" className="btn-secondary inline-flex items-center justify-center">
          <Search className="mr-2" />
          {t('checkStatus')}
        </Link>
      </div>
    </div>
  );
};

export default Home;