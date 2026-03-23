'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight, LogOut, User } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import './Navbar.css';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Team', path: '/team' },
  { name: 'Events', path: '/events' },
  { name: 'Projects', path: '/projects' },
  { name: 'Notices', path: '/notices' },
  { name: 'FAQ', path: '/faq' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on path change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${isOpen ? 'navbar--open' : ''}`}>
      <div className="navbar__container">
        {/* Logo */}
        <Link href="/" className="navbar__logo">
          <img src="/images/favicon.png?v=2" alt="KLFORGE" />
        </Link>

        {/* Desktop Links */}
        <div className="navbar__links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`navbar__link ${pathname === link.path ? 'navbar__link--active' : ''}`}
            >
              {link.name}
              <span className="navbar__link-indicator" />
            </Link>
          ))}
          
          {session ? (
            <div className="navbar__auth-group">
              {session.user.domain === 'Zero Order' && (
                <Link href="/admin/dashboard" className="navbar__link">Admin</Link>
              )}
              <Link href="/profile" className={`navbar__link ${pathname.startsWith('/profile') ? 'navbar__link--active' : ''}`}>
                Profile
              </Link>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="navbar__cta"
            >
              Login <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="navbar__toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`navbar__mobile ${isOpen ? 'navbar__mobile--show' : ''}`}>
        <div className="navbar__mobile-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`navbar__mobile-link ${pathname === link.path ? 'navbar__mobile-link--active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          {session ? (
            <>
              <Link href="/profile" className="navbar__mobile-link">Profile</Link>
              <button 
                onClick={() => signOut()} 
                className="navbar__mobile-link" 
                style={{ 
                  textAlign: 'left', 
                  background: 'rgba(255, 77, 77, 0.1)', 
                  border: 'none', 
                  color: '#ff4d4d',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="navbar__mobile-link navbar__mobile-link--admin">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
