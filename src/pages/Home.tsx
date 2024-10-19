import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, HelpCircle, RotateCcw, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">{t('welcomeMessage')}</h1>
      <p className="text-xl mb-8">{t('supportPortalDescription')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {user ? (
          <Link to="/create-ticket" className="btn-primary inline-flex items-center justify-center">
            <MessageSquare className="mr-2" />
            {t('createNewTicket')}
          </Link>
        ) : (
          <Link to="/login" className="btn-primary inline-flex items-center justify-center">
            <MessageSquare className="mr-2" />
            {t('loginToCreateTicket')}
          </Link>
        )}
        <Link to="/faq" className="btn-secondary inline-flex items-center justify-center">
          <HelpCircle className="mr-2" />
          {t('viewFAQ')}
        </Link>
        <Link to="/claim" className="btn-secondary inline-flex items-center justify-center">
          <FileText className="mr-2" />
          {t('submitWarrantyCase')}
        </Link>
        <Link to="/return" className="btn-secondary inline-flex items-center justify-center">
          <RotateCcw className="mr-2" />
          {t('createReturn')}
        </Link>
        <Link to="/status" className="btn-secondary inline-flex items-center justify-center col-span-full">
          <Search className="mr-2" />
          {t('checkStatus')}
        </Link>
      </div>
    </div>
  );
};

export default Home;
