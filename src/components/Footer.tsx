import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>{t('footerText', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};

export default Footer;