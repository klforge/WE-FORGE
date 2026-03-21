'use client';
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Bell } from 'lucide-react';
import TextFlip from './TextFlip';
import noticeService from '../services/noticeService';
import './HeroSection.css';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const heroRef = useRef(null);
  const cardRef = useRef(null);
  const [latestNotice, setLatestNotice] = useState(null);

  useEffect(() => {
    noticeService.getAll().then(data => {
      if (data && data.length > 0) {
        setLatestNotice(data[0]);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    const card = cardRef.current;
    if (!el || !card) return;

    // Hero fade out on scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / (vh * 0.8), 1);

      el.style.opacity = 1 - progress;
      el.style.transform = `translateY(-${progress * 60}px) scale(${1 - progress * 0.05})`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Card: starts hidden below, slides up smoothly on scroll
    gsap.set(card, { y: 80, opacity: 0 });
    gsap.to(card, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.hero-spacer',
        start: 'top 90%',
        end: 'top 50%',
        scrub: 0.6,
      },
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__container">
        {/* Hero image placeholder */}
        <div className="hero__image-wrapper">
          <img
            className="hero__image"
            src="/images/herosection.jpg"
            alt="Children looking at camera"
          />
          <div className="hero__overlay" />

          {/* Text overlay */}
          <div className="hero__content">
            <div className="hero__text">
              {/* Notice Toast */}
              {latestNotice && (
                <div className="hero__notice-wrapper">
                  <a href="/notices" className="hero__notice-toast">
                    <span className="hero__notice-icon">
                      <Bell size={14} />
                    </span>
                    <span className="hero__notice-title">{latestNotice.title}&nbsp;</span>
                    <span className="hero__notice-msg">— {latestNotice.message}</span>
                    <span className="hero__notice-arrow">→</span>
                  </a>
                </div>
              )}
              <h1 className="hero__heading">
                <span className="hero__label">WE ARE </span>
                <TextFlip
                  text="KL"
                  words={['FORGE', 'EL&GE']}
                  duration={2000}
                />
              </h1>
              <p className="hero__description">
                Building ideas, forging futures — one project at a time.
              </p>
            </div>

            {/* Floating card */}
            <div className="hero__card" ref={cardRef}>
              <div className="hero__card-image">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&q=80"
                  alt="About our club"
                />
              </div>
              <div className="hero__card-body">
                <h3 className="hero__card-title">
                  Register for events
                </h3>
                <a href="/events" className="hero__card-link">
                  click here
                  <span className="hero__card-arrow">&#8599;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
