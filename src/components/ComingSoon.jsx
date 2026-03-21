'use client';
import React from 'react';

import { Clock } from 'lucide-react';
import BackButton from './BackButton';
import './ComingSoon.css';

const ComingSoon = ({ title, message, theme = 'default' }) => {

  return (
    <div className={`coming-soon-page ${theme === 'cyan' ? 'coming-soon-page--cyan' : ''}`}>
      <div className="coming-soon-page__topbar">
        <BackButton />
      </div>
      <div className="coming-soon-page__content">
        <div className="coming-soon-page__icon">
          <Clock size={48} strokeWidth={1.5} />
        </div>
        <h1 className="coming-soon-page__title">{title}</h1>
        <p className="coming-soon-page__message">
          {message || 'We’re preparing this section and it will be available soon.'}
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
