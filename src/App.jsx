import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from './components/HeroSection';
import MagicBento from './components/MagicBento';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DomainsPage from './pages/DomainsPage';
import FAQPage from './pages/FAQPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import NoticesPage from './pages/NoticesPage';
import ProjectsPage from './pages/ProjectsPage';
import FacultiesPage from './pages/FacultiesPage';
import ClubIntro from './components/ClubIntro';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  return (
    <div>
      <Helmet>
        <title>KLFORGE - Empowering Student Innovation</title>
        <meta name="description" content="KLFORGE is an official technical club of KL University focused on open-source, web development, and AI." />
      </Helmet>
      {/* Navbar can be added here later */}
      <HeroSection />
      <div className="hero-spacer" />
      <ClubIntro>
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
      </ClubIntro>
      <div className="footer-separator" />
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
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
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/domains" element={<DomainsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/notices" element={<NoticesPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/faculties" element={<FacultiesPage />} />
      <Route path="/:memberId" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;
