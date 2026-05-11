'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, CheckCircle, CalendarDays, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import eventService from '../../src/services/eventService';
import BackButton from '../../src/components/BackButton';
import './page.css';


const TYPE_COLORS = {
    workshop: '#3b82f6',
    hackathon: '#f59e0b',
    competition: '#ef4444',
    talk: '#8b5cf6',
    seminar: '#10b981',
};

const STATUS_LABELS = {
    upcoming: { label: 'Upcoming', cls: 'upcoming' },
    ongoing: { label: 'Ongoing', cls: 'ongoing' },
    ended: { label: 'Ended', cls: 'ended' }
};

const fmt = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (iso) => 
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const EMPTY_REG = { name: '', rollNumber: '', email: '' };

/* ── Individual Event Card ── */
const EventCard = ({ event, alreadyRegistered, onRegistered, onViewDetail, session }) => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_REG);
    const [showPoster, setShowPoster] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setForm({
                name: session.user.name,
                rollNumber: session.user.rollNumber,
                email: session.user.email
            });
        }
    }, [session]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const slotsLeft = event.slots - event.registeredCount;
    const deadlinePast = new Date(event.registrationDeadline) < new Date();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setResult(null);
        try {
            await eventService.register(event.id, form);
            setResult({ ok: true, msg: '✓ Registered successfully!' });
            setForm(EMPTY_REG);
            onRegistered(event.id);
        } catch (err) {
            setResult({ ok: false, msg: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOneClick = () => handleSubmit();

    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const currentStatus = now > end ? 'ended' : now >= start ? 'ongoing' : 'upcoming';
    const isEnded = currentStatus === 'ended';
    const canRegister = !deadlinePast && slotsLeft > 0 && !isEnded && !alreadyRegistered;

    const btnLabel = alreadyRegistered 
        ? 'Already Registered ✓' 
        : deadlinePast ? 'Registration Closed' 
        : slotsLeft === 0 ? 'Fully Booked' 
        : 'Register Now';

    return (
        <div className="event-card">
            {/* Poster Header */}
            {event.posterUrl ? (
                <>
                <div className="event-card__cover" onClick={() => setShowPoster(true)}>
                    <img src={event.posterUrl} alt={event.title} className="event-card__img" />
                    <div className="event-card__overlay-badges">
                        <span className="event-card__badge" style={{ background: TYPE_COLORS[event.type] || '#555' }}>{event.type}</span>
                        <span className={`event-card__badge event-card__badge--${currentStatus}`}>{STATUS_LABELS[currentStatus]?.label}</span>
                    </div>
                </div>
                {showPoster && (
                    <div className="event-poster-modal" onClick={() => setShowPoster(false)}>
                        <div className="event-poster-modal__content" onClick={e => e.stopPropagation()}>
                            <img src={event.posterUrl} alt={event.title} className="event-poster-modal__img" />
                            <button className="event-poster-modal__close" onClick={() => setShowPoster(false)}>✕</button>
                        </div>
                    </div>
                )}
                </>
            ) : (
                <div className="event-card__cover event-card__cover--fallback">
                    <CalendarDays size={48} opacity={0.2} />
                    <div className="event-card__overlay-badges">
                        <span className="event-card__badge" style={{ background: TYPE_COLORS[event.type] || '#555' }}>{event.type}</span>
                        <span className={`event-card__badge event-card__badge--${currentStatus}`}>{STATUS_LABELS[currentStatus]?.label}</span>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="event-card__body">
                <h2 className="event-card__title">{event.title}</h2>
                {event.description && <p className="event-card__desc">{event.description}</p>}

                <div className="event-card__details">
                    <div className="event-card__detail">
                        <Calendar size={15} className="event-card__icon" />
                        <span>
                            {fmt(event.startTime)}
                            {new Date(event.startTime).toDateString() !== new Date(event.endTime).toDateString() && ` - ${fmt(event.endTime)}`}
                        </span>
                    </div>
                    <div className="event-card__detail">
                        <Clock size={15} className="event-card__icon" />
                        <span>{fmtTime(event.startTime)} - {fmtTime(event.endTime)}</span>
                    </div>
                    {(event.venue || event.location) && (
                        <div className="event-card__detail">
                            <MapPin size={15} className="event-card__icon" />
                            <span>{event.venue || event.location}</span>
                        </div>
                    )}
                    <div className="event-card__detail">
                        <Users size={15} className="event-card__icon" />
                        <span className={slotsLeft === 0 ? 'event-card__danger' : ''}>
                            {slotsLeft > 0 ? `${slotsLeft} of ${event.slots} slots left` : 'Fully Booked'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="event-card__actions">
                    <button className="event-card__btn-view" onClick={() => onViewDetail(event.id)}>
                        More Info →
                    </button>
                    
                    {!isEnded ? (
                        alreadyRegistered ? (
                            <button className="event-card__btn-reg event-card__btn-reg--done" disabled>Registered ✓</button>
                        ) : !canRegister ? (
                            <button className="event-card__btn-reg event-card__btn-reg--disabled" disabled>{btnLabel}</button>
                        ) : session ? (
                            <button className="event-card__btn-reg event-card__btn-reg--zap" onClick={handleOneClick} disabled={submitting}>
                                <Zap size={15} /> {submitting ? 'Registering...' : 'One-Click Join'}
                            </button>
                        ) : !showForm ? (
                            <button className="event-card__btn-reg" onClick={() => setShowForm(true)}>{btnLabel}</button>
                        ) : (
                            <form className="event-card__form" onSubmit={handleSubmit}>
                                <div className="event-card__form-head">
                                    <h4>Sign Up</h4>
                                    <button type="button" onClick={() => { setShowForm(false); setResult(null); }}>✕</button>
                                </div>
                                <input required placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                <input required placeholder="Roll Number" value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} />
                                <input required type="email" placeholder="College Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                {result && (
                                    <div className={`event-card__msg ${result.ok ? 'event-card__msg--ok' : 'event-card__msg--err'}`}>
                                        {result.msg}
                                    </div>
                                )}
                                <button type="submit" className="event-card__btn-submit" disabled={submitting || result?.ok}>
                                    {submitting ? 'Submitting...' : 'Confirm'}
                                </button>
                            </form>
                        )
                    ) : (
                        <button className="event-card__btn-reg event-card__btn-reg--disabled" disabled>Event Ended</button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Main Events Page ── */
const EventsPage = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registered, setRegistered] = useState({});

    useEffect(() => {
        eventService.getAll()
            .then(setEvents)
            .catch(() => setError('Failed to load events'))
            .finally(() => setLoading(false));

        if (session?.user?.email) {
            fetch(`/api/members/me/registrations`)
                .then(res => res.json())
                .then(regs => {
                    const map = {};
                    regs.forEach(r => map[r.eventId] = true);
                    setRegistered(map);
                })
                .catch(err => console.error("Error fetching user registrations:", err));
        } else {
            setRegistered({});
        }
    }, [session]);

    const handleRegistered = (eventId) => {
        setRegistered(prev => ({ ...prev, [eventId]: true }));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e));
    };

    const handleViewDetail = (eventId) => {
        router.push(`/events/${encodeURIComponent(eventId)}`);
    };

    // Allow all events to act as a public gallery. Registration restrictions are handled securely by the backend.
    const displayEvents = events;

    return (
        <div className="events-page">
            <div className="events-page__header">
                <h1 className="events-page__title">Club Events</h1>
                <p className="events-page__subtitle">Workshops, hackathons, talks and more</p>
            </div>

            {loading && <div className="events-page__loading">Loading events...</div>}
            {error && <div className="events-page__error">{error}</div>}

            {!loading && !error && (
                <div className="events-page__section">
                    {!displayEvents.length ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                            No events to show right now.
                        </div>
                    ) : (
                        <div className="events-page__grid">
                            {displayEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    alreadyRegistered={!!registered[event.id]}
                                    onRegistered={handleRegistered}
                                    onViewDetail={handleViewDetail}
                                    session={session}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsPage;
