'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ExpandableCard from "../../src/components/ExpandableCard";
import memberService, { toTeamCards } from "../../src/services/memberService";
import BackButton from "../../src/components/BackButton";
import "./page.css";

const TeamPage = () => {
  const router = useRouter();
  const [groupedCards, setGroupedCards] = useState({});
  const [domains, setDomains] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [error, setError] = useState('');

  const ROLE_WEIGHTS = {
    'Head of the Department': 1,
    'Alternate Head of Department': 2,
    'President': 3,
    'Chief Secretary': 4,
    'Treasurer': 5,
    'Advisor': 6,
    'Chief': 10,
    'Lead': 20,
    'Core Member': 30,
    'Associate': 40,
    'Student': 100,
    'General': 100
  };

  useEffect(() => {
    memberService.getAll()
      .then((data) => {
        // Filter out general people
        const filtered = data.filter(m => m.domain !== 'General' && m.role !== 'Student');
        
        const uniqueDomains = ['All', ...new Set(filtered.map(m => m.domain || 'General'))].filter(d => d !== 'General');
        setDomains(uniqueDomains);

        // Group and Sort
        const grouped = filtered.sort((a, b) => {
          const wA = ROLE_WEIGHTS[a.role] || 1000;
          const wB = ROLE_WEIGHTS[b.role] || 1000;
          return wA - wB;
        }).reduce((acc, m) => {
          const domain = m.domain || 'General';
          if (!acc[domain]) acc[domain] = [];
          acc[domain].push(m);
          return acc;
        }, {});
        
        const finalGrouped = {};
        Object.keys(grouped).forEach(domain => {
          finalGrouped[domain] = toTeamCards(grouped[domain]);
        });
        
        setGroupedCards(finalGrouped);
      })
      .catch(() => setError('Failed to load team members'));
  }, []);

  return (
    <div className="team-page">

      <div className="team-page__header">
        <h1 className="team-page__title">Our Team</h1>
        <p className="team-page__subtitle">
          Click on a member to learn more about them
        </p>
      </div>

      <div className="team-page__filters">
        {domains.map(domain => (
          <button
            key={domain}
            className={`team-page__filter-pill ${activeFilter === domain ? 'active' : ''}`}
            onClick={() => setActiveFilter(domain)}
          >
            {domain}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

      <div className="team-page__content">
        {Object.entries(groupedCards).length > 0 ? (
          Object.entries(groupedCards)
            .filter(([domain]) => activeFilter === 'All' || activeFilter === domain)
            .map(([domain, cards]) => (
              <div key={domain} className="team-page__domain-section">
                <h2 className="team-page__domain-title">
                  <span className="team-page__domain-dot" />
                  {domain}
                </h2>
                <div className="team-page__cards">
                  <ExpandableCard cards={cards} />
                </div>
              </div>
            ))
        ) : (
          !error && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>No team members found.</p>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
