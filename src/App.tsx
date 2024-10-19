import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ClaimForm from './pages/ClaimForm';
import ReturnForm from './pages/ReturnForm';
import ClaimStatus from './pages/ClaimStatus';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import FAQ from './pages/FAQ';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import VerifiedAdminCreation from './pages/VerifiedAdminCreation';
import LanguageSelector from './components/LanguageSelector';
import { AuthProvider } from './context/AuthContext';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam) {
      i18n.changeLanguage(langParam);
    }
  }, [i18n]);

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-2 flex justify-end">
            <LanguageSelector />
          </div>
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/claim" element={<ClaimForm />} />
              <Route path="/return" element={<ReturnForm />} />
              <Route path="/status" element={<ClaimStatus />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/create-verified-admin" element={<VerifiedAdminCreation />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
