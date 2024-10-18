import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const NavLinks = () => (
    <>
      <li><Link to="/" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('home')}</Link></li>
      <li><Link to="/claim" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('newWarrantyCase')}</Link></li>
      <li><Link to="/return" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('newReturn')}</Link></li>
      <li><Link to="/faq" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('faq')}</Link></li>
      <li><Link to="/status" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('checkStatus')}</Link></li>
      {user && (
        <li><Link to="/tickets" className="block py-2 hover:text-gray-300" onClick={toggleMenu}>{t('supportTickets')}</Link></li>
      )}
      {user ? (
        <>
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
