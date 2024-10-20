import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendStatusUpdateEmail } from '../utils/emailService';
import { X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Claim {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phoneNumber: string;
  brand: string;
  problemDescription: string;
  status: string;
  submissionDate: string;
}

interface Return {
  id: string;
  orderNumber: string;
  email: string;
  reason: string;
  description: string;
  status: string;
  submissionDate: string;
}

interface Ticket {
  id: string;
  orderNumber: string;
  subject: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
  messages: {
    id: string;
    content: string;
    createdAt: string;
    isAdminReply: boolean;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Claim | Return | Ticket)[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Claim | Return | Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'claims' | 'returns' | 'tickets'>('claims');
  const [replyMessage, setReplyMessage] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [claimsResponse, returnsResponse, ticketsResponse] = await Promise.all([
          fetch('/api/claims', { headers }),
          fetch('/api/returns', { headers }),
          fetch('/api/admin/tickets', { headers }),
        ]);

        if (!claimsResponse.ok || !returnsResponse.ok || !ticketsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [claimsData, returnsData, ticketsData] = await Promise.all([
          claimsResponse.json(),
          returnsResponse.json(),
          ticketsResponse.json(),
        ]);

        setClaims(claimsData);
        setReturns(returnsData);
        setTickets(ticketsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error && error.message === 'No authentication token found') {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    let items: (Claim | Return | Ticket)[] = [];
    switch (activeTab) {
      case 'claims':
        items = claims;
        break;
      case 'returns':
        items = returns;
        break;
      case 'tickets':
        items = tickets;
        break;
    }

    const filtered = items.filter(item => 
      (statusFilter ? item.status === statusFilter : true) &&
      (searchTerm ? item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    );
    setFilteredItems(filtered);
  }, [statusFilter, searchTerm, claims, returns, tickets, activeTab]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint = '';
      let updatedItems: (Claim | Return | Ticket)[] = [];

      switch (activeTab) {
        case 'claims':
          endpoint = `/api/claims/${id}`;
          updatedItems = claims.map(claim =>
            claim.id === id ? { ...claim, status: newStatus } : claim
          );
          setClaims(updatedItems as Claim[]);
          break;
        case 'returns':
          endpoint = `/api/returns/${id}`;
          updatedItems = returns.map(returnItem =>
            returnItem.id === id ? { ...returnItem, status: newStatus } : returnItem
          );
          setReturns(updatedItems as Return[]);
          break;
        case 'tickets':
          endpoint = `/api/admin/tickets/${id}`;
          updatedItems = tickets.map(ticket =>
            ticket.id === id ? { ...ticket, status: newStatus } : ticket
          );
          setTickets(updatedItems as Ticket[]);
          break;
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedItem = await response.json();

      // Update the selected item if it's currently being viewed
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }

      // Send email notification
      if (activeTab !== 'tickets') {
        await sendStatusUpdateEmail(updatedItem.email, updatedItem.orderNumber, newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      if (error instanceof Error && error.message === 'No authentication token found') {
        navigate('/login');
      }
    }
  };

  const handleViewDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let endpoint = '';
      switch (activeTab) {
        case 'claims':
          endpoint = `/api/claims/${id}`;
          break;
        case 'returns':
          endpoint = `/api/returns/${id}`;
          break;
        case 'tickets':
          endpoint = `/api/tickets/${id}`;
          break;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      const itemDetails = await response.json();
      setSelectedItem(itemDetails);
    } catch (error) {
      console.error('Error fetching details:', error);
      if (error instanceof Error && error.message === 'No authentication token found') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketReply = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Awaiting User Reply', message: replyMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to reply to ticket');
      }

      const updatedTicket = await response.json();
      setTickets(prevTickets => prevTickets.map(ticket =>
        ticket.id === id ? updatedTicket : ticket
      ));
      setSelectedItem(updatedTicket);
      setReplyMessage('');

      // Send email notification to the user
      if (updatedTicket.user && updatedTicket.user.email) {
        await sendStatusUpdateEmail(updatedTicket.user.email, updatedTicket.orderNumber, 'Awaiting User Reply');
      } else {
        console.error('User email not found for ticket:', updatedTicket.id);
      }
    } catch (error) {
      console.error('Error replying to ticket:', error);
      if (error instanceof Error && error.message === 'No authentication token found') {
        navigate('/login');
      }
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setReplyMessage('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('adminDashboard')}</h1>
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'claims' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('claims')}
        >
          {t('claims')}
        </button>
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'returns' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('returns')}
        >
          {t('returns')}
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'tickets' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('tickets')}
        >
          {t('tickets')}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label htmlFor="statusFilter" className="mr-2">{t('filterByStatus')}:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">{t('all')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="In Progress">{t('inProgress')}</option>
            <option value="Resolved">{t('resolved')}</option>
            <option value="Rejected">{t('rejected')}</option>
            {activeTab === 'tickets' && (
              <>
                <option value="Open">{t('open')}</option>
                <option value="Awaiting User Reply">{t('awaitingUserReply')}</option>
                <option value="Awaiting Admin Reply">{t('awaitingAdminReply')}</option>
                <option value="Closed">{t('closed')}</option>
              </>
            )}
          </select>
        </div>
        <div className="flex-grow">
          <label htmlFor="searchInput" className="mr-2">{t('searchByOrderNumber')}:</label>
          <div className="relative">
            <input
              id="searchInput"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('enterOrderNumber')}
              className="border rounded p-1 pl-8 w-full"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('orderNumber')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('email')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.orderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{('email' in item) ? item.email : (item as Ticket).user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="mr-2 mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Pending">{t('pending')}</option>
                    <option value="In Progress">{t('inProgress')}</option>
                    <option value="Resolved">{t('resolved')}</option>
                    <option value="Rejected">{t('rejected')}</option>
                    {activeTab === 'tickets' && (
                      <>
                        <option value="Open">{t('open')}</option>
                        <option value="Awaiting User Reply">{t('awaitingUserReply')}</option>
                        <option value="Awaiting Admin Reply">{t('awaitingAdminReply')}</option>
                        <option value="Closed">{t('closed')}</option>
                      </>
                    )}
                  </select>
                  <button
                    onClick={() => handleViewDetails(item.id)}
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {t('viewDetails')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {activeTab === 'claims' ? t('claimDetails') : activeTab === 'returns' ? t('returnDetails') : t('ticketDetails')}
              </h3>
              {isLoading ? (
                <p>{t('loading')}</p>
              ) : (
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    <strong>{t('orderNumber')}:</strong> {selectedItem.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>{t('email')}:</strong> {('email' in selectedItem) ? selectedItem.email : (selectedItem as Ticket).user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>{t('status')}:</strong> {selectedItem.status}
                  </p>
                  {'submissionDate' in selectedItem && (
                    <p className="text-sm text-gray-500">
                      <strong>{t('submissionDate')}:</strong> {new Date(selectedItem.submissionDate).toLocaleString()}
                    </p>
                  )}
                  {'createdAt' in selectedItem && (
                    <p className="text-sm text-gray-500">
                      <strong>{t('createdAt')}:</strong> {new Date(selectedItem.createdAt).toLocaleString()}
                    </p>
                  )}
                  {'name' in selectedItem && (
                    <>
                      <p className="text-sm text-gray-500">
                        <strong>{t('name')}:</strong> {selectedItem.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('phoneNumber')}:</strong> {selectedItem.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('brand')}:</strong> {selectedItem.brand}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>{t('problemDescription')}:</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1 text-left">
                        {selectedItem.problemDescription}
                      </p>
                    </>
                  )}
                  {'reason' in selectedItem && (
                    <>
                      <p className="text-sm text-gray-500">
                        <strong>{t('returnReason')}:</strong> {t(selectedItem.reason)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>{t('returnDescription')}:</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1 text-left">
                        {selectedItem.description}
                      </p>
                    </>
                  )}
                  {'messages' in selectedItem && (
                    <>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">{t('messages')}:</h4>
                        {selectedItem.messages.map((message, index) => (
                          <div key={index} className={`mt-2 p-2 rounded ${message.isAdminReply ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <p className="text-sm text-gray-800">{message.content}</p>
                            <p className="text-xs text-gray-500">
                              {message.isAdminReply ? t('adminReply') : t('userMessage')} - {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      {selectedItem.status !== 'Closed' && (
                        <div className="mt-4">
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={t('typeYourReply')}
                            className="w-full p-2 border rounded"
                            rows={3}
                          ></textarea>
                          <button
                            onClick={() => handleTicketReply(selectedItem.id)}
                            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          >
                            {t('sendReply')}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="items-center px-4 py-3">
              <button
                id="ok-btn"
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={closeModal}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
