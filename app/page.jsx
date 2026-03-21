import React from 'react';
import HeroSection from '../src/components/HeroSection';
import MagicBento from '../src/components/MagicBento';
import ClubIntro from '../src/components/ClubIntro';
import Footer from '../src/components/Footer';

export const metadata = {
  title: 'KLFORGE - Empowering Student Innovation',
  description: 'KLFORGE is an official technical club of KL University focused on open-source, web development, and AI.',
};

export default function HomePage() {
  return (
    <div>
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
