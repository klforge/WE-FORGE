'use client';
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Hash, Calendar, Edit3, Save, X, LogOut, ChevronRight, Camera, Shield, Code, Search, ExternalLink, Package, Github, Linkedin, Send } from 'lucide-react';
import './page.css';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [member, setMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', skills: '', telegram: '', github: '', linkedin: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [mRes, eRes] = await Promise.all([
        fetch('/api/members/me'),
        fetch('/api/members/me/registrations')
      ]);
      const mData = await mRes.json();
      const eData = await eRes.json();
      console.log('[Profile] Fetched member:', mData);
      
      setMember(mData);
      setEvents(eData);
      setEditForm({ 
        bio: mData.bio || '', 
        skills: (mData.skills || []).join(', '), 
        telegram: mData.telegram || '',
        github: mData.github || '',
        linkedin: mData.linkedin || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('[DEBUG] handleSave CALLED');
    console.log('[DEBUG] editForm state:', editForm);
    setSaving(true);
    try {
      const res = await fetch('/api/members/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editForm.bio.trim(),
          telegram: editForm.telegram.trim(),
          github: editForm.github.trim(),
          linkedin: editForm.linkedin.trim(),
          skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const updated = await res.json();
        console.log('[Profile] Update response:', updated);
        alert("Profile saved successfully!");
        setMember(updated);
        setIsEditing(false);
      } else {
        const errData = await res.json();
        console.error('[Profile] Update error data:', errData);
        alert("Server error: " + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  const domain = member.domain || 'General';
  const isElite = domain === 'Zero Order' || domain === 'Advisor';

  return (
    <div className={`profile-container ${isElite ? 'profile-container--elite' : ''}`}>
      <div className="profile-header">
        <div className="profile-header__info">
          <div className="profile-avatar">
            <img src={member.photoUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} />
          </div>
          <div>
            <h1>{member.name}</h1>
            <p className="profile-role">{member.role} • {member.department}</p>
          </div>
        </div>
        <div className="profile-actions">
          {isElite && (
            <button onClick={() => router.push('/admin/dashboard')} className="edit-btn" style={{ marginRight: 12 }}>
              <Shield size={16} /> Manage Club (Admin)
            </button>
          )}
          <button onClick={() => signOut()} className="logout-btn">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Info */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Personal Information</h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="edit-btn"><Edit3 size={14}/> Edit</button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSave} disabled={saving} className="save-btn"><Save size={14}/> {saving ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setIsEditing(false)} className="cancel-btn"><X size={14}/></button>
              </div>
            )}
          </div>

          <div className="info-list">
            <div className="info-item">
              <Mail size={16} /> <span>{member.email}</span>
            </div>
            <div className="info-item">
              <Hash size={16} /> <span>{member.rollNumber}</span>
            </div>
            {member.github && (
              <a href={`https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="info-item info-item--link">
                <Github size={16} /> <span>{member.github}</span>
              </a>
            )}
            {member.linkedin && (
              <a href={`https://linkedin.com/in/${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="info-item info-item--link">
                <Linkedin size={16} /> <span>{member.linkedin}</span>
              </a>
            )}
          </div>

          <div className="bio-box">
            <label>Bio</label>
            {isEditing ? (
              <textarea 
                value={editForm.bio} 
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p>{member.bio || 'No bio added yet.'}</p>
            )}
          </div>

          <div className="skills-box">
            <label>Skills (comma separated)</label>
            {isEditing ? (
              <input 
                value={editForm.skills} 
                onChange={e => setEditForm({...editForm, skills: e.target.value})}
                placeholder="React, Design, Python..."
              />
            ) : (
              <div className="skill-tags">
                {member.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                {(!member.skills || member.skills.length === 0) && <span className="empty">No skills listed.</span>}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="social-edit-box" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Social Profiles</h3>
              <div className="social-field">
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Telegram Username</label>
                <input style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }} value={editForm.telegram} onChange={e => setEditForm({...editForm, telegram: e.target.value})} placeholder="e.g. johndoe" />
              </div>
              <div className="social-field">
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>GitHub Username</label>
                <input style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }} value={editForm.github} onChange={e => setEditForm({...editForm, github: e.target.value})} placeholder="e.g. johndoe" />
              </div>
              <div className="social-field">
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>LinkedIn ID</label>
                <input style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }} value={editForm.linkedin} onChange={e => setEditForm({...editForm, linkedin: e.target.value})} placeholder="e.g. john-doe" />
              </div>
            </div>
          )}
        </div>

        {/* Events */}
        <div className="profile-section">
          <div className="section-header">
            <h2>My Registrations</h2>
            <span className="count-badge">{events.length} Events</span>
          </div>
          
          <div className="events-list">
            {events.length === 0 ? (
              <div className="empty-state">
                <p>You haven't registered for any events yet.</p>
                <button onClick={() => router.push('/events')} className="browse-btn">Browse Events <ChevronRight size={14}/></button>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="reg-item">
                  <div className="reg-info">
                    <h4>{event.eventTitle}</h4>
                    <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="reg-status">Registered</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
