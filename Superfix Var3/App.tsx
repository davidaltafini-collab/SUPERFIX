import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componente Principale
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import ScrollToTop from './components/ScrollToTop'; // <--- 1. IMPORTĂ ASTA AICI

// Pagini Principale
import { Home } from './pages/Home';
import { HeroesList } from './pages/HeroesList';
import { HeroProfile } from './pages/HeroProfile';
import { Admin } from './pages/Admin';
import { RegisterHero } from './pages/RegisterHero';
import HeroPortal from './pages/HeroPortal'; 

// Pagini Legale
import { Terms, Privacy, Cookies, GDPR } from './pages/LegalPages';

function App() {
  return (
    <Router>
      {/* <--- 2. PUNE COMPONENTA AICI, IMEDIAT DUPĂ ROUTER */}
      <ScrollToTop /> 

      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Rute Principale */}
            <Route path="/" element={<Home />} />
            <Route path="/heroes" element={<HeroesList />} />
            <Route path="/hero/:id" element={<HeroProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/hero-portal" element={<HeroPortal />} />
            <Route path="/register" element={<RegisterHero />} />

            {/* Rute Legale */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/gdpr" element={<GDPR />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;