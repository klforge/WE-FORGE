import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import memberService, { findBySlug, nameToSlug } from '../services/memberService';
import BackButton from '../components/BackButton';
import './ProfilePage.css';

const ProfilePage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    memberService.getAll()
      .then((data) => {
        setProfile(findBySlug(data, memberId));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return <div className="profile-page"><div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '120px', textAlign: 'center' }}>Loading...</div></div>;
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-page__not-found">
          <h2>Profile not found</h2>
          <BackButton to="/team" fullWidthMobile={true} />
        </div>
      </div>
    );
  }

  const telegramId = profile.telegram;

  const handleContactClick = () => {
    if (telegramId) {
      window.open(`https://t.me/${telegramId.replace('@', '')}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="profile-page">
      <BackButton to="/team" fullWidthMobile={true} />

      <div className="profile-page__layout">
        {/* Left: ProfileCard with tilt */}
        <div className="profile-page__card-col">
          <ProfileCard
            name={profile.name}
            title={profile.role}
            handle={nameToSlug(profile.name)}
            status={profile.status}
            contactText="Contact Me"
            avatarUrl={profile.avatarUrl}
            showUserInfo={true}
            enableTilt={true}
            onContactClick={handleContactClick}
            behindGlowEnabled={false}
            innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
          />
        </div>

        {/* Right: Info */}
        <div className="profile-page__info-col">
          <div className="profile-page__bio-section">
            <h1 className="profile-page__name">{profile.name}</h1>
            <div className="profile-page__role-row">
              <span className="profile-page__title">{profile.role}</span>
              <span className="profile-page__roll-number">{profile.rollNumber}</span>
            </div>
            <p className="profile-page__bio">{profile.bio}</p>

            <div className="profile-page__skills">
              <h3 className="profile-page__section-label">Skills</h3>
              <div className="profile-page__skill-tags">
                {profile.skills.map((skill) => (
                  <span key={skill} className="profile-page__skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
