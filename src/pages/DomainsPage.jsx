import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BackButton from '../components/BackButton';
import './DomainsPage.css';

gsap.registerPlugin(ScrollTrigger);

const DOMAINS_DATA = [
  { id: 'tech', title: 'Tech & Innovation', desc: 'Builds products, systems, and technical experiences.' },
  { id: 'media', title: 'Media & Content', desc: 'Handles visuals, coverage, and digital presence.' },
  { id: 'content', title: 'Content & Creation', desc: 'Creates written, creative, and communication material.' },
  { id: 'operations', title: 'Operations', desc: 'Manages execution, events, and coordination.' },
  { id: 'speaking', title: 'Speaking', desc: 'Leads hosting, presenting, and public communication.' }
];

const DomainsPage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const visualRef = useRef(null);
  const structureRef = useRef(null);
  const lineFillRef = useRef(null);
  const branchRefs = useRef([]);
  branchRefs.current = [];

  const addToRefs = (el) => {
    if (el && !branchRefs.current.includes(el)) {
      branchRefs.current.push(el);
    }
  };

  useEffect(() => {
    // 1. Force top scroll position robustly
    window.scrollTo(0, 0);
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    }, 50);

    // Initial drop-in animation (hero visual)
    gsap.fromTo(visualRef.current,
      { y: -150, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out', delay: 0.2 }
    );

    // Hero title circle-mask reveal
    gsap.fromTo('.domains-hero__title-wrap',
      { clipPath: 'circle(0% at 50% 15%)' },
      { clipPath: 'circle(150% at 50% 15%)', duration: 1.8, ease: 'power3.inOut' }
    );
    gsap.fromTo('.domains-hero__desc, .domains-hero__stats',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.4, stagger: 0.2 }
    );

    // Initial Hero Parallax / Tilt on scroll
    // Using ScrollTrigger directly 
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    heroTl.to(visualRef.current, {
      y: 150,
      rotationX: 10,
      scale: 0.95,
      opacity: 0.4,
      ease: 'none'
    }, 0);

    heroTl.to('.domains-hero__content', {
      y: -100,
      opacity: 0,
      ease: 'none'
    }, 0);

    // Center Line Drawing
    gsap.to(lineFillRef.current, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: structureRef.current,
        start: 'top center',
        end: 'bottom bottom',
        scrub: true,
      }
    });

    // Branch animations
    branchRefs.current.forEach((branch, index) => {
      const isLeft = index % 2 === 0;
      const connector = branch.querySelector('.domains-branch__connector');
      const card = branch.querySelector('.domains-branch__card');
      const dot = branch.querySelector('.domains-branch__dot');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: branch,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.fromTo(connector,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: 'power3.out' }
      )
        .fromTo(dot,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' },
          "-=0.2"
        )
        .fromTo(card,
          { autoAlpha: 0, x: isLeft ? 50 : -50 },
          { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' },
          "-=0.4"
        );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="domains-page" ref={pageRef}>
      <div className="domains-page__topbar">
        <BackButton />
      </div>

      {/* ── Hero Section ── */}
      <section className="domains-hero" ref={heroRef}>
        <div className="domains-hero__content">
          <div className="domains-hero__title-wrap">
            <span className="domains-hero__title-our">Our</span>
            <h1 className="domains-hero__title-domains">Domains</h1>
          </div>
          <p className="domains-hero__desc">
            Our domains define how ideas move into action. From building and storytelling to execution and public presence, each branch plays a vital role in shaping the community.
          </p>
          <div className="domains-hero__stats">
            <div className="domains-hero__stat">
              <span className="domains-hero__stat-label">Total</span>
              <span className="domains-hero__stat-value">5 DOMAINS</span>
            </div>
            <div className="domains-hero__stat">
              <span className="domains-hero__stat-label">Status</span>
              <span className="domains-hero__stat-value domains-hero__stat-value--lime">ACTIVE</span>
            </div>
            <div className="domains-hero__stat">
              <span className="domains-hero__stat-label">Architecture</span>
              <span className="domains-hero__stat-value">CORE STRUCTURE</span>
            </div>
          </div>
        </div>

        <div className="domains-hero__visual-wrap" ref={visualRef}>
          <div className="domains-hero__visual">
            <img src="/images/testimg1.jpg" alt="KLForge Domain" className="domains-hero__visual-img" />
            <div className="domains-hero__visual-overlay"></div>
          </div>
        </div>
      </section>

      {/* ── Branching Structure ── */}
      <section className="domains-structure" ref={structureRef}>
        <div className="domains-structure__container">
          <div className="domains-structure__line-wrap">
            <div className="domains-structure__line-fill" ref={lineFillRef}></div>
          </div>

          {DOMAINS_DATA.map((domain, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={domain.id}
                className={`domains-branch domains-branch--${isLeft ? 'left' : 'right'}`}
                ref={addToRefs}
              >
                <div className="domains-branch__connector">
                  <div className="domains-branch__dot"></div>
                </div>
                <div className="domains-branch__card">
                  <span className="domains-branch__index">0{i + 1}</span>
                  <h2 className="domains-branch__title">{domain.title}</h2>
                  <p className="domains-branch__desc">{domain.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DomainsPage;
