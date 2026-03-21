'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from '../src/components/Navbar';
import PixelSnow from '../src/components/PixelSnow';
import AuthProvider from '../src/components/AuthProvider';
import './globals.css';

gsap.registerPlugin(ScrollTrigger);

export default function RootLayout({ children }) {
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
    <html lang="en">
      <body>
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', opacity: 0.6 }}>
          <PixelSnow 
            variant="round" 
            density={0.04} 
            speed={0.15} 
            flakeSize={0.004} 
            brightness={0.3}
            color="#71C4FF"
          />
        </div>
        <AuthProvider>
          <HelmetProvider>
            <Navbar />
            {children}
          </HelmetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
