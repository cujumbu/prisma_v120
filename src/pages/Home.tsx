import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Search, HelpCircle, RotateCcw, MessageSquare, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stateMessage = location.state?.message;
    if (stateMessage) {
      setMessage(stateMessage);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">{t('welcomeMessage')}</h1>
      {message && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8" role="alert">
          <p>{message}</p>
        </div>
      )}
      <p className="text-xl mb-8">{t('supportPortalDescription')}</p>
      
      {!user && (
        <div className="mb-8 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>{t('loginRequiredMessage')}</p>
          <Link to="/login" className="text-blue-700 hover:text-blue-900 font-bold">
            {t('loginHere')}
          </Link>
          {' '}{t('or')}{' '}
          <Link to="/register" className="text-blue-700 hover:text-blue-900 font-bold">
            {t('registerHere')}
          </Link>
        </div>
      )}

      {user ? (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('yourOptions')}</h2>
          <ul className="list-disc list-inside text-left max-w-md mx-auto">
            <li>{t('submitTicketDescription')}</li>
            <li>{t('createClaimDescription')}</li>
            <li>{t('createReturnDescription')}</li>
          </ul>
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('availableActions')}</h2>
          <p>{t('loginToAccessAllFeatures')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {user ? (
          <Link to="/create-ticket" className="btn-primary inline-flex items-center justify-center">
            <MessageSquare className="mr-2" />
            {t('createNewTicket')}
          </Link>
        ) : (
          <Link to="/login" className="btn-primary inline-flex items-center justify-center">
            <LogIn className="mr-2" />
            {t('loginToAccess')}
          </Link>
        )}
        <Link to="/faq" className="btn-secondary inline-flex items-center justify-center">
          <HelpCircle className="mr-2" />
          {t('viewFAQ')}
        </Link>
        <Link to={user ? "/claim" : "/login"} className="btn-secondary inline-flex items-center justify-center">
          <FileText className="mr-2" />
          {user ? t('submitWarrantyCase') : t('loginToSubmitWarrantyCase')}
        </Link>
        <Link to={user ? "/return" : "/login"} className="btn-secondary inline-flex items-center justify-center">
          <RotateCcw className="mr-2" />
          {user ? t('createReturn') : t('loginToCreateReturn')}
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
