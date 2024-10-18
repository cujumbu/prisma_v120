import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Case {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
  status: string;
  submissionDate: string;
  type: 'claim' | 'return';
}

const ClaimStatus: React.FC = () => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const caseId = location.state?.claimId || location.state?.returnId;
    if (caseId) {
      fetchCase(caseId);
    }
  }, [location]);

  const fetchCase = async (id: string) => {
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'errorFetchingCase');
      }
      const data = await response.json();
      setCaseData(data);
    } catch (error) {
      console.error('Error fetching case:', error);
      setError(t(error.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCaseData(null);
    try {
      const response = await fetch(`/api/cases?orderNumber=${orderNumber}&email=${email}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'errorFetchingCase');
      }
      const data = await response.json();
      setCaseData(data);
    } catch (error) {
      console.error('Error fetching case:', error);
      setError(t(error.message));
    }
  };

  const getTranslatedStatus = (status: string) => {
    const statusKey = status.toLowerCase().replace(/\s+/g, '');
    return t(statusKey);
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('checkCaseStatus')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('orderNumber')}</label>
          <input
            type="text"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {t('checkStatus')}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {caseData && (
        <div className="mt-8 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('caseStatus')}</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orderNumber')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('name')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('status')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{getTranslatedStatus(caseData.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('submissionDate')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(caseData.submissionDate).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('caseType')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{t(caseData.type)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default ClaimStatus;