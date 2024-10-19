import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CreateTicket: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderNumber, subject, message }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();
      navigate(`/tickets/${data.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError(error.message || t('errorCreatingTicket'));
      if (error.message === 'Authentication failed. Please log in again.') {
        // Optionally, you can log out the user and redirect to login page
        // logout();
        // navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-8">{t('pleaseLoginToCreateTicket')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">{t('createNewTicket')}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('orderNumber')}</label>
          <input
            type="text"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">{t('subject')}</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t('message')}</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isSubmitting ? t('submitting') : t('submitTicket')}
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
