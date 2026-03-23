'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, Calendar, Clock, MapPin, Users, Star, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSession, signIn } from 'next-auth/react';
import eventService from '../../../src/services/eventService';
import BackButton from '../../../src/components/BackButton';
import './page.css';


const TYPE_COLORS = {
  workshop: '#3b82f6',
  hackathon: '#f59e0b',
  competition: '#ef4444',
  talk: '#8b5cf6',
  seminar: '#10b981',
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';


const EventDetailPage = () => {
  const { id: eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { data: session } = useSession();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    setLoading(true);
    eventService.getAll()
      .then((events) => {
        const found = events.find(e =>
          e.id === eventId ||
          (e.title && e.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === eventId)
        );
        if (found) {
          setEvent(found);
          // Check if user is registered for THIS event
          if (session?.user?.email) {
            eventService.getRegistrations(found.id)
              .then(regs => {
                const userRoll = session.user.email.split('@')[0];
                const matched = regs.some(r => r.rollNumber === userRoll || r.email === session.user.email);
                setIsRegistered(matched);
              })
              .catch(err => console.error("Error checking registration:", err));
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId, session]);

  if (loading) {
    return (
      <div className="event-detail">
        <div className="event-detail__loading">Loading event...</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="event-detail">
        <div className="event-detail__not-found">
          <div className="event-detail__not-found-icon"><Search size={48} /></div>
          <h2>Event Not Found</h2>
          <p>This event doesn't exist or may have been removed.</p>
          <BackButton />
        </div>
      </div>
    );
  }

  const alreadyRegistered = isRegistered;
  const slotsLeft = event.slots - event.registeredCount;
  const deadlinePast = new Date(event.registrationDeadline) < new Date();
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const currentStatus = now > end ? 'ended' : now >= start ? 'ongoing' : 'upcoming';

    const isEnded = currentStatus === 'ended';

    // Access Control Logic
    let isAuthorized = true;
    let accessError = null;

    if (event.accessType === 'domain') {
      if (!session) {
        isAuthorized = false;
        accessError = 'Login to verify domain access';
      } else {
        const userDomain = session.user.email.split('@')[1]?.toLowerCase();
        isAuthorized = event.allowedDomains.some(d => {
          const domain = d.startsWith('@') ? d.slice(1).toLowerCase() : d.toLowerCase();
          return userDomain === domain;
        });
        if (!isAuthorized) accessError = `Restricted to: ${event.allowedDomains.join(', ')}`;
      }
    } else if (event.accessType === 'private') {
      if (!session) {
        isAuthorized = false;
        accessError = 'Login to verify guest list status';
      } else {
        const rollNumber = session.user.email.split('@')[0];
        isAuthorized = event.allowedMembers.includes(rollNumber);
        if (!isAuthorized) accessError = 'You are not on the guest list for this private event';
      }
    }

    const canRegister = !deadlinePast && slotsLeft > 0 && !isEnded && !alreadyRegistered && event.isRegistrationOpen !== false && isAuthorized;

  const btnLabel = alreadyRegistered
    ? 'Already Registered ✓'
    : !session
      ? 'Login to Register'
      : !isAuthorized
        ? 'Access Restricted'
        : (deadlinePast || event.isRegistrationOpen === false)
          ? 'Registration Closed'
          : slotsLeft === 0
            ? 'Fully Booked'
            : 'Register Now →';

  const handleOneClick = async () => {
    if (!session?.user) return;
    setSubmitting(true);
    setResult(null);
    try {
      const userData = {
        name: session.user.name,
        email: session.user.email,
        rollNumber: session.user.email.split('@')[0]
      };
      await eventService.register(event.id, userData);
      setIsRegistered(true);
      setResult({ ok: true, msg: '✓ Quick Registration Successful!' });
      setEvent(prev => ({ ...prev, registeredCount: prev.registeredCount + 1 }));
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="event-detail">
      <Helmet>
        <title>{event.title} - KLFORGE Events</title>
        <meta name="description" content={event.description || `Register for ${event.title} at KLFORGE.`} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description || `Join us for ${event.title}`} />
        {event.posterUrl && <meta property="og:image" content={event.posterUrl} />}
      </Helmet>

      <div style={{ position: 'absolute', top: 130, left: '4%', zIndex: 10 }}>
        <BackButton />
      </div>

      <div className="event-detail__hero">
        {event.posterUrl && (
          <div className="event-detail__poster-wrap">
            <img src={event.posterUrl} alt={event.title} className="event-detail__poster" />
          </div>
        )}
        <div className="event-detail__badges">
          <span
            className="event-detail__type-badge"
            style={{ background: TYPE_COLORS[event.type] || '#555' }}
          >
            {event.type}
          </span>
          <span className={`event-detail__status event-detail__status--${event.status}`}>
            {new Date(event.endTime) < new Date() ? 'Ended' : new Date(event.startTime) < new Date() ? 'Ongoing' : 'Upcoming'}
          </span>
        </div>
        <h1 className="event-detail__title">{event.title}</h1>
        {event.description && (
          <p className="event-detail__desc">{event.description}</p>
        )}
      </div>

      <div className="event-detail__meta-grid">
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Calendar size={14} className="events-icon"/> Date</span>
          <span className="event-detail__meta-val">
            {new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {new Date(event.startTime).toDateString() !== new Date(event.endTime).toDateString() && (
              <> - {new Date(event.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </span>
        </div>
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Clock size={14} className="events-icon"/> Time</span>
          <span className="event-detail__meta-val">
            {new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {new Date(event.startTime).toDateString() !== new Date(event.endTime).toDateString() && (
              <span style={{ fontSize: '0.8em', opacity: 0.6, display: 'block' }}>(Cross-day event)</span>
            )}
          </span>
        </div>
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Clock size={14} className="events-icon"/> Registration Deadline</span>
          <span className="event-detail__meta-val">{fmt(event.registrationDeadline)}</span>
        </div>
        {(event.venue || event.location) && (
          <div className="event-detail__meta-item">
            <span className="event-detail__meta-label"><MapPin size={14} className="events-icon"/> Venue</span>
            <span className="event-detail__meta-val">{event.venue || event.location}</span>
          </div>
        )}
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Users size={14} className="events-icon"/> Slots</span>
          <span className={`event-detail__meta-val ${slotsLeft === 0 ? 'event-detail__meta-val--danger' : ''}`}>
            {slotsLeft > 0 ? `${slotsLeft} of ${event.slots} left` : 'Fully Booked'}
          </span>
        </div>
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Star size={14} className="events-icon"/> Points</span>
          <span className="event-detail__meta-val">{event.points || '—'}</span>
        </div>
      </div>

      {/* Registration area */}
      <div className="event-detail__reg-section">
        {result?.ok && (
          <div className="event-detail__reg-success">{result.msg}</div>
        )}
        {accessError && !result?.ok && (
          <div className="event-detail__reg-error" style={{ marginBottom: 20, textAlign: 'center' }}>
            {accessError}
          </div>
        )}
        {!result?.ok && (
          !isEnded ? (
            <button
              className={`event-detail__reg-btn ${!canRegister && session ? 'event-detail__reg-btn--disabled' : ''} ${alreadyRegistered ? 'event-detail__reg-btn--done' : ''}`}
              onClick={() => {
                if (alreadyRegistered) return;
                if (session) {
                  if (!canRegister) return;
                  handleOneClick();
                } else {
                  signIn('microsoft'); // Or just signIn() to show options
                }
              }}
              disabled={(submitting) || (session && !canRegister)}
            >
              {submitting ? 'Registering...' : btnLabel}
            </button>
          ) : (
            <button className="event-detail__reg-btn event-detail__reg-btn--disabled" disabled>
              Event Ended
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
