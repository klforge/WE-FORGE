'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProfileCard from '../../src/components/ProfileCard';
import { Mail, Send, Github, Linkedin, ChevronLeft } from 'lucide-react';
import memberService, { findBySlug, nameToSlug } from '../../src/services/memberService';
import BackButton from '../../src/components/BackButton';
import './page.css';

const ProfilePage = () => {
  const { memberId } = useParams();
  const router = useRouter();
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

      <div className="profile-page__layout">
        {/* Left: ProfileCard with tilt */}
        <div className="profile-page__card-col">
          <ProfileCard
            name={profile.name}
            title={profile.role}
            handle={memberId}
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

            <div className="profile-page__social-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', margin: '24px 0', color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <Mail size={16} /> <span>{profile.email}</span>
              </div>
              {profile.github && (
                <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
                  <Github size={16} /> <span>{profile.github}</span>
                </a>
              )}
              {profile.linkedin && (
                <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
                  <Linkedin size={16} /> <span>{profile.linkedin}</span>
                </a>
              )}
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
