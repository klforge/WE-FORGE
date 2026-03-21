'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

const BackButton = ({ onClick, to = '/', className = '', fullWidthMobile = false }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(to);
    }
  };

  const cssClasses = [
    'shared-back-btn',
    fullWidthMobile ? 'shared-back-btn--full-mobile' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={cssClasses} onClick={handleBack} aria-label="Go back">
      <ArrowLeft size={16} strokeWidth={2.5} className="shared-back-btn__icon" />
      <span className="shared-back-btn__text">Back</span>
    </button>
  );
};

export default BackButton;
