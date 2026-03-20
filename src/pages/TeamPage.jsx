import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ExpandableCard from "../components/ExpandableCard";
import memberService, { toTeamCards } from "../services/memberService";
import BackButton from "../components/BackButton";
import "./TeamPage.css";

const TeamPage = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    memberService.getAll()
      .then((data) => setCards(toTeamCards(data)))
      .catch(() => setError('Failed to load team members'));
  }, []);

  return (
    <div className="team-page">
      <div className="team-page__topbar" style={{ padding: '24px 48px 0' }}>
        <BackButton />
      </div>

      <div className="team-page__header">
        <h1 className="team-page__title">Our Team</h1>
        <p className="team-page__subtitle">
          Click on a member to learn more about them
        </p>
      </div>

      {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

      <div className="team-page__cards">
        <ExpandableCard cards={cards} />
      </div>
    </div>
  );
};

export default TeamPage;
