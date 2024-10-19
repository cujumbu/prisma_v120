import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const checkUserExistence = async () => {
      try {
        const response = await fetch('/api/users/check');
        if (!response.ok) {
          throw new Error('Failed to check user existence');
        }
        const data = await response.json();
        console.log('User existence check response:', data);
        if (!data.exists) {
          setIsCreatingAdmin(true);
          setError(t('noAdminUserExists'));
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        setError(t('errorCheckingUserExistence'));
      } finally {
        setIsLoading(false);
      }
    };

    checkUserExistence();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (isCreatingAdmin) {
        const response = await fetch('/api/admin/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsCreatingAdmin(false);
          setError(t('adminCreatedSuccessfully'));
          // Automatically verify the admin account
          await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
        } else {
          setError(data.error || t('failedToCreateAdmin'));
        }
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          login(data);
          navigate(data.user.isAdmin ? '/admin' : '/status');
        } else {
          setError(data.error || t('invalidCredentials'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('loginError'));
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8">{t('loading')}</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {isCreatingAdmin ? t('createAdminAccount') : t('login')}
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('email')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {isCreatingAdmin ? t('createAdminAccount') : t('login')}
        </button>
      </form>
    </div>
  );
};

export default Login;
