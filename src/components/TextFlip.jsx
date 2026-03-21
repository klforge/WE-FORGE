'use client';
import React, { useState, useEffect } from 'react';
import './TextFlip.css';

const TextFlip = ({ text = 'KL', words = ['FORGE', 'EL&GE'], duration = 2000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!words || words.length < 2) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [duration, words.length]);

  return (
    <span className="text-flip" aria-label={`${text} ${words.join(', ')}`}>
      {text && <span className="text-flip__static" aria-hidden="true">{text}</span>}
      <span className="text-flip__box" aria-hidden="true">
        <span key={currentIndex} className="text-flip__word">
          {words[currentIndex]}
        </span>
      </span>
    </span>
  );
};

export default TextFlip;
