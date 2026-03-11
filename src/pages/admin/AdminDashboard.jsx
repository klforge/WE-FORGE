import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit3, Plus, GripVertical, LogOut, X, Users, Calendar, FolderKanban, Bell, Globe, Send, Eye } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import authService from '../../services/authService';
import memberService, { getAvatarUrl } from '../../services/memberService';
import eventService from '../../services/eventService';
import noticeService from '../../services/noticeService';
import projectService from '../../services/projectService';
import './AdminDashboard.css';

// ─── Helpers ──────────────────────────────────────────────

const EMPTY_MEMBER_FORM = {
  name: '', role: '', rollNumber: '', description: '', bio: '', skills: '', status: 'Online', telegram: '',
};

const EMPTY_EVENT_FORM = {
  title: '', description: '', type: 'workshop', points: 0, slots: 50,
  registrationDeadline: '', eventDate: '', location: '', status: 'upcoming',
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
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectDeleteConfirm, setProjectDeleteConfirm] = useState(null);

  // Shared error
  const [error, setError] = useState('');

  // ── Fetch helpers ────────────────────────────────────────

  const fetchMembers = async () => { try { setMembers(await memberService.getAll()); } catch { setError('Failed to load members'); } };
  const fetchEvents = async () => { try { setEvents(await eventService.getAll()); } catch { setError('Failed to load events'); } };
  const fetchNotices = async () => { try { setNotices(await noticeService.getAll()); } catch { setError('Failed to load notices'); } };
  const fetchProjects = async () => { try { setProjects(await projectService.getAll()); } catch { setError('Failed to load projects'); } };

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
    setEventForm({ title: ev.title, description: ev.description, type: ev.type, points: ev.points, slots: ev.slots, registrationDeadline: toInputDate(ev.registrationDeadline), eventDate: toInputDate(ev.eventDate), location: ev.location, status: ev.status });
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

  const openAddProject = () => { setProjectEditing(null); setProjectForm(EMPTY_PROJECT_FORM); setShowProjectForm(true); setError(''); };
  const openEditProject = (p) => { setProjectEditing(p.id); setProjectForm({ name: p.name, description: p.description, github: p.github, demo: p.demo, technologies: p.technologies.join(', ') }); setShowProjectForm(true); setError(''); };
  const closeProjectForm = () => { setShowProjectForm(false); setProjectEditing(null); setProjectForm(EMPTY_PROJECT_FORM); setError(''); };
  const handleProjectSubmit = async (e) => {
    e.preventDefault(); setProjectSaving(true); setError('');
    try {
      const payload = { ...projectForm, technologies: JSON.stringify(projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)) };
      if (projectEditing) { await projectService.update(projectEditing, payload); } else { await projectService.create(payload); }
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
        {members.length === 0 && <div className="admin-dash__empty">No members yet. Click "Add Member" to get started.</div>}
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
        {events.length === 0 && <div className="admin-dash__empty">No events yet. Click "Add Event" to create one.</div>}
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
        {notices.length === 0 && <div className="admin-dash__empty">No notices yet. Click "Add Notice" to post one.</div>}
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
        {projects.length === 0 && <div className="admin-dash__empty">No projects yet. Click "Add Project" to showcase one.</div>}
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
      {/* Sidebar */}
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

      {/* Main */}
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
              <div className="admin-dash__field"><label>Role *</label><input required value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })} placeholder="e.g. Frontend Developer" /></div>
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
              <div className="admin-dash__field"><label>Type</label><select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}><option value="workshop">Workshop</option><option value="hackathon">Hackathon</option><option value="competition">Competition</option><option value="talk">Talk</option><option value="seminar">Seminar</option></select></div>
              <div className="admin-dash__field"><label>Status</label><select value={eventForm.status} onChange={e => setEventForm({ ...eventForm, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></div>
              <div className="admin-dash__field"><label>Points Awarded</label><input type="number" min="0" value={eventForm.points} onChange={e => setEventForm({ ...eventForm, points: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Total Slots</label><input type="number" min="1" value={eventForm.slots} onChange={e => setEventForm({ ...eventForm, slots: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Event Date *</label><input required type="date" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} /></div>
              <div className="admin-dash__field"><label>Registration Deadline</label><input type="date" value={eventForm.registrationDeadline} onChange={e => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} /></div>
              <div className="admin-dash__field admin-dash__field--full"><label>Location</label><input value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. A Block Seminar Hall" /></div>
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
