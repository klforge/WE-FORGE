import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, MapPin, Users, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import eventService from '../services/eventService';
import BackButton from '../components/BackButton';
import './EventDetailPage.css';

const LS_KEY = 'klforge_registered_events';
const getRegistered = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};
const markRegistered = (eventId, rollNumber) => {
  const data = getRegistered();
  data[eventId] = rollNumber;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
};

const TYPE_COLORS = {
  workshop: '#3b82f6',
  hackathon: '#f59e0b',
  competition: '#ef4444',
  talk: '#8b5cf6',
  seminar: '#10b981',
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const EMPTY_REG = { name: '', rollNumber: '', email: '' };

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState(EMPTY_REG);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [registered, setRegistered] = useState(() => getRegistered());

  useEffect(() => {
    setLoading(true);
    eventService.getAll()
      .then((events) => {
        // Match by id or by slug derived from title
        const found = events.find(e =>
          e.id === eventId ||
          (e.title && e.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === eventId)
        );
        if (found) {
          setEvent(found);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

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
          <BackButton to="/events" />
        </div>
      </div>
    );
  }

  const alreadyRegistered = !!registered[event.id];
  const slotsLeft = event.slots - event.registeredCount;
  const deadlinePast = new Date(event.registrationDeadline) < new Date();
  const isEnded = event.status === 'ended';
  const canRegister = !deadlinePast && slotsLeft > 0 && !isEnded && !alreadyRegistered;

  const btnLabel = alreadyRegistered
    ? 'Already Registered ✓'
    : deadlinePast
      ? 'Registration Closed'
      : slotsLeft === 0
        ? 'Fully Booked'
        : 'Register Now →';

  const isCollegeEmail = (val) => /@kluniversity\.in$/i.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCollegeEmail(form.email)) {
      setResult({ ok: false, msg: 'Invalid email. Use your college email only' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await eventService.register(event.id, form);
      markRegistered(event.id, form.rollNumber);
      setRegistered(prev => ({ ...prev, [event.id]: form.rollNumber }));
      setResult({ ok: true, msg: '✓ You are registered! See you there.' });
      setForm(EMPTY_REG);
      setShowForm(false);
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

      <div style={{ position: 'absolute', top: 30, left: '4%', zIndex: 10 }}>
        <BackButton to="/events" />
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
            {event.status === 'ended' ? 'Ended' : event.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}
          </span>
        </div>
        <h1 className="event-detail__title">{event.title}</h1>
        {event.description && (
          <p className="event-detail__desc">{event.description}</p>
        )}
      </div>

      <div className="event-detail__meta-grid">
        <div className="event-detail__meta-item">
          <span className="event-detail__meta-label"><Calendar size={14} className="events-icon"/> Event Date</span>
          <span className="event-detail__meta-val">{fmt(event.eventDate)}</span>
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
        {!isEnded ? (
          !showForm ? (
            <button
              className={`event-detail__reg-btn ${!canRegister ? 'event-detail__reg-btn--disabled' : ''} ${alreadyRegistered ? 'event-detail__reg-btn--done' : ''}`}
              onClick={() => canRegister && setShowForm(true)}
              disabled={!canRegister}
            >
              {btnLabel}
            </button>
          ) : (
            <form className="event-detail__form" onSubmit={handleSubmit}>
              <h3 className="event-detail__form-title">Register for {event.title}</h3>
              <input
                required
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="event-detail__input"
              />
              <input
                required
                placeholder="Roll Number"
                value={form.rollNumber}
                onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                className="event-detail__input"
              />
              <input
                required
                type="email"
                placeholder="College Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="event-detail__input"
              />
              {result && !result.ok && (
                <div className="event-detail__reg-error">{result.msg}</div>
              )}
              <div className="event-detail__form-actions">
                <button type="submit" className="event-detail__reg-btn" disabled={submitting || result?.ok}>
                  {submitting ? 'Submitting...' : 'Confirm Registration'}
                </button>
                <button
                  type="button"
                  className="event-detail__cancel-btn"
                  onClick={() => { setShowForm(false); setResult(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : (
          <button className="event-detail__reg-btn event-detail__reg-btn--disabled" disabled>
            Event Ended
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
