import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isAdminReply: boolean;
}

interface Ticket {
  id: string;
  orderNumber: string;
  subject: string;
  status: string;
  createdAt: string;
  messages: Message[];
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch ticket');
        }

        const data = await response.json();
        setTicket(data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError(t('errorFetchingTicket'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user && id) {
      fetchTicket();
    }
  }, [user, id, t]);

  const handleSubmitMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setTicket(prevTicket => {
        if (prevTicket) {
          return {
            ...prevTicket,
            messages: [...prevTicket.messages, data],
            status: 'Awaiting Admin Reply',
          };
        }
        return prevTicket;
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('errorSendingMessage'));
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8">{t('loading')}</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (!ticket) {
    return <div className="text-center mt-8">{t('ticketNotFound')}</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">{t('ticketDetails')}</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <p><strong>{t('orderNumber')}:</strong> {ticket.orderNumber}</p>
          <p><strong>{t('subject')}:</strong> {ticket.subject}</p>
          <p><strong>{t('status')}:</strong> {t(ticket.status.toLowerCase())}</p>
          <p><strong>{t('createdAt')}:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">{t('messages')}</h3>
          {ticket.messages.map((message) => (
            <div key={message.id} className={`mb-2 p-2 rounded ${message.isAdminReply ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <p>{message.content}</p>
              <p className="text-xs text-gray-500">
                {message.isAdminReply ? t('adminReply') : t('yourMessage')} - {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {ticket.status !== 'Closed' && (
          <form onSubmit={handleSubmitMessage} className="mt-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
              placeholder={t('typeYourMessage')}
              required
            ></textarea>
            <button
              type="submit"
              className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
            >
              {t('sendMessage')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;