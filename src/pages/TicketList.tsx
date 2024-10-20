import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Ticket {
  id: string;
  orderNumber: string;
  subject: string;
  status: string;
  createdAt: string;
}

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setError(error.message || t('errorFetchingTickets'));
        if (error.message === 'Authentication failed. Please log in again.') {
          // Optionally, you can log out the user and redirect to login page
          // logout();
          // navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [user, t]);

  if (isLoading) {
    return <div className="text-center mt-8">{t('loading')}</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">{t('yourTickets')}</h2>
      <Link to="/create-ticket" className="mb-4 inline-block bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark">
        {t('createNewTicket')}
      </Link>
      {tickets.length === 0 ? (
        <p>{t('noTickets')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('orderNumber')}
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('subject')}
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('createdAt')}
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{ticket.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ticket.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{t(ticket.status.toLowerCase())}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/tickets/${ticket.id}`} className="text-primary hover:text-primary-dark">
                      {t('viewDetails')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketList;
