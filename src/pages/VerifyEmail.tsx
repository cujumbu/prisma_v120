import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email/${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          setTimeout(() => {
            navigate('/login', { state: { message: t('emailVerificationSuccessful') } });
          }, 3000);
        } else {
          const data = await response.json();
          setError(data.error || t('emailVerificationFailed'));
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setError(t('emailVerificationError'));
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate, t]);

  if (isVerifying) {
    return <div className="text-center mt-8">{t('verifyingEmail')}</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('emailVerification')}</h2>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p className="text-green-500">{t('emailVerificationSuccessful')}</p>
      )}
      <p className="mt-4">{t('redirectingToLogin')}</p>
    </div>
  );
};

export default VerifyEmail;