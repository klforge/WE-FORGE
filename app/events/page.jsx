'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, CheckCircle, CalendarDays, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import eventService from '../../src/services/eventService';
import BackButton from '../../src/components/BackButton';
import './page.css';

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

    const isCollegeEmail = (val) => /@kluniversity\.in$/i.test(val);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setResult(null);
        try {
            await eventService.register(event.id, form);
            markRegistered(event.id, form.rollNumber);
            setResult({ ok: true, msg: '✓ Registered successfully!' });
            setForm(EMPTY_REG);
            onRegistered(event.id, form.role || 'Participant');
        } catch (err) {
            setResult({ ok: false, msg: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOneClick = () => {
        handleSubmit();
    };

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
        <div className="events-page__card">
            {event.posterUrl && (
                <div className="events-page__poster-wrap">
                    <img src={event.posterUrl} alt={event.title} className="events-page__poster" />
                </div>
            )}
            <div className="events-page__card-body">
                <div className="events-page__card-top">
                    <span className="events-page__type-badge" style={{ background: TYPE_COLORS[event.type] || '#555' }}>{event.type}</span>
                    <span className={`events-page__status ${STATUS_LABELS[currentStatus]?.cls}`}>{STATUS_LABELS[currentStatus]?.label}</span>
                </div>

                <h2 className="events-page__card-title">{event.title}</h2>
                {event.description && <p className="events-page__card-desc">{event.description}</p>}

                <div className="events-page__meta-grid">
                    <div className="events-page__meta-item">
                        <span className="events-page__meta-label"><Calendar size={14} className="events-icon" /> Date</span>
                        <span className="events-page__meta-value">{fmt(event.startTime)}</span>
                    </div>
                    <div className="events-page__meta-item">
                        <span className="events-page__meta-label"><Clock size={14} className="events-icon" /> Time Range</span>
                        <span className="events-page__meta-value">{fmtTime(event.startTime)} - {fmtTime(event.endTime)}</span>
                    </div>
                    <div className="events-page__meta-item">
                        <span className="events-page__meta-label"><Users size={14} className="events-icon" /> Deadline</span>
                        <span className="events-page__meta-value">{fmt(event.registrationDeadline)}</span>
                    </div>
                    {(event.venue || event.location) && (
                        <div className="events-page__meta-item">
                            <span className="events-page__meta-label"><MapPin size={14} className="events-icon" /> Venue</span>
                            <span className="events-page__meta-value">{event.venue || event.location}</span>
                        </div>
                    )}
                    <div className="events-page__meta-item">
                        <span className="events-page__meta-label"><Users size={14} className="events-icon" /> Slots</span>
                        <span className={`events-page__meta-value ${slotsLeft === 0 ? 'events-page__meta-value--danger' : ''}`}>
                            {slotsLeft > 0 ? `${slotsLeft} of ${event.slots} left` : 'Full'}
                        </span>
                    </div>
                </div>

                <div className="events-page__card-actions">
                    <button className="events-page__detail-btn" onClick={() => onViewDetail(event.id)}>
                        View Details →
                    </button>
                    {!isEnded ? (
                        alreadyRegistered ? (
                            <button className="events-page__register-btn events-page__register-btn--done" disabled>Already Registered ✓</button>
                        ) : !canRegister ? (
                            <button className="events-page__register-btn events-page__register-btn--disabled" disabled>{btnLabel}</button>
                        ) : session ? (
                            <button className="events-page__register-btn events-page__register-btn--oneclick" onClick={handleOneClick} disabled={submitting}>
                                <Zap size={14} /> {submitting ? 'Registering...' : 'One-Click Join'}
                            </button>
                        ) : !showForm ? (
                            <button className="events-page__register-btn" onClick={() => setShowForm(true)}>{btnLabel}</button>
                        ) : (
                            <form className="events-page__reg-form" onSubmit={handleSubmit}>
                                <div className="events-page__reg-form-header">
                                    <h3>Register for {event.title}</h3>
                                    <button type="button" className="events-page__reg-close" onClick={() => { setShowForm(false); setResult(null); }}>✕</button>
                                </div>
                                <input required placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                <input required placeholder="Roll Number" value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} />
                                <input required type="email" placeholder="College Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                {result && (
                                    <div className={`events-page__reg-result ${result.ok ? 'events-page__reg-result--ok' : 'events-page__reg-result--err'}`}>
                                        {result.msg}
                                    </div>
                                )}
                                <button type="submit" className="events-page__register-btn" disabled={submitting || result?.ok}>
                                    {submitting ? 'Submitting...' : 'Confirm Registration'}
                                </button>
                            </form>
                        )
                    ) : (
                        <button className="events-page__register-btn events-page__register-btn--disabled" disabled>Event Ended</button>
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
    const [registered, setRegistered] = useState(getRegistered);

    useEffect(() => {
        eventService.getAll()
            .then(setEvents)
            .catch(() => setError('Failed to load events'))
            .finally(() => setLoading(false));
    }, []);

    const handleRegistered = (eventId) => {
        setRegistered(prev => ({ ...prev, [eventId]: true }));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e));
    };

    const handleViewDetail = (eventId) => {
        router.push(`/events/${encodeURIComponent(eventId)}`);
    };

    // Filtered Events
    const filteredEvents = events.filter(ev => {
        if (ev.accessType === 'public' || !ev.accessType) return true;
        if (!session) return false; // Private/Domain events require login
        
        const user = session.user;
        if (ev.accessType === 'domain') {
            return ev.allowedDomains.includes(user.domain);
        }
        if (ev.accessType === 'private') {
            return ev.allowedMembers.includes(user.rollNumber);
        }
        return false;
    });

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
                    {!events.length ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                            No events to show right now.
                        </div>
                    ) : (
                        <div className="events-page__grid">
                            {filteredEvents.map(event => (
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
