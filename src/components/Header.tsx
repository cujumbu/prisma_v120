import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [latestTicket, setLatestTicket] = useState<{ id: string, status: string } | null>(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('No token found');
            return;
          }
          const response = await fetch('/api/tickets/updates', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setHasUpdates(data.hasUpdates);
            setLatestTicket(data.latestTicket);
          } else {
            const errorData = await response.json();
            console.error('Failed to check for updates:', errorData.error);
          }
        } catch (error) {
          console.error('Error checking for ticket updates:', error);
        }
      }
    };

    checkForUpdates();
    // Set up an interval to check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleTicketClick = async () => {
    if (latestTicket) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        await fetch(`/api/tickets/${latestTicket.id}/view`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setHasUpdates(false);
        navigate(`/tickets/${latestTicket.id}`);
      } catch (error) {
        console.error('Error marking ticket as viewed:', error);
      }
    } else {
      navigate('/tickets');
    }
  };

  const NavLinks = () => (
    <>
      <li><Link to="/" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('home')}</Link></li>
      <li><Link to="/claim" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('newWarrantyCase')}</Link></li>
      <li><Link to="/return" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('newReturn')}</Link></li>
      <li><Link to="/faq" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('faq')}</Link></li>
      <li><Link to="/status" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('checkStatus')}</Link></li>
      {user ? (
        <>
          <li>
            <button onClick={handleTicketClick} className="block py-2 hover:text-gray-300 relative">
              {t('supportTickets')}
              {hasUpdates && (
                <Bell className="inline-block ml-2 text-yellow-400" size={16} />
              )}
            </button>
          </li>
          {user.isAdmin && (
            <li><Link to="/admin" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('admin')}</Link></li>
          )}
          <li><button onClick={() => { logout(); toggleMenu(); }} className="block w-full text-left py-2 hover:text-gray-300">{t('logout')}</button></li>
        </>
      ) : (
        <>
          <li><Link to="/login" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('login')}</Link></li>
          <li><Link to="/register" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('register')}</Link></li>
        </>
      )}
    </>
  );

  return (
    <header className="bg-topnav text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <ShieldCheck size={24} />
            <span className="text-xl font-bold">{t('supportPortal')}</span>
          </Link>
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-white focus:outline-none">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-4">
              <NavLinks />
            </ul>
          </nav>
        </div>
        {isMenuOpen && (
          <nav className="md:hidden mt-4">
            <ul className="flex flex-col space-y-2">
              <NavLinks />
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
