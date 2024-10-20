import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import FAQSection from '../components/FAQSection';

interface ReturnFormData {
  orderNumber: string;
  email: string;
  reason: string;
  description: string;
}

const ReturnForm: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReturnFormData>({
    orderNumber: '',
    email: '',
    reason: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqCompleted, setFaqCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/return' } });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      navigate('/status', { state: { returnId: data.id } });
    } catch (error) {
      console.error('Error submitting return:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      if (error instanceof Response) {
        console.error('Response status:', error.status);
        error.text().then(text => console.error('Response text:', text));
      }
      setError(error instanceof Error ? error.message : t('errorSubmittingReturn'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnFAQs = [
    {
      question: 'returnFAQ.eligibilityQuestion',
      answer: 'returnFAQ.eligibilityAnswer',
    },
    {
      question: 'returnFAQ.processQuestion',
      answer: 'returnFAQ.processAnswer',
    },
    {
      question: 'returnFAQ.refundQuestion',
      answer: 'returnFAQ.refundAnswer',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('createReturn')}</h2>
      
      {!faqCompleted ? (
        <FAQSection faqs={returnFAQs} onComplete={() => setFaqCompleted(true)} />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('orderNumber')}</label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">{t('returnReason')}</label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                <option value="">{t('selectReason')}</option>
                <option value="wrong_size">{t('wrongSize')}</option>
                <option value="defective">{t('defective')}</option>
                <option value="not_as_described">{t('notAsDescribed')}</option>
                <option value="changed_mind">{t('changedMind')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('returnDescription')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
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
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReturnForm;
