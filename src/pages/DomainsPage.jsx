import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DomainsPage.css';

const DomainsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="domains-page">
      <button className="domains-page__back" onClick={() => navigate('/')}>
        <span className="domains-page__back-arrow">&#8592;</span> Back
      </button>

      <div className="domains-page__header">
        <h1 className="domains-page__title">Domains</h1>
        <p className="domains-page__subtitle">
          Automation and streamline workflows.
        </p>
      </div>
    </div>
  );
};

export default DomainsPage;
