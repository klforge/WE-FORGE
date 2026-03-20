import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit3, Plus, GripVertical, LogOut, X, Users, Calendar, FolderKanban, Bell, Globe, Send, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import authService from '../services/authService';
import memberService, { getAvatarUrl } from '../services/memberService';
import eventService from '../services/eventService';
import noticeService from '../services/noticeService';
import projectService from '../services/projectService';
import './AdminDashboard.css';

// ─── Helpers ──────────────────────────────────────────────

const EMPTY_MEMBER_FORM = {
  name: '', role: 'Tech and Innovation', rollNumber: '', description: '', bio: '', skills: '', status: 'Online', telegram: '',
};

const EMPTY_EVENT_FORM = {
  title: '', description: '', type: '', points: 0, slots: 50,
  registrationDeadline: '', eventDate: '', venue: '', status: 'upcoming',
};

const EMPTY_NOTICE_FORM = { title: '', message: '', priority: 'low' };

const EMPTY_PROJECT_FORM = { name: '', description: '', github: '', demo: '', technologies: '' };

function getCroppedBlob(image, crop) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const toInputDate = (iso) => iso ? iso.slice(0, 10) : '';

// ─── Component ────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Auth + shared
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('members');

  // Members
  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);
  const [memberEditing, setMemberEditing] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [crop, setCrop] = useState(undefined);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [memberDeleteConfirm, setMemberDeleteConfirm] = useState(null);
  const [memberSaving, setMemberSaving] = useState(false);
  const imgRef = useRef(null);

  // Drag-and-drop ordering
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Events
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [eventEditing, setEventEditing] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventPoster, setEventPoster] = useState(null);
  const [eventPosterPreview, setEventPosterPreview] = useState(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventDeleteConfirm, setEventDeleteConfirm] = useState(null);
  const [viewingRegs, setViewingRegs] = useState(null); // { event, regs }

  // Notices
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState(EMPTY_NOTICE_FORM);
  const [noticeEditing, setNoticeEditing] = useState(null);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeDeleteConfirm, setNoticeDeleteConfirm] = useState(null);

  // Projects
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [projectEditing, setProjectEditing] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectImage, setProjectImage] = useState(null);
  const [projectImagePreview, setProjectImagePreview] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectDeleteConfirm, setProjectDeleteConfirm] = useState(null);

  // Shared error
  const [error, setError] = useState('');

  // ── Fetch helpers ────────────────────────────────────────

  const fetchMembers = async () => { try { setMembers(await memberService.getAll()); } catch { setError('Failed to load members'); } };
  const fetchEvents = async () => { try { setEvents(await eventService.getAll()); } catch { setError('Failed to load events'); } };
  const fetchNotices = async () => { try { setNotices(await noticeService.getAll()); } catch { setError('Failed to load notices'); } };
  const fetchProjects = async () => { try { setProjects(await projectService.getAll()); } catch { setError('Failed to load projects'); } };

  // ── Fix mobile scroll: stop Lenis and unlock html/body/root ─
  // Lenis in root mode adds overflow:hidden to html+body and intercepts
  // all touch events. We must undo this while the admin page is mounted.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    // Save original styles so we can restore them on unmount
    const savedHtmlOverflow  = html.style.overflow;
    const savedBodyOverflow  = body.style.overflow;
    const savedBodyHeight    = body.style.height;
    const savedHtmlHeight    = html.style.height;
    const savedRootHeight    = root ? root.style.height : '';

    // Stop Lenis so it no longer intercepts touchmove / wheel
    window.__lenis?.stop();

    // Force the full scroll chain to be scrollable
    html.style.overflow  = 'visible';
    html.style.height    = 'auto';
    body.style.overflow  = 'visible';
    body.style.height    = 'auto';
    if (root) root.style.height = 'auto';

    return () => {
      // Restore everything for the rest of the site
      html.style.overflow  = savedHtmlOverflow;
      html.style.height    = savedHtmlHeight;
      body.style.overflow  = savedBodyOverflow;
      body.style.height    = savedBodyHeight;
      if (root) root.style.height = savedRootHeight;
      window.__lenis?.start();
    };
  }, []);

  useEffect(() => {
    authService.checkAuth().then(async (ok) => {
      if (!ok) { navigate('/admin'); return; }
      await Promise.all([fetchMembers(), fetchEvents(), fetchNotices(), fetchProjects()]);
      setLoading(false);
    });
  }, [navigate]);

  // ── Members ──────────────────────────────────────────────

  const openAddMember = () => {
    setMemberEditing(null); setMemberForm(EMPTY_MEMBER_FORM);
    setPhoto(null); setPhotoPreview(null); setCrop(undefined); setCompletedCrop(null);
    setShowMemberForm(true); setError('');
  };
  const openEditMember = (m) => {
    setMemberEditing(m.id);
    setMemberForm({ name: m.name, role: m.role, rollNumber: m.rollNumber, description: m.description, bio: m.bio, skills: m.skills.join(', '), status: m.status, telegram: m.telegram || '' });
    setPhoto(null); setPhotoPreview(null); setCrop(undefined); setCompletedCrop(null);
    setShowMemberForm(true); setError('');
  };
  const closeMemberForm = () => {
    setShowMemberForm(false); setMemberEditing(null); setMemberForm(EMPTY_MEMBER_FORM);
    setPhoto(null); setPhotoPreview(null); setCrop(undefined); setCompletedCrop(null); setError('');
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setCrop(undefined); setCompletedCrop(null);
  };
  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height);
    setCrop({ unit: 'px', x: (width - size) / 2, y: (height - size) / 2, width: size, height: size });
  }, []);
  const handleMemberSubmit = async (e) => {
    e.preventDefault(); setMemberSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', memberForm.name.trim()); fd.append('role', memberForm.role.trim());
      fd.append('rollNumber', memberForm.rollNumber.trim()); fd.append('description', memberForm.description.trim());
      fd.append('bio', memberForm.bio.trim()); fd.append('status', memberForm.status);
      fd.append('skills', JSON.stringify(memberForm.skills.split(',').map(s => s.trim()).filter(Boolean)));
      if (memberForm.telegram.trim()) fd.append('telegram', memberForm.telegram.trim());
      if (photo && completedCrop && imgRef.current) { fd.append('photo', await getCroppedBlob(imgRef.current, completedCrop), 'cropped.png'); }
      else if (photo) { fd.append('photo', photo); }
      if (memberEditing) { await memberService.update(memberEditing, fd); } else { await memberService.add(fd); }
      closeMemberForm(); await fetchMembers();
    } catch (err) { setError(err.message); } finally { setMemberSaving(false); }
  };
  const handleMemberDelete = async (id) => {
    try { await memberService.remove(id); setMemberDeleteConfirm(null); await fetchMembers(); } catch (err) { setError(err.message); }
  };
  const handleDragStart = (idx) => {
    dragIndexRef.current = idx;
  };

  const handleDragEnter = (idx) => {
    if (dragIndexRef.current === null || dragIndexRef.current === idx) return;
    setDragOverIndex(idx);
    const list = [...members];
    const [dragged] = list.splice(dragIndexRef.current, 1);
    list.splice(idx, 0, dragged);
    dragIndexRef.current = idx;
    setMembers(list);
  };

  const handleDragEnd = async () => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
    try { await memberService.reorder(members.map(m => m.id)); } catch { await fetchMembers(); }
  };

  // ── Events ───────────────────────────────────────────────

  const openAddEvent = () => {
    setEventEditing(null); setEventForm(EMPTY_EVENT_FORM);
    setEventPoster(null); setEventPosterPreview(null); setShowEventForm(true); setError('');
  };
  const openEditEvent = (ev) => {
    setEventEditing(ev.id);
    setEventForm({ title: ev.title, description: ev.description, type: ev.type, points: ev.points, slots: ev.slots, registrationDeadline: toInputDate(ev.registrationDeadline), eventDate: toInputDate(ev.eventDate), venue: ev.venue || ev.location || '', status: ev.status });
    setEventPoster(null); setEventPosterPreview(ev.posterUrl || null); setShowEventForm(true); setError('');
  };
  const closeEventForm = () => { setShowEventForm(false); setEventEditing(null); setEventForm(EMPTY_EVENT_FORM); setEventPoster(null); setEventPosterPreview(null); setError(''); };
  const handleEventPosterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Poster must be under 5MB'); return; }
    setEventPoster(file); setEventPosterPreview(URL.createObjectURL(file));
  };
  const handleEventSubmit = async (e) => {
    e.preventDefault(); setEventSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(eventForm).forEach(([k, v]) => fd.append(k, v));
      if (eventPoster) fd.append('poster', eventPoster);
      if (eventEditing) { await eventService.update(eventEditing, fd); } else { await eventService.create(fd); }
      closeEventForm(); await fetchEvents();
    } catch (err) { setError(err.message); } finally { setEventSaving(false); }
  };
  const handleEventDelete = async (id) => {
    try { await eventService.remove(id); setEventDeleteConfirm(null); await fetchEvents(); } catch (err) { setError(err.message); }
  };
  const viewRegistrations = async (event) => {
    try {
      const regs = await eventService.getRegistrations(event.id);
      setViewingRegs({ event, regs });
    } catch { setError('Failed to load registrations'); }
  };

  // ── Notices ──────────────────────────────────────────────

  const openAddNotice = () => { setNoticeEditing(null); setNoticeForm(EMPTY_NOTICE_FORM); setShowNoticeForm(true); setError(''); };
  const openEditNotice = (n) => { setNoticeEditing(n.id); setNoticeForm({ title: n.title, message: n.message, priority: n.priority }); setShowNoticeForm(true); setError(''); };
  const closeNoticeForm = () => { setShowNoticeForm(false); setNoticeEditing(null); setNoticeForm(EMPTY_NOTICE_FORM); setError(''); };
  const handleNoticeSubmit = async (e) => {
    e.preventDefault(); setNoticeSaving(true); setError('');
    try {
      if (noticeEditing) { await noticeService.update(noticeEditing, noticeForm); } else { await noticeService.create(noticeForm); }
      closeNoticeForm(); await fetchNotices();
    } catch (err) { setError(err.message); } finally { setNoticeSaving(false); }
  };
  const handleNoticeDelete = async (id) => {
    try { await noticeService.remove(id); setNoticeDeleteConfirm(null); await fetchNotices(); } catch (err) { setError(err.message); }
  };

  // ── Projects ─────────────────────────────────────────────

  const openAddProject = () => { setProjectEditing(null); setProjectForm(EMPTY_PROJECT_FORM); setProjectImage(null); setProjectImagePreview(null); setShowProjectForm(true); setError(''); };
  const openEditProject = (p) => { setProjectEditing(p.id); setProjectForm({ name: p.name, description: p.description, github: p.github, demo: p.demo, technologies: p.technologies.join(', ') }); setProjectImage(null); setProjectImagePreview(p.imageUrl || null); setShowProjectForm(true); setError(''); };
  const closeProjectForm = () => { setShowProjectForm(false); setProjectEditing(null); setProjectForm(EMPTY_PROJECT_FORM); setProjectImage(null); setProjectImagePreview(null); setError(''); };
  
  const handleProjectImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setProjectImage(file); setProjectImagePreview(URL.createObjectURL(file));
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault(); setProjectSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', projectForm.name.trim());
      if (projectForm.description) fd.append('description', projectForm.description.trim());
      if (projectForm.github) fd.append('github', projectForm.github.trim());
      if (projectForm.demo) fd.append('demo', projectForm.demo.trim());
      fd.append('technologies', JSON.stringify(projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)));
      if (projectImage) fd.append('image', projectImage);

      if (projectEditing) { await projectService.update(projectEditing, fd); } else { await projectService.create(fd); }
      closeProjectForm(); await fetchProjects();
    } catch (err) { setError(err.message); } finally { setProjectSaving(false); }
  };
  const handleProjectDelete = async (id) => {
    try { await projectService.remove(id); setProjectDeleteConfirm(null); await fetchProjects(); } catch (err) { setError(err.message); }
  };

  const handleLogout = async () => { await authService.logout(); navigate('/admin'); };

  if (loading) return <div className="admin-dash"><div className="admin-dash__loading">Loading...</div></div>;

  // ── Nav ───────────────────────────────────────────────────

  const NAV_ITEMS = [
    { id: 'members', label: 'Members', icon: <Users size={18} />, count: members.length },
    { id: 'events', label: 'Events', icon: <Calendar size={18} />, count: events.length },
    { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} />, count: projects.length },
    { id: 'notices', label: 'Notices', icon: <Bell size={18} />, count: notices.length },
    { id: 'domains', label: 'Domains', icon: <Globe size={18} /> },
  ];

  // ── Section Renderers ─────────────────────────────────────

  const renderMembersSection = () => (
    <>
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title">Team Members</h2>
          <p className="admin-section__subtitle">{members.length} member{members.length !== 1 ? 's' : ''} registered &mdash; <span style={{ color: 'rgba(125,190,255,0.6)', fontSize: '0.78rem' }}>drag rows to reorder</span></p>
        </div>
        <button className="admin-dash__add-btn" onClick={openAddMember}><Plus size={18} /> Add Member</button>
      </div>
      {error && !showMemberForm && <div className="admin-dash__error">{error}</div>}

      {/* Desktop table */}
      <div className="admin-dash__table-wrap" data-lenis-prevent="true">
        <table className="admin-dash__table">
          <thead><tr><th></th><th>Photo</th><th>Name</th><th>Role</th><th>Roll Number</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {members.map((m, idx) => (
              <tr
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className={dragOverIndex === idx ? 'admin-dash__row--drag-over' : ''}
              >
                <td className="admin-dash__drag-cell">
                  <span className="admin-dash__drag-handle" title="Drag to reorder"><GripVertical size={16} /></span>
                </td>
                <td><img className="admin-dash__avatar" src={getAvatarUrl(m)} alt={m.name} /></td>
                <td className="admin-dash__name-cell">{m.name}</td>
                <td>{m.role}</td>
                <td className="admin-dash__mono">{m.rollNumber}</td>
                <td><span className={`admin-dash__status admin-dash__status--${m.status.toLowerCase()}`}>{m.status}</span></td>
                <td className="admin-dash__actions-cell">
                  <button className="admin-dash__icon-btn admin-dash__icon-btn--edit" onClick={() => openEditMember(m)}><Edit3 size={15} /></button>
                  {memberDeleteConfirm === m.id ? (
                    <span className="admin-dash__delete-confirm">Sure?
                      <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => handleMemberDelete(m.id)}>Yes</button>
                      <button className="admin-dash__icon-btn" onClick={() => setMemberDeleteConfirm(null)}>No</button>
                    </span>
                  ) : (
                    <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => setMemberDeleteConfirm(m.id)}><Trash2 size={15} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && <div className="admin-dash__empty">No members yet. Click &ldquo;Add Member&rdquo; to get started.</div>}
      </div>

      {/* Mobile cards */}
      <div className="admin-mob-cards">
        {members.length === 0 && <div className="admin-dash__empty">No members yet. Tap &ldquo;Add Member&rdquo; to get started.</div>}
        {members.map((m, idx) => (
          <div key={m.id} className="admin-mob-card">
            <div className="admin-mob-card__top">
              <img className="admin-mob-card__avatar" src={getAvatarUrl(m)} alt={m.name} />
              <div className="admin-mob-card__info">
                <div className="admin-mob-card__name">{m.name}</div>
                <div className="admin-mob-card__sub">{m.role} &bull; {m.rollNumber}</div>
              </div>
              <span className={`admin-dash__status admin-dash__status--${m.status.toLowerCase()}`}>{m.status}</span>
            </div>
            {m.description && <div className="admin-mob-card__desc">{m.description}</div>}
            {memberDeleteConfirm === m.id ? (
              <div className="admin-mob-card__confirm">
                <span className="admin-mob-card__confirm-label">Delete this member?</span>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => handleMemberDelete(m.id)}>Yes, Delete</button>
                <button className="admin-mob-btn" onClick={() => setMemberDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <div className="admin-mob-card__actions">
                <button
                  className="admin-mob-btn admin-mob-btn--reorder"
                  disabled={idx === 0}
                  onClick={async () => {
                    if (idx === 0) return;
                    const list = [...members];
                    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                    setMembers(list);
                    try { await memberService.reorder(list.map(x => x.id)); } catch { await fetchMembers(); }
                  }}
                  title="Move up"
                ><ArrowUp size={15} /></button>
                <button
                  className="admin-mob-btn admin-mob-btn--reorder"
                  disabled={idx === members.length - 1}
                  onClick={async () => {
                    if (idx === members.length - 1) return;
                    const list = [...members];
                    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
                    setMembers(list);
                    try { await memberService.reorder(list.map(x => x.id)); } catch { await fetchMembers(); }
                  }}
                  title="Move down"
                ><ArrowDown size={15} /></button>
                <button className="admin-mob-btn admin-mob-btn--edit" onClick={() => openEditMember(m)}><Edit3 size={15} /> Edit</button>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => setMemberDeleteConfirm(m.id)}><Trash2 size={15} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const TYPE_BADGE_COLORS = { workshop: '#3b82f6', hackathon: '#f59e0b', competition: '#ef4444', talk: '#8b5cf6', seminar: '#10b981' };
  const PRIORITY_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#ef4444' };

  const renderEventsSection = () => (
    <>
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title">Events</h2>
          <p className="admin-section__subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="admin-dash__add-btn" onClick={openAddEvent}><Plus size={18} /> Add Event</button>
      </div>
      {error && !showEventForm && <div className="admin-dash__error">{error}</div>}

      {/* Desktop table */}
      <div className="admin-dash__table-wrap" data-lenis-prevent="true">
        <table className="admin-dash__table">
          <thead><tr><th>Poster</th><th>Title</th><th>Type</th><th>Event Date</th><th>Slots</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>
                  {ev.posterUrl
                    ? <img className="admin-dash__avatar" src={ev.posterUrl} alt={ev.title} style={{ borderRadius: 6, objectFit: 'cover' }} />
                    : <span className="admin-dash__no-poster">—</span>}
                </td>
                <td className="admin-dash__name-cell">{ev.title}</td>
                <td><span className="admin-dash__type-badge" style={{ background: TYPE_BADGE_COLORS[ev.type] || '#555' }}>{ev.type}</span></td>
                <td className="admin-dash__mono">{fmtDate(ev.eventDate)}</td>
                <td className="admin-dash__mono">{ev.registeredCount} / {ev.slots}</td>
                <td><span className={`admin-dash__status admin-dash__status--${ev.status}`}>{ev.status}</span></td>
                <td className="admin-dash__actions-cell">
                  <button className="admin-dash__icon-btn" title="View Registrations" onClick={() => viewRegistrations(ev)}><Eye size={15} /></button>
                  <button className="admin-dash__icon-btn admin-dash__icon-btn--edit" onClick={() => openEditEvent(ev)}><Edit3 size={15} /></button>
                  {eventDeleteConfirm === ev.id ? (
                    <span className="admin-dash__delete-confirm">Sure?
                      <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => handleEventDelete(ev.id)}>Yes</button>
                      <button className="admin-dash__icon-btn" onClick={() => setEventDeleteConfirm(null)}>No</button>
                    </span>
                  ) : (
                    <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => setEventDeleteConfirm(ev.id)}><Trash2 size={15} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <div className="admin-dash__empty">No events yet. Click &ldquo;Add Event&rdquo; to create one.</div>}
      </div>

      {/* Mobile cards */}
      <div className="admin-mob-cards">
        {events.length === 0 && <div className="admin-dash__empty">No events yet. Tap &ldquo;Add Event&rdquo; to create one.</div>}
        {events.map((ev) => (
          <div key={ev.id} className="admin-mob-card">
            <div className="admin-mob-card__top">
              {ev.posterUrl
                ? <img className="admin-mob-card__avatar admin-mob-card__avatar--event" src={ev.posterUrl} alt={ev.title} />
                : <div className="admin-mob-card__avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(125,190,255,0.08)', color:'rgba(125,190,255,0.4)', fontSize:'1.2rem' }}><Calendar size={20} /></div>}
              <div className="admin-mob-card__info">
                <div className="admin-mob-card__name">{ev.title}</div>
                <div className="admin-mob-card__sub">{fmtDate(ev.eventDate)} &bull; {ev.registeredCount}/{ev.slots} slots</div>
              </div>
            </div>
            <div className="admin-mob-card__chips">
              <span className="admin-dash__type-badge" style={{ background: TYPE_BADGE_COLORS[ev.type] || '#555' }}>{ev.type}</span>
              <span className={`admin-dash__status admin-dash__status--${ev.status}`}>{ev.status}</span>
            </div>
            {ev.description && <div className="admin-mob-card__desc">{ev.description}</div>}
            {eventDeleteConfirm === ev.id ? (
              <div className="admin-mob-card__confirm">
                <span className="admin-mob-card__confirm-label">Delete this event?</span>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => handleEventDelete(ev.id)}>Yes, Delete</button>
                <button className="admin-mob-btn" onClick={() => setEventDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <div className="admin-mob-card__actions">
                <button className="admin-mob-btn" onClick={() => viewRegistrations(ev)}><Eye size={15} /> Regs</button>
                <button className="admin-mob-btn admin-mob-btn--edit" onClick={() => openEditEvent(ev)}><Edit3 size={15} /> Edit</button>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => setEventDeleteConfirm(ev.id)}><Trash2 size={15} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderNoticesSection = () => (
    <>
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title">Notices</h2>
          <p className="admin-section__subtitle">{notices.length} notice{notices.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="admin-dash__add-btn" onClick={openAddNotice}><Plus size={18} /> Add Notice</button>
      </div>
      {error && !showNoticeForm && <div className="admin-dash__error">{error}</div>}

      {/* Desktop table */}
      <div className="admin-dash__table-wrap" data-lenis-prevent="true">
        <table className="admin-dash__table">
          <thead><tr><th>Title</th><th>Message</th><th>Priority</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id}>
                <td className="admin-dash__name-cell">{n.title}</td>
                <td style={{ maxWidth: 260, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>{n.message.slice(0, 80)}{n.message.length > 80 ? '…' : ''}</td>
                <td><span className="admin-dash__priority-badge" style={{ background: PRIORITY_COLORS[n.priority] || '#555' }}>{n.priority}</span></td>
                <td className="admin-dash__mono">{fmtDate(n.createdAt)}</td>
                <td className="admin-dash__actions-cell">
                  <button className="admin-dash__icon-btn admin-dash__icon-btn--edit" onClick={() => openEditNotice(n)}><Edit3 size={15} /></button>
                  {noticeDeleteConfirm === n.id ? (
                    <span className="admin-dash__delete-confirm">Sure?
                      <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => handleNoticeDelete(n.id)}>Yes</button>
                      <button className="admin-dash__icon-btn" onClick={() => setNoticeDeleteConfirm(null)}>No</button>
                    </span>
                  ) : (
                    <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => setNoticeDeleteConfirm(n.id)}><Trash2 size={15} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {notices.length === 0 && <div className="admin-dash__empty">No notices yet. Click &ldquo;Add Notice&rdquo; to post one.</div>}
      </div>

      {/* Mobile cards */}
      <div className="admin-mob-cards">
        {notices.length === 0 && <div className="admin-dash__empty">No notices yet. Tap &ldquo;Add Notice&rdquo; to post one.</div>}
        {notices.map((n) => (
          <div key={n.id} className="admin-mob-card">
            <div className="admin-mob-card__top">
              <div className="admin-mob-card__avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center', background: `${PRIORITY_COLORS[n.priority]}22`, color: PRIORITY_COLORS[n.priority] }}><Bell size={20} /></div>
              <div className="admin-mob-card__info">
                <div className="admin-mob-card__name">{n.title}</div>
                <div className="admin-mob-card__sub">{fmtDate(n.createdAt)}</div>
              </div>
              <span className="admin-dash__priority-badge" style={{ background: PRIORITY_COLORS[n.priority] || '#555', flexShrink:0 }}>{n.priority}</span>
            </div>
            <div className="admin-mob-card__desc">{n.message}</div>
            {noticeDeleteConfirm === n.id ? (
              <div className="admin-mob-card__confirm">
                <span className="admin-mob-card__confirm-label">Delete this notice?</span>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => handleNoticeDelete(n.id)}>Yes, Delete</button>
                <button className="admin-mob-btn" onClick={() => setNoticeDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <div className="admin-mob-card__actions">
                <button className="admin-mob-btn admin-mob-btn--edit" onClick={() => openEditNotice(n)}><Edit3 size={15} /> Edit</button>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => setNoticeDeleteConfirm(n.id)}><Trash2 size={15} /> Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderProjectsSection = () => (
    <>
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title">Projects</h2>
          <p className="admin-section__subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="admin-dash__add-btn" onClick={openAddProject}><Plus size={18} /> Add Project</button>
      </div>
      {error && !showProjectForm && <div className="admin-dash__error">{error}</div>}

      {/* Desktop table */}
      <div className="admin-dash__table-wrap" data-lenis-prevent="true">
        <table className="admin-dash__table">
          <thead><tr><th>Name</th><th>Technologies</th><th>GitHub</th><th>Actions</th></tr></thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="admin-dash__name-cell">{p.name}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.technologies.slice(0, 4).map((t) => (
                      <span key={t} className="admin-dash__tech-tag">{t}</span>
                    ))}
                    {p.technologies.length > 4 && <span className="admin-dash__tech-tag">+{p.technologies.length - 4}</span>}
                  </div>
                </td>
                <td>
                  {p.github ? <a href={p.github} target="_blank" rel="noopener noreferrer" className="admin-dash__link">GitHub ↗</a> : '—'}
                </td>
                <td className="admin-dash__actions-cell">
                  <button className="admin-dash__icon-btn admin-dash__icon-btn--edit" onClick={() => openEditProject(p)}><Edit3 size={15} /></button>
                  {projectDeleteConfirm === p.id ? (
                    <span className="admin-dash__delete-confirm">Sure?
                      <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => handleProjectDelete(p.id)}>Yes</button>
                      <button className="admin-dash__icon-btn" onClick={() => setProjectDeleteConfirm(null)}>No</button>
                    </span>
                  ) : (
                    <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={() => setProjectDeleteConfirm(p.id)}><Trash2 size={15} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && <div className="admin-dash__empty">No projects yet. Click &ldquo;Add Project&rdquo; to showcase one.</div>}
      </div>

      {/* Mobile cards */}
      <div className="admin-mob-cards">
        {projects.length === 0 && <div className="admin-dash__empty">No projects yet. Tap &ldquo;Add Project&rdquo; to showcase one.</div>}
        {projects.map((p) => (
          <div key={p.id} className="admin-mob-card">
            <div className="admin-mob-card__top">
              <div className="admin-mob-card__avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(125,190,255,0.08)', color:'rgba(125,190,255,0.5)' }}>
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'10px' }} /> : <FolderKanban size={20} />}
              </div>
              <div className="admin-mob-card__info">
                <div className="admin-mob-card__name">{p.name}</div>
                {p.github && <div className="admin-mob-card__sub"><a href={p.github} target="_blank" rel="noopener noreferrer" className="admin-dash__link">GitHub ↗</a></div>}
              </div>
            </div>
            {p.technologies.length > 0 && (
              <div className="admin-mob-card__chips">
                {p.technologies.slice(0, 5).map((t) => <span key={t} className="admin-dash__tech-tag">{t}</span>)}
                {p.technologies.length > 5 && <span className="admin-dash__tech-tag">+{p.technologies.length - 5}</span>}
              </div>
            )}
            {p.description && <div className="admin-mob-card__desc">{p.description}</div>}
            {projectDeleteConfirm === p.id ? (
              <div className="admin-mob-card__confirm">
                <span className="admin-mob-card__confirm-label">Delete this project?</span>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => handleProjectDelete(p.id)}>Yes, Delete</button>
                <button className="admin-mob-btn" onClick={() => setProjectDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <div className="admin-mob-card__actions">
                <button className="admin-mob-btn admin-mob-btn--edit" onClick={() => openEditProject(p)}><Edit3 size={15} /> Edit</button>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => setProjectDeleteConfirm(p.id)}><Trash2 size={15} /> Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderPlaceholderSection = (title, description, icon) => (
    <div className="admin-section__placeholder">
      <div className="admin-section__placeholder-icon">{icon}</div>
      <h2 className="admin-section__placeholder-title">{title}</h2>
      <p className="admin-section__placeholder-desc">{description}</p>
      <div className="admin-section__placeholder-tag">Coming Soon</div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'members': return renderMembersSection();
      case 'events': return renderEventsSection();
      case 'notices': return renderNoticesSection();
      case 'projects': return renderProjectsSection();
      case 'domains': return renderPlaceholderSection('Domains', 'Define and manage club domains — Web, AI/ML, Cyber, Design, and more.', <Globe size={48} />);
      default: return renderMembersSection();
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="admin-dash">
      {/* ── Mobile sticky header (hidden on desktop via CSS) ── */}
      <header className="admin-mob-header">
        <div className="admin-mob-header__brand">
          <div className="admin-mob-header__logo">KF</div>
          <h1 className="admin-mob-header__title">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Dashboard'}</h1>
        </div>
        <button className="admin-mob-header__logout" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </header>

      {/* ── Desktop Sidebar (hidden on mobile via CSS) ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">KF</div>
          <span className="admin-sidebar__brand-name">KLFORGE</span>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`admin-sidebar__item ${activeSection === item.id ? 'admin-sidebar__item--active' : ''}`} onClick={() => { setActiveSection(item.id); setError(''); }}>
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && <span className="admin-sidebar__badge">{item.count}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <button className="admin-sidebar__logout" onClick={handleLogout}><LogOut size={16} /><span>Logout</span></button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        <header className="admin-main__topbar">
          <h1 className="admin-main__title">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Dashboard'}</h1>
          <div className="admin-main__topbar-right">
            <div className="admin-main__status-dot" />
            <span className="admin-main__status-text">Admin</span>
          </div>
        </header>
        <div className="admin-main__content" data-lenis-prevent="true">{renderActiveSection()}</div>
      </main>

      {/* ── Mobile floating dock (hidden on desktop via CSS) ── */}
      <nav className="admin-mob-tabs">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`admin-mob-tab ${activeSection === item.id ? 'admin-mob-tab--active' : ''}`}
            onClick={() => { setActiveSection(item.id); setError(''); }}
          >
            <span className="admin-mob-tab__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Member Modal ─────────────────────────────────── */}
      {showMemberForm && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={closeMemberForm}>
          <form className="admin-dash__modal" onClick={e => e.stopPropagation()} onSubmit={handleMemberSubmit}>
            <div className="admin-dash__modal-header">
              <h2>{memberEditing ? 'Edit Member' : 'Add New Member'}</h2>
              <button type="button" className="admin-dash__close-btn" onClick={closeMemberForm}><X size={20} /></button>
            </div>
            {error && <div className="admin-dash__error">{error}</div>}
            <div className="admin-dash__form-grid">
              <div className="admin-dash__field"><label>Name *</label><input required value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Full Name" /></div>
              <div className="admin-dash__field">
                <label>Domain / Role *</label>
                <select value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}>
                  <option value="Tech and Innovation">Tech and Innovation</option>
                  <option value="Creative and Content">Creative and Content</option>
                  <option value="Media and Broadcasting">Media and Broadcasting</option>
                  <option value="Operations">Operations</option>
                  <option value="Speakers">Speakers</option>
                </select>
              </div>
              <div className="admin-dash__field"><label>Roll Number *</label><input required value={memberForm.rollNumber} onChange={e => setMemberForm({ ...memberForm, rollNumber: e.target.value })} placeholder="e.g. 2400000001" /></div>
              <div className="admin-dash__field"><label>Status</label><select value={memberForm.status} onChange={e => setMemberForm({ ...memberForm, status: e.target.value })}><option>Online</option><option>Away</option><option>Busy</option></select></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Short Description</label><input value={memberForm.description} onChange={e => setMemberForm({ ...memberForm, description: e.target.value })} placeholder="One-liner for team cards" /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Bio</label><textarea rows="3" value={memberForm.bio} onChange={e => setMemberForm({ ...memberForm, bio: e.target.value })} placeholder="About this member..." /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Skills (comma-separated)</label><input value={memberForm.skills} onChange={e => setMemberForm({ ...memberForm, skills: e.target.value })} placeholder="React, CSS, Figma" /></div>
              <div className="admin-dash__field admin-dash__field--full admin-dash__field--divider"><label className="admin-dash__field-section-label">Contact</label></div>
              <div className="admin-dash__field admin-dash__field--full"><label><Send size={12} /> Telegram Username</label><input value={memberForm.telegram} onChange={e => setMemberForm({ ...memberForm, telegram: e.target.value })} placeholder="username (without @)" /></div>
              <div className="admin-dash__field admin-dash__field--full admin-dash__field--divider"><label className="admin-dash__field-section-label">Photo</label></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Upload Photo (JPEG/PNG/WebP, max 5MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} /></div>
              {photoPreview && (
                <div className="admin-dash__field admin-dash__field--full">
                  <label>Crop Photo</label>
                  <div className="admin-dash__crop-area">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                      <img src={photoPreview} alt="Crop preview" onLoad={onImageLoad} className="admin-dash__crop-img" />
                    </ReactCrop>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-dash__modal-actions">
              <button type="button" className="admin-dash__cancel-btn" onClick={closeMemberForm}>Cancel</button>
              <button type="submit" className="admin-dash__save-btn" disabled={memberSaving}>{memberSaving ? 'Saving...' : memberEditing ? 'Update Member' : 'Add Member'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Event Modal ──────────────────────────────────── */}
      {showEventForm && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={closeEventForm}>
          <form className="admin-dash__modal" onClick={e => e.stopPropagation()} onSubmit={handleEventSubmit}>
            <div className="admin-dash__modal-header">
              <h2>{eventEditing ? 'Edit Event' : 'Add New Event'}</h2>
              <button type="button" className="admin-dash__close-btn" onClick={closeEventForm}><X size={20} /></button>
            </div>
            {error && <div className="admin-dash__error">{error}</div>}
            <div className="admin-dash__form-grid">
              <div className="admin-dash__field admin-dash__field--full"><label>Title *</label><input required value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Description</label><textarea rows="3" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="What's this event about?" /></div>
              <div className="admin-dash__field"><label>Event Type</label><input value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} placeholder="e.g. Workshop, Seminar" /></div>
              <div className="admin-dash__field"><label>Status</label><select value={eventForm.status} onChange={e => setEventForm({ ...eventForm, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="ended">Ended</option></select></div>
              <div className="admin-dash__field"><label>Points Awarded</label><input type="number" min="0" value={eventForm.points} onChange={e => setEventForm({ ...eventForm, points: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Total Slots</label><input type="number" min="1" value={eventForm.slots} onChange={e => setEventForm({ ...eventForm, slots: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Event Date *</label><input required type="date" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Registration Deadline</label><input type="date" value={eventForm.registrationDeadline} onChange={e => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Venue</label><input value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="e.g. A Block Seminar Hall" /></div>
              <div className="admin-dash__field admin-dash__field--full admin-dash__field--divider"><label className="admin-dash__field-section-label">Poster Image</label></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Upload Poster (JPEG/PNG/WebP, max 5MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEventPosterChange} /></div>
              {eventPosterPreview && (
                <div className="admin-dash__field admin-dash__field--full">
                  <label>Poster Preview</label>
                  <img src={eventPosterPreview} alt="Poster preview" className="admin-dash__poster-preview" />
                </div>
              )}
            </div>
            <div className="admin-dash__modal-actions">
              <button type="button" className="admin-dash__cancel-btn" onClick={closeEventForm}>Cancel</button>
              <button type="submit" className="admin-dash__save-btn" disabled={eventSaving}>{eventSaving ? 'Saving...' : eventEditing ? 'Update Event' : 'Add Event'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Registrations Modal ──────────────────────────── */}
      {viewingRegs && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={() => setViewingRegs(null)}>
          <div className="admin-dash__modal" onClick={e => e.stopPropagation()}>
            <div className="admin-dash__modal-header">
              <h2>Registrations — {viewingRegs.event.title}</h2>
              <button type="button" className="admin-dash__close-btn" onClick={() => setViewingRegs(null)}><X size={20} /></button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 16px' }}>{viewingRegs.regs.length} registration{viewingRegs.regs.length !== 1 ? 's' : ''}</p>
            <div className="admin-dash__table-wrap" data-lenis-prevent="true">
              <table className="admin-dash__table">
                <thead><tr><th>Name</th><th>Roll Number</th><th>Email</th><th>Registered At</th></tr></thead>
                <tbody>
                  {viewingRegs.regs.map(r => (
                    <tr key={r.id}>
                      <td className="admin-dash__name-cell">{r.name}</td>
                      <td className="admin-dash__mono">{r.rollNumber}</td>
                      <td>{r.email}</td>
                      <td className="admin-dash__mono">{fmtDate(r.registeredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {viewingRegs.regs.length === 0 && <div className="admin-dash__empty">No registrations yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Notice Modal ─────────────────────────────────── */}
      {showNoticeForm && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={closeNoticeForm}>
          <form className="admin-dash__modal" onClick={e => e.stopPropagation()} onSubmit={handleNoticeSubmit}>
            <div className="admin-dash__modal-header">
              <h2>{noticeEditing ? 'Edit Notice' : 'Add Notice'}</h2>
              <button type="button" className="admin-dash__close-btn" onClick={closeNoticeForm}><X size={20} /></button>
            </div>
            {error && <div className="admin-dash__error">{error}</div>}
            <div className="admin-dash__form-grid">
              <div className="admin-dash__field admin-dash__field--full"><label>Title *</label><input required value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="Notice title" /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Message *</label><textarea required rows="4" value={noticeForm.message} onChange={e => setNoticeForm({ ...noticeForm, message: e.target.value })} placeholder="Notice details..." /></div>
              <div className="admin-dash__field"><label>Priority</label><select value={noticeForm.priority} onChange={e => setNoticeForm({ ...noticeForm, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <div className="admin-dash__modal-actions">
              <button type="button" className="admin-dash__cancel-btn" onClick={closeNoticeForm}>Cancel</button>
              <button type="submit" className="admin-dash__save-btn" disabled={noticeSaving}>{noticeSaving ? 'Saving...' : noticeEditing ? 'Update Notice' : 'Post Notice'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Project Modal ────────────────────────────────── */}
      {showProjectForm && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={closeProjectForm}>
          <form className="admin-dash__modal" onClick={e => e.stopPropagation()} onSubmit={handleProjectSubmit}>
            <div className="admin-dash__modal-header">
              <h2>{projectEditing ? 'Edit Project' : 'Add Project'}</h2>
              <button type="button" className="admin-dash__close-btn" onClick={closeProjectForm}><X size={20} /></button>
            </div>
            {error && <div className="admin-dash__error">{error}</div>}
            <div className="admin-dash__form-grid">
              <div className="admin-dash__field admin-dash__field--full"><label>Project Name *</label><input required value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="Project name" /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Description</label><textarea rows="3" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What does this project do?" /></div>
              <div className="admin-dash__field"><label>GitHub URL</label><input type="url" value={projectForm.github} onChange={e => setProjectForm({ ...projectForm, github: e.target.value })} placeholder="https://github.com/..." /></div>
              <div className="admin-dash__field"><label>Demo URL</label><input type="url" value={projectForm.demo} onChange={e => setProjectForm({ ...projectForm, demo: e.target.value })} placeholder="https://..." /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Technologies (comma-separated)</label><input value={projectForm.technologies} onChange={e => setProjectForm({ ...projectForm, technologies: e.target.value })} placeholder="React, Node.js, MongoDB" /></div>
              <div className="admin-dash__field admin-dash__field--full admin-dash__field--divider"><label className="admin-dash__field-section-label">Project Image</label></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Upload Image (JPEG/PNG/WebP, max 5MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProjectImageChange} /></div>
              {projectImagePreview && (
                <div className="admin-dash__field admin-dash__field--full">
                  <label>Image Preview</label>
                  <img src={projectImagePreview} alt="Project preview" className="admin-dash__poster-preview" />
                </div>
              )}
            </div>
            <div className="admin-dash__modal-actions">
              <button type="button" className="admin-dash__cancel-btn" onClick={closeProjectForm}>Cancel</button>
              <button type="submit" className="admin-dash__save-btn" disabled={projectSaving}>{projectSaving ? 'Saving...' : projectEditing ? 'Update Project' : 'Add Project'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
