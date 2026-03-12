import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './components/HeroSection';
import MagicBento from './components/MagicBento';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Footer from './components/Footer';
import DomainsPage from './pages/DomainsPage';
import FAQPage from './pages/FAQPage';
import ClubIntro from './components/ClubIntro';

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  return (
    <div>
      {/* Navbar can be added here later */}
      <HeroSection />
      <div className="hero-spacer" />
      <ClubIntro />
      <section className="bento-wrapper">
        <MagicBento
          textAutoHide={true}
          enableStars
          enableSpotlight={false}
          enableBorderGlow={false}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="255, 255, 255"
          disableAnimations={false}
        />
      </section>
      <div className="footer-separator" />
      <Footer />
    </div>
  );
}

function App() {
  const location = useLocation();

  useEffect(() => {
    // Disable Lenis on admin routes to prevent scroll hijacking
    if (location.pathname.startsWith('/admin')) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
    };
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/domains" element={<DomainsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/:memberId" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;
