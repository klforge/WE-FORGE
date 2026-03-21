'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import './Footer.css';

const Footer = () => {
  const router = useRouter();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        {/* Left — logo + CTA */}
        <div className="site-footer__left">
          <img
            src="/images/KLFORGE logo.png"
            alt="KLFORGE"
            className="site-footer__logo"
          />
          <button
            className="site-footer__cta"
            onClick={() => router.push('/team')}
          >
            Join Forge
          </button>
        </div>

        {/* Right — link columns in a card */}
        <div className="site-footer__links-card">
          <div className="site-footer__col">
            <h4>Club</h4>
            <a href="/#what-is-forge">About</a>
            <a href="/team" onClick={(e) => { e.preventDefault(); router.push('/team'); }}>Team</a>
            <a href="/#">Events</a>
            <a href="/#">Projects</a>
          </div>
          <div className="site-footer__col">
            <h4>Resources</h4>
            <a href="/#">Newsletter</a>
            <a href="/faq" onClick={(e) => { e.preventDefault(); router.push('/faq'); }}>FAQ</a>
          </div>
          <div className="site-footer__col">
            <h4>Contact Us</h4>
            <a href="mailto:klforge@kluniversity.in" className="site-footer__contact-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              klforge@kluniversity.in
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="site-footer__divider" />

      {/* Bottom — socials + copyright */}
      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          &copy; {new Date().getFullYear()} KLFORGE. All rights reserved.
        </p>
        <div className="site-footer__socials">
          <span className="site-footer__follow">Follow us on:</span>
          {/* Instagram */}
          <a href="https://www.instagram.com/kl_forge/" target="_blank" rel="noopener noreferrer" className="site-footer__icon" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
          </a>
          {/* LinkedIn */}
          <a href="https://www.linkedin.com/company/kl-forge/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="site-footer__icon" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
          </a>
        </div>
      </div>

      {/* Glow bar pinned to bottom edge */}
      <div className="site-footer__glow"><span /></div>
      <div className="site-footer__glow-haze" />
    </footer>
  );
};

export default Footer;
