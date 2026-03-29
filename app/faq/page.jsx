'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Plus, Minus } from 'lucide-react';
import './page.css';

const faqs = [
  {
    question: "What is this Club About?",
    answer: "Our club is a vibrant community of aspiring developers, designers, and tech enthusiasts. We focus on building projects together, learning new technologies, and fostering an environment of innovation and collaboration."
  },
  {
    question: "How Can I Join the Club?",
    answer: "You can join by participating in our recruitment drives held at the beginning of each semester. Keep an eye on our social media handles and the 'Events' section for registration links and updates."
  },
  {
    question: "What Activities or Topics Does the Club Cover?",
    answer: "We cover a vast array of topics including Full-Stack Web Development, Mobile App Development, Artificial Intelligence, Machine Learning, UI/UX Design, and even Cloud Computing. We hold dedicated sessions for each domain."
  },
  {
    question: "What Events Does the Club Host?",
    answer: "Throughout the year, we host exciting hackathons, hands-on technical workshops, guest lectures from industry experts, ideathons, and internal project showcases to help you build a stellar portfolio."
  },
  {
    question: "How Can I Get More Involved with the Club?",
    answer: "The best way to get involved is to actively participate in our events, contribute to open-source club projects, interact with members on our community channels, and apply for core team positions when available."
  }
];

const FAQPage = () => {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">

      <div className="faq-page__container">
        
        {/* Left Section */}
        <div className="faq-page__left">
          <h1 className="faq-page__title">Frequently Asked Questions</h1>
          
          <div className="faq-page__assistance">
            <p className="faq-page__assist-text">Can't find what you are looking for?</p>
            <h2 className="faq-page__assist-heading">
              We are here to help you.
            </h2>
            <div 
              className="faq-page__chat-icon-wrapper"
              onClick={() => window.location.href = 'mailto:klforge@kluniversity.in?subject=Help%20Request&body=Hi%20KLFORGE%20Team%2C%0A%0A'}
              role="button"
              tabIndex={0}
              title="Email us"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window.location.href = 'mailto:klforge@kluniversity.in?subject=Help%20Request&body=Hi%20KLFORGE%20Team%2C%0A%0A'; }}
            >
              <MessageSquarePlus size={36} className="faq-page__chat-icon" />
            </div>
          </div>
        </div>

        {/* Right Section - Accordion */}
        <div className="faq-page__right">
          <div className="faq-accordion">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                >
                  <button 
                    className="faq-item__header" 
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="faq-item__question">{faq.question}</span>
                    <span className="faq-item__icon">
                      {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="faq-item__content-wrapper"
                      >
                        <div className="faq-item__answer">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FAQPage;
