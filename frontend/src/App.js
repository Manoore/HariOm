import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar, BottomNav, Footer } from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { PriestsListPage, PriestDetailPage } from './pages/PriestPages';
import AstrologyPage from './pages/AstrologyPage';
import { MarketplacePage, CartPage } from './pages/MarketplacePages';
import { FestivalsPage, TemplesPage } from './pages/ContentPages';
import DashboardPage from './pages/DashboardPage';
import { PaymentSuccessPage, PaymentCancelPage } from './pages/PaymentPages';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/priests" element={<PriestsListPage />} />
                <Route path="/priests/:id" element={<PriestDetailPage />} />
                <Route path="/astrology" element={<AstrologyPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/festivals" element={<FestivalsPage />} />
                <Route path="/temples" element={<TemplesPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
