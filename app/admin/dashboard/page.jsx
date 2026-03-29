'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Edit3, Plus, GripVertical, LogOut, X, Users, Calendar, Clock, CheckCircle, FolderKanban, Bell, Globe, Send, Eye, ArrowUp, ArrowDown, Shield, Download, Search, Image as ImageIcon, Video, Upload } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import authService from '../../../src/services/authService';
import memberService, { getAvatarUrl } from '../../../src/services/memberService';
import eventService from '../../../src/services/eventService';
import noticeService from '../../../src/services/noticeService';
import projectService from '../../../src/services/projectService';
import './AdminDashboard.css';

// ─── Helpers ──────────────────────────────────────────────

const ROLE_WEIGHTS = {
  'Head of the Department': 0.1,
  'Alternate Head of Department': 0.2,
  'President': 1,
  'Chief Secretary': 2,
  'Treasurer': 3,
  'Advisor': 5,
  'Chief': 10,
  'Lead': 20,
  'Core Member': 30,
  'Associate': 40,
  'Student': 100
};

const EMPTY_MEMBER_FORM = {
  name: '', role: 'Core Member', domain: 'General', rollNumber: '', email: '', 
  description: '', bio: '', skills: '', status: 'Online', 
  department: '', telegram: '', github: '', linkedin: '', isSuspended: false,
  color: '#71C4FF'
};

const EMPTY_EVENT_FORM = {
  title: '', description: '', type: '', points: 0, slots: 50, registrationDeadline: '', startTime: '', endTime: '', venue: '',
  accessType: 'public', allowedDomains: [], allowedMembers: [], roles: ['Participant', 'Volunteer', 'Organizer'], isRegistrationOpen: true
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

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtRange = (s, e) => {
  if (!s || !e) return '—';
  const start = new Date(s);
  const end = new Date(e);
  const startStr = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const startDate = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endDate = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (startDate === endDate) {
    return `${startDate}, ${startStr} - ${endStr}`;
  }
  return `${startDate}, ${startStr} - ${endDate}, ${endStr}`;
};
const toInputDate = (iso) => iso ? iso.slice(0, 10) : '';

// ─── Component ────────────────────────────────────────────

const AdminDashboard = () => {
  const router = useRouter();

  // Auth + shared
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('members');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveSection(tab);
    }
  }, []);

  const handleTabChange = (id) => {
    setActiveSection(id);
    setError('');
    window.history.replaceState(null, '', `?tab=${id}`);
  };

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

  // Media
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaEventTag, setMediaEventTag] = useState('General');
  const [mediaDeleteConfirm, setMediaDeleteConfirm] = useState(null);
  const [mediaFilterTag, setMediaFilterTag] = useState('all');

  // Event Access & Registrations
  const [showRegsModal, setShowRegsModal] = useState(false);
  const [selectedEventForRegs, setSelectedEventForRegs] = useState(null);
  const [eventRegs, setEventRegs] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  // Private Member Picker Search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberSearchResults, setShowMemberSearchResults] = useState(false);

  // Shared error
  const [error, setError] = useState('');
  const [adminInfo, setAdminInfo] = useState({ authenticated: false, isElite: false, domain: '', role: '' });
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSort, setMemberSort] = useState('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Fetch helpers ────────────────────────────────────────

  const fetchMembers = async () => { try { setMembers(await memberService.getAll()); } catch { setError('Failed to load members'); } };
  const fetchEvents = async () => { try { setEvents(await eventService.getAll()); } catch { setError('Failed to load events'); } };
  const fetchNotices = async () => { try { setNotices(await noticeService.getAll()); } catch { setError('Failed to load notices'); } };
  const fetchProjects = async () => { try { setProjects(await projectService.getAll()); } catch { setError('Failed to load projects'); } };
  const fetchMedia = async () => { setMediaLoading(true); try { const res = await fetch('/api/media'); setMedia(await res.json()); } catch { setError('Failed to load media'); } finally { setMediaLoading(false); } };

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

  // ── Password-gate auth (uses JWT cookie from /api/auth/login) ────────
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [pwInput, setPwInput]             = useState('');
  const [pwError, setPwError]             = useState('');

  useEffect(() => {
    authService.checkAuth()
      .then(isAuth => {
        if (!isAuth) { setLoading(false); return; }
        return fetch('/api/auth/check')
          .then(r => r.json())
          .then(data => {
            if (data.authenticated) {
              setAdminInfo(data);
              setIsAdminAuthed(true);
              return Promise.all([fetchMembers(), fetchEvents(), fetchNotices(), fetchProjects(), fetchMedia()])
                .then(() => setLoading(false));
            }
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAdminPasswordLogin = async (e) => {
    e.preventDefault();
    setPwError('');
    try {
      await authService.login(pwInput);
      setIsAdminAuthed(true);
      setLoading(true);
      const data = await fetch('/api/auth/check').then(r => r.json());
      setAdminInfo(data);
      await Promise.all([fetchMembers(), fetchEvents(), fetchNotices(), fetchProjects(), fetchMedia()]);
      setLoading(false);
    } catch (err) {
      setPwError(err.message || 'Incorrect password');
    }
  };

  // ── Members ──────────────────────────────────────────────

  const openAddMember = () => {
    setMemberEditing(null); setMemberForm(EMPTY_MEMBER_FORM);
    setPhoto(null); setPhotoPreview(null); setCrop(undefined); setCompletedCrop(null);
    setShowMemberForm(true); setError('');
  };
  const openEditMember = (m) => {
    setMemberEditing(m.id);
    setMemberForm({ 
      name: m.name, 
      role: m.role, 
      domain: m.domain,
      rollNumber: m.rollNumber, 
      email: m.email || `${m.rollNumber}@kluniversity.in`,
      description: m.description, 
      bio: m.bio, 
      skills: m.skills.join(', '), 
      status: m.status, 
      telegram: m.telegram || '',
      color: m.color || '#71C4FF'
    });
    setPhoto(null); setPhotoPreview(null); setCrop(undefined); setCompletedCrop(null);
    setShowMemberForm(true); setError('');
  };
  const handleMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
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
      fd.append('name', (memberForm.name || '').trim()); 
      fd.append('role', (memberForm.role || '').trim());
      if (memberForm.color) fd.append('color', memberForm.color);
      fd.append('rollNumber', (memberForm.rollNumber || '').trim()); 
      fd.append('description', (memberForm.description || '').trim());
      fd.append('bio', (memberForm.bio || '').trim()); 
      fd.append('status', memberForm.status || 'Online');
      fd.append('domain', memberForm.domain || 'General');
      fd.append('isSuspended', !!memberForm.isSuspended);
      fd.append('skills', JSON.stringify((memberForm.skills || '').split(',').map(s => s.trim()).filter(Boolean)));
      if (memberForm.telegram && memberForm.telegram.trim()) fd.append('telegram', memberForm.telegram.trim());
      if (memberForm.github && memberForm.github.trim()) fd.append('github', memberForm.github.trim());
      if (memberForm.linkedin && memberForm.linkedin.trim()) fd.append('linkedin', memberForm.linkedin.trim());
      if (memberForm.department && memberForm.department.trim()) fd.append('department', memberForm.department.trim());
      if (photo && completedCrop && imgRef.current) { fd.append('photo', await getCroppedBlob(imgRef.current, completedCrop), 'cropped.png'); }
      else if (photo) { fd.append('photo', photo); }
      if (memberEditing) { await memberService.update(memberEditing, fd); } else { await memberService.add(fd); }
      closeMemberForm(); await fetchMembers();
    } catch (err) { setError(err.message); } finally { setMemberSaving(false); }
  };
  const handleMemberDelete = async (id) => {
    try { await memberService.remove(id); setMemberDeleteConfirm(null); await fetchMembers(); } catch (err) { setError(err.message); }
  };

  // ── Events ───────────────────────────────────────────────

  const openAddEvent = () => {
    setEventEditing(null); setEventForm(EMPTY_EVENT_FORM);
    setEventPoster(null); setEventPosterPreview(null); setShowEventForm(true); setError('');
  };
  const openEditEvent = (ev) => {
    setEventEditing(ev.id);
    setEventForm({ 
      title: ev.title, 
      description: ev.description, 
      type: ev.type, 
      points: ev.points || 0, 
      slots: ev.slots || 50, 
      registrationDeadline: ev.registrationDeadline || '', 
      startTime: ev.startTime || '',
      endTime: ev.endTime || '',
      venue: ev.venue || ev.location || '',
      accessType: ev.accessType || 'public',
      allowedDomains: ev.allowedDomains || [],
      allowedMembers: ev.allowedMembers || [],
      roles: ev.roles || ['Participant', 'Volunteer', 'Organizer'],
      isRegistrationOpen: ev.isRegistrationOpen ?? true
    });
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
      // Scalar fields only
      fd.append('title', eventForm.title || '');
      fd.append('description', eventForm.description || '');
      fd.append('type', eventForm.type || '');
      fd.append('points', String(eventForm.points ?? 0));
      fd.append('slots', String(eventForm.slots ?? 50));
      fd.append('venue', eventForm.venue || '');
      fd.append('accessType', eventForm.accessType || 'public');
      fd.append('isRegistrationOpen', String(eventForm.isRegistrationOpen ?? true));

      // Date/time fields
      if (eventForm.startTime) fd.append('startTime', eventForm.startTime);
      if (eventForm.endTime) fd.append('endTime', eventForm.endTime);
      if (eventForm.registrationDeadline) fd.append('registrationDeadline', eventForm.registrationDeadline);

      // Array fields — serialize as JSON strings
      fd.append('allowedDomains', JSON.stringify(eventForm.allowedDomains || []));
      fd.append('allowedMembers', JSON.stringify((eventForm.allowedMembers || []).map(String)));
      fd.append('roles', JSON.stringify(eventForm.roles || ['Participant', 'Volunteer', 'Organizer']));

      if (eventPoster) fd.append('poster', eventPoster);
      if (eventEditing) fd.append('id', eventEditing);

      if (eventEditing) { await eventService.update(eventEditing, fd); } else { await eventService.create(fd); }
      setEventForm(EMPTY_EVENT_FORM); setShowEventForm(false); await fetchEvents();
    } catch (err) { setError(err.message); } finally { setEventSaving(false); }
  };
  const handleEventDelete = async (id) => {
    try { await eventService.remove(id); setEventDeleteConfirm(null); await fetchEvents(); } catch (err) { setError(err.message); }
  };

  const viewRegistrations = async (ev) => {
    setSelectedEventForRegs(ev);
    setShowRegsModal(true);
    setRegsLoading(true);
    try {
      const data = await eventService.getRegistrations(ev.id);
      setEventRegs(data);
    } catch (err) { setError(err.message); } finally { setRegsLoading(false); }
  };

  const updateMemberRole = async (regId, newRole) => {
    try {
      await eventService.updateRegistrationRole(selectedEventForRegs.id, regId, newRole);
      // Refresh local list
      setEventRegs(prev => prev.map(r => r.id === regId ? { ...r, role: newRole } : r));
    } catch (err) { setError(err.message); }
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

  // ── Media ────────────────────────────────────────────────
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventName', mediaEventTag);
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      await fetchMedia();
      setShowMediaUpload(false);
    } catch (err) { setError(err.message); } finally { setMediaUploading(false); }
  };

  const handleMediaDelete = async (id) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setMediaDeleteConfirm(null);
      await fetchMedia();
    } catch (err) { 
      console.error('Media delete error:', err);
      setError(err.message); 
    }
  };

  const handleLogout = async () => { await authService.logout(); setIsAdminAuthed(false); setPwInput(''); };

  if (loading) return <div className="admin-dash"><div className="admin-dash__loading">Loading...</div></div>;

  if (!isAdminAuthed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 380, padding: '48px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={44} style={{ color: '#fff', marginBottom: 16 }} />
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Admin Access</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 8 }}>Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleAdminPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            placeholder="Admin password"
            autoFocus
            style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
          />
          {pwError && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', margin: 0 }}>{pwError}</p>}
          <button type="submit" className="admin-dash__add-btn" style={{ width: '100%', justifyContent: 'center' }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );

  // ── Nav ───────────────────────────────────────────────────

  const NAV_ITEMS = [
    { id: 'members',  label: 'Members',  icon: <Users size={18} />,       count: members.length },
    { id: 'events',   label: 'Events',   icon: <Calendar size={18} />,     count: events.length },
    { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} />, count: projects.length },
    { id: 'notices',  label: 'Notices',  icon: <Bell size={18} />,         count: notices.length },
    { id: 'media',    label: 'Media',    icon: <ImageIcon size={18} />,    count: media.length },
  ];

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Domain', 'Roll Number'];
    const rows = members.map(m => [m.name, m.email, m.role, m.domain, m.rollNumber].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'forge_members.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Section Renderers ─────────────────────────────────────

  const renderMembersSection = () => {
    let filteredMembers = adminInfo.isElite 
      ? members 
      : members.filter(m => m.domain === adminInfo.domain);

    // Search
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      filteredMembers = filteredMembers.filter(m => 
        m.name.toLowerCase().includes(low) || 
        m.rollNumber.toLowerCase().includes(low) ||
        (m.domain || '').toLowerCase().includes(low)
      );
    }

    // Filter by UI selection
    if (memberFilter === 'student') {
      filteredMembers = filteredMembers.filter(m => m.domain === 'General' || m.domain === 'Student');
    } else if (memberFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => m.domain === memberFilter);
    }

    // Sorting
    filteredMembers.sort((a, b) => {
      // Manual Sorting
      if (memberSort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (memberSort === 'roll') return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      
      // Default: Hierarchy Sort
      const weightA = ROLE_WEIGHTS[a.role] || 999;
      const weightB = ROLE_WEIGHTS[b.role] || 999;
      if (weightA !== weightB) return weightA - weightB;
      return (a.name || '').localeCompare(b.name || '');
    });

    const domains = Array.from(new Set(members.map(m => m.domain))).filter(Boolean);

    return (
      <>
        <div className="admin-section__header" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 16 }}>
          <div className="admin-dash__title-row">
            <h2 className="admin-section__title admin-section__title--large">Team Members</h2>
            <div className="admin-dash__title-actions">
              <button className="admin-dash__add-btn" onClick={openAddMember}><Plus size={18} /> Add Member</button>
              <button className="admin-dash__export-btn" onClick={downloadCSV}><Download size={16} /> Export CSV</button>
            </div>
          </div>
          
          <div className="admin-dash__filter-row" style={{ width: '100%' }}>
            <div className="admin-dash__search-bar">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search name, ID, or domain..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select value={memberSort} onChange={e => setMemberSort(e.target.value)} className="admin-dash__select">
              <option value="hierarchy">Sort by Hierarchy</option>
              <option value="name">Sort by Name</option>
              <option value="roll">Sort by Roll #</option>
            </select>

            <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="admin-dash__select">
              <option value="all">All Domains</option>
              <option value="student">Just Students (No Domain)</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        {error && !showMemberForm && <div className="admin-dash__error">{error}</div>}

        {/* Desktop table */}
        <div className="admin-dash__table-wrap" data-lenis-prevent="true">
          <table className="admin-dash__table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Domain</th>
                <th>Role</th>
                <th>Roll #</th>
                <th>Telegram</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m, idx) => (
                <tr key={m.id} className="admin-dash__row">
                  <td><img className="admin-dash__avatar" src={getAvatarUrl(m)} alt={m.name} /></td>
                   <td className="admin-dash__name-cell">{m.name}</td>
                  <td><span className="admin-dash__domain-tag">{m.domain}</span></td>
                   <td style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                     {m.role}
                     {m.isSuspended && <span className="admin-dash__status-badge admin-dash__status-badge--suspended" style={{ marginLeft: 8, background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem' }}>Suspended</span>}
                   </td>
                   <td className="admin-dash__mono"><Link href={`/${m.id}`} className="admin-dash__profile-link">{m.rollNumber}</Link></td>
                  <td className="admin-dash__mono" style={{ color: 'rgba(125,190,255,0.7)' }}>
                    {m.telegram ? (
                      <a href={`https://t.me/${m.telegram}`} target="_blank" rel="noopener noreferrer" className="admin-dash__link">
                        @{m.telegram}
                      </a>
                    ) : '-'}
                  </td>
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
                 <Link href={`/${m.id}`} className="admin-mob-card__name" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{m.name}</Link>
                <div className="admin-mob-card__meta" style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span className="admin-dash__type-badge" style={{ background: 'rgba(113, 196, 255, 0.1)', color: '#71C4FF', border: '1px solid rgba(113, 196, 255, 0.2)' }}>{m.domain}</span>
                   <span className="admin-dash__access-tag admin-dash__access-tag--public" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)' }}>{m.role}</span>
                   {m.isSuspended && <span style={{ background: 'rgba(255, 77, 77, 0.2)', color: '#ff4d4d', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SUSPENDED</span>}
                   <span style={{ fontSize: '0.75rem', opacity: 0.4, display: 'flex', alignItems: 'center' }}>{m.rollNumber}</span>
                  {m.telegram && (
                    <a href={`https://t.me/${m.telegram}`} target="_blank" rel="noopener noreferrer" className="admin-dash__link" style={{ fontSize: '0.75rem' }}>@{m.telegram}</a>
                  )}
                </div>
              </div>
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
                <button className="admin-mob-btn admin-mob-btn--edit" onClick={() => openEditMember(m)}><Edit3 size={15} /> Edit</button>
                <button className="admin-mob-btn admin-mob-btn--delete" onClick={() => setMemberDeleteConfirm(m.id)}><Trash2 size={15} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
    );
  };

  const TYPE_BADGE_COLORS = { workshop: '#3b82f6', hackathon: '#f59e0b', competition: '#ef4444', talk: '#8b5cf6', seminar: '#10b981' };
  const PRIORITY_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#ef4444' };

  const renderEventsSection = () => (
    <>
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title admin-section__title--large">Events</h2>
          <p className="admin-section__subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="admin-dash__add-btn" onClick={openAddEvent}><Plus size={18} /> Add Event</button>
      </div>
      {error && !showEventForm && <div className="admin-dash__error">{error}</div>}

      {/* Desktop table */}
      <div className="admin-dash__table-wrap" data-lenis-prevent="true">
        <table className="admin-dash__table">
          <thead><tr><th>Poster</th><th>Title</th><th>Type</th><th>Access</th><th>Event Date</th><th>Slots</th><th>Status</th><th>Actions</th></tr></thead>
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
                <td><span className={`admin-dash__access-tag admin-dash__access-tag--${ev.accessType || 'public'}`}>{ev.accessType || 'public'}</span></td>
                <td className="admin-dash__mono" style={{ fontSize: '0.75rem' }}>{fmtRange(ev.startTime, ev.endTime)}</td>
                <td className="admin-dash__mono">{ev.registeredCount} / {ev.slots}</td>
                <td><span className={`admin-dash__status admin-dash__status--${ev.status}`}>{ev.status}</span></td>
                <td className="admin-dash__actions-cell">
                  <button className="admin-dash__icon-btn" title="View Event Page" onClick={() => router.push(`/events/${ev.id}`)}><Eye size={15} /></button>
                  <button className="admin-dash__icon-btn" title="View Registrations" onClick={() => viewRegistrations(ev)}><Users size={15} /></button>
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
                <button className="admin-mob-btn" onClick={() => router.push(`/events/${ev.id}`)}><Eye size={15} /> View</button>
                <button className="admin-mob-btn" onClick={() => viewRegistrations(ev)}><Users size={15} /> Regs</button>
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
          <h2 className="admin-section__title admin-section__title--large">Notices</h2>
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
          <h2 className="admin-section__title admin-section__title--large">Projects</h2>
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

  const renderMediaSection = () => {
    const eventTags = ['all', 'General', ...Array.from(new Set(events.map(e => e.title)))];
    const filteredMedia = mediaFilterTag === 'all' ? media : media.filter(m => m.eventName === mediaFilterTag);

    return (
      <>
        <div className="admin-section__header">
          <div>
            <h2 className="admin-section__title">Media Gallery</h2>
            <p className="admin-section__subtitle">{media.length} asset{media.length !== 1 ? 's' : ''} stored</p>
          </div>
          <div className="admin-dash__filters" style={{ marginTop: 0 }}>
             <select 
               value={mediaFilterTag} 
               onChange={e => setMediaFilterTag(e.target.value)}
               className="admin-dash__select"
             >
               {eventTags.map(tag => <option key={tag} value={tag}>{tag === 'all' ? 'All Events' : tag}</option>)}
             </select>
             <button className="admin-dash__add-btn" onClick={() => setShowMediaUpload(true)}>
               <Upload size={18} /> Upload Media
             </button>
          </div>
        </div>

        {mediaLoading ? (
          <div className="admin-dash__loading">Syncing with R2...</div>
        ) : (
          <div className="admin-media__grid">
            {filteredMedia.map(m => {
              const mid = m._id || m.id;
              return (
                <div key={mid} className="admin-media__card">
                  <div className="admin-media__preview">
                    {m.type === 'video' ? (
                      <video src={m.url} className="admin-media__asset" muted />
                    ) : (
                      <img src={m.url} alt={m.eventName} className="admin-media__asset" />
                    )}
                    <div className="admin-media__overlay">
                      <button className="admin-media__btn" onClick={() => window.open(m.url, '_blank')}><Eye size={16} /></button>
                      <button className="admin-media__btn admin-media__btn--danger" onClick={() => setMediaDeleteConfirm(mid)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="admin-media__info">
                    <span className="admin-media__tag">{m.eventName}</span>
                    <span className="admin-media__meta">{(m.fileSize / 1024 / 1024).toFixed(2)} MB &bull; {m.type}</span>
                  </div>
                  
                  {mediaDeleteConfirm === mid && (
                    <div className="admin-media__confirm">
                      <p>Delete asset?</p>
                      <div className="admin-media__confirm-actions">
                        <button className="admin-media__confirm-btn admin-media__confirm-btn--danger" onClick={() => handleMediaDelete(mid)}>Delete</button>
                        <button className="admin-media__confirm-btn" onClick={() => setMediaDeleteConfirm(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredMedia.length === 0 && <div className="admin-dash__empty">No media found for this event.</div>}
          </div>
        )}

        {showMediaUpload && (
          <div className="admin-dash__overlay">
            <div className="admin-dash__modal" style={{ maxWidth: '480px' }}>
              <div className="admin-dash__modal-header">
                <h2>Upload to Forge Storage</h2>
                <button className="admin-dash__close-btn" onClick={() => setShowMediaUpload(false)}><X size={20} /></button>
              </div>
              <div className="admin-dash__modal-body">
                <div className="admin-dash__field">
                  <label>Associate with Event</label>
                  <select value={mediaEventTag} onChange={e => setMediaEventTag(e.target.value)}>
                    <option value="General">General (No Event)</option>
                    {events.map(ev => <option key={ev.id} value={ev.title}>{ev.title}</option>)}
                  </select>
                </div>
                <div className="admin-media__upload-zone">
                  {mediaUploading ? (
                    <div className="admin-media__uploading">
                      <div className="admin-media__spinner"></div>
                      <p>Uploading to R2...</p>
                    </div>
                  ) : (
                    <>
                      <input type="file" id="media-upload" hidden onChange={handleMediaUpload} accept="image/*,video/*" />
                      <label htmlFor="media-upload" className="admin-media__upload-label">
                        <Upload size={32} />
                        <span>Click to choose file</span>
                        <small>Images or Videos (Max 50MB)</small>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

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
      case 'media': return renderMediaSection();
      case 'domains': return renderPlaceholderSection('Domains', 'Define and manage club domains — Web, AI/ML, Cyber, Design, and more.', <Globe size={48} />);
      default: return renderMembersSection();
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="admin-dash">
      {/* ── Mobile sticky header (visible on mobile only) ── */}
      <header className="admin-mob-header">
        <div className="admin-mob-header__brand">
          <div className="admin-mob-header__logo">KF</div>
          <h1 className="admin-mob-header__title">{NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Dashboard'}</h1>
        </div>
        <button className="admin-mob-header__logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* ── Desktop Sidebar (hidden on mobile via CSS) ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand" style={{ display: 'none' }}>
          <div className="admin-sidebar__logo">KF</div>
          <span className="admin-sidebar__brand-name">KLFORGE</span>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`admin-sidebar__item ${activeSection === item.id ? 'admin-sidebar__item--active' : ''}`} onClick={() => handleTabChange(item.id)}>
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
        <header className="admin-main__topbar" style={{ display: 'none' }}>
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
            onClick={() => handleTabChange(item.id)}
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
              <div className="admin-dash__field"><label>Roll Number *</label><input required value={memberForm.rollNumber} onChange={e => {
                const roll = e.target.value;
                setMemberForm({ ...memberForm, rollNumber: roll, email: roll ? `${roll}@kluniversity.in` : '' });
              }} placeholder="e.g. 2400000001" /></div>
              
              <div className="admin-dash__field"><label>Email (Auto-generated)</label><input disabled value={memberForm.email} placeholder="ID@kluniversity.in" /></div>
              
              {adminInfo.isElite ? (
                <>
                <div className="admin-dash__field">
                  <label>Department</label>
                  <input type="text" name="department" value={memberForm.department || ''} onChange={handleMemberFormChange} placeholder="e.g. CSE" />
                </div>
                <div className="admin-dash__field">
                  <label>Telegram Handle</label>
                  <input type="text" name="telegram" value={memberForm.telegram} onChange={handleMemberFormChange} placeholder="e.g. johndoe" />
                </div>
                <div className="admin-dash__field">
                  <label>GitHub Username</label>
                  <input type="text" name="github" value={memberForm.github} onChange={handleMemberFormChange} placeholder="e.g. johndoe" />
                </div>
                <div className="admin-dash__field">
                  <label>LinkedIn Username/ID</label>
                  <input type="text" name="linkedin" value={memberForm.linkedin} onChange={handleMemberFormChange} placeholder="e.g. john-doe-123" />
                </div>
                <div className="admin-dash__field admin-dash__field--full" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: 12, border: '1px solid rgba(255, 77, 77, 0.1)' }}>
                  <input 
                    type="checkbox" 
                    id="isSuspended" 
                    name="isSuspended" 
                    checked={!!memberForm.isSuspended} 
                    onChange={(e) => setMemberForm(prev => ({ ...prev, isSuspended: !!e.target.checked }))}
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                  />
                  <label htmlFor="isSuspended" style={{ margin: 0, cursor: 'pointer', color: '#ff4d4d', fontWeight: 700 }}>Suspend Account</label>
                </div>
                  <div className="admin-dash__field">
                    <label>Domain *</label>
                    <select value={memberForm.domain || 'General'} onChange={e => {
                      const newDomain = e.target.value;
                      let newRole = memberForm.role;
                      if (newDomain === 'Zero Order') newRole = 'President';
                      else if (newDomain === 'Advisor') newRole = 'Advisor';
                      else if (newDomain === 'General') newRole = 'Student';
                      else if (['Protocol & Operations', 'Creative & Content', 'Media & Broadcasting', 'Public Speaking', 'Tech & Innovation'].includes(newDomain)) {
                        newRole = 'Core Member';
                      }
                      setMemberForm({ ...memberForm, domain: newDomain, role: newRole });
                    }}>
                      <option value="Zero Order">Zero Order</option>
                      <option value="Advisor">Advisor</option>
                      <option value="Protocol & Operations">Protocol & Operations</option>
                      <option value="Creative & Content">Creative & Content</option>
                      <option value="Media & Broadcasting">Media & Broadcasting</option>
                      <option value="Public Speaking">Public Speaking</option>
                      <option value="Tech & Innovation">Tech & Innovation</option>
                      <option value="General">General (Student)</option>
                    </select>
                  </div>
                  <div className="admin-dash__field">
                    <label>Role *</label>
                    <select
                      value={memberForm.role}
                      onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                    >
                      {memberForm.domain === 'Zero Order' ? (
                        <>
                          <option value="Head of the Department">Head of the Department</option>
                          <option value="Alternate Head of Department">Alternate Head of Department</option>
                          <option value="President">President</option>
                          <option value="Chief Secretary">Chief Secretary</option>
                          <option value="Treasurer">Treasurer</option>
                        </>
                      ) : memberForm.domain === 'Advisor' ? (
                        <option value="Advisor">Advisor</option>
                      ) : memberForm.domain === 'Student' || !memberForm.domain || memberForm.domain === 'General' ? (
                        <option value="Student">Student</option>
                      ) : (
                        <>
                          <option value="Chief">Chief</option>
                          <option value="Lead">Lead</option>
                          <option value="Core Member">Core Member</option>
                          <option value="Associate">Associate</option>
                          <option value="Student">Student</option>
                        </>
                      )}
                    </select>
                  </div>
                </>
              ) : (
                <div className="admin-dash__field"><label>Role</label><input disabled value={memberForm.role} title="Only Zero Order can change roles/domains" /></div>
              )}
              
              <div className="admin-dash__field">
                <label>Color</label>
                <input type="color" value={memberForm.color} onChange={e => setMemberForm({ ...memberForm, color: e.target.value })} style={{ padding: '0', height: '37px', cursor: 'pointer', border: 'none', background: 'transparent' }} title="Choose Role Color" />
              </div>
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
              <div className="admin-dash__field"><label>Points</label><input type="number" value={eventForm.points} onChange={e => setEventForm({ ...eventForm, points: Number(e.target.value) })} /></div>
              <div className="admin-dash__field"><label>Slots</label><input type="number" value={eventForm.slots} onChange={e => setEventForm({ ...eventForm, slots: Number(e.target.value) })} /></div>

              <div className="admin-dash__field">
                <label>Start Time *</label>
                <input required type="datetime-local" value={eventForm.startTime ? new Date(new Date(eventForm.startTime).getTime() - new Date(eventForm.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })} />
              </div>
              <div className="admin-dash__field">
                <label>End Time *</label>
                <input required type="datetime-local" value={eventForm.endTime ? new Date(new Date(eventForm.endTime).getTime() - new Date(eventForm.endTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })} />
              </div>
              <div className="admin-dash__field">
                <label>Registration Deadline</label>
                <input type="datetime-local" value={eventForm.registrationDeadline ? new Date(new Date(eventForm.registrationDeadline).getTime() - new Date(eventForm.registrationDeadline).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} />
              </div>

              <div className="admin-dash__field admin-dash__field--full admin-dash__field--divider"><label className="admin-dash__field-section-label">Advanced Access Control</label></div>
              
              <div className="admin-dash__field">
                <label>Access Level *</label>
                <select value={eventForm.accessType} onChange={e => setEventForm({ ...eventForm, accessType: e.target.value })}>
                  <option value="public">Public (All Forge Members)</option>
                  <option value="domain">Domain Specific (Selected Domains)</option>
                  <option value="private">Private (Specific Guest List)</option>
                </select>
              </div>

              {eventForm.accessType === 'domain' && (
                <div className="admin-dash__field admin-dash__field--full">
                  <label>Allowed Domains</label>
                  <div className="admin-dash__picker">
                    {['Protocol & Operations', 'Creative & Content', 'Media & Broadcasting', 'Public Speaking', 'Tech & Innovation', 'General'].map(d => (
                      <div 
                        key={d} 
                        className={`admin-dash__chip ${eventForm.allowedDomains.includes(d) ? 'admin-dash__chip--active' : ''}`}
                        onClick={() => {
                          const next = eventForm.allowedDomains.includes(d)
                            ? eventForm.allowedDomains.filter(item => item !== d)
                            : [...eventForm.allowedDomains, d];
                          setEventForm({ ...eventForm, allowedDomains: next });
                        }}
                      >
                        {d}
                        {eventForm.allowedDomains.includes(d) && <CheckCircle size={12} style={{ marginLeft: 6 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eventForm.accessType === 'private' && (
                <div className="admin-dash__field admin-dash__field--full">
                  <label>Allowed Members (Guest List)</label>
                  <div className="admin-dash__search-picker">
                    <input 
                      placeholder="Search member... (Name or Roll Number)" 
                      value={memberSearchQuery}
                      onChange={e => {
                        setMemberSearchQuery(e.target.value);
                        setShowMemberSearchResults(true);
                      }}
                      onFocus={() => setShowMemberSearchResults(true)}
                    />
                    {showMemberSearchResults && memberSearchQuery.trim() && (
                      <div className="admin-dash__search-results">
                        {members
                          .filter(m => 
                            !eventForm.allowedMembers.includes(Number(m.rollNumber)) &&
                            (m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                             String(m.rollNumber).toLowerCase().includes(memberSearchQuery.toLowerCase()))
                          )
                          .slice(0, 10)
                          .map(m => (
                            <div key={m.id} className="admin-dash__search-item" onClick={() => {
                              setEventForm({ ...eventForm, allowedMembers: [...eventForm.allowedMembers, Number(m.rollNumber)] });
                              setMemberSearchQuery('');
                              setShowMemberSearchResults(false);
                            }}>
                              <img src={m.photoUrl || 'https://via.placeholder.com/150'} className="admin-dash__search-avatar" alt="" />
                              <div className="admin-dash__search-info">
                                <span className="admin-dash__search-name">{m.name}</span>
                                <span className="admin-dash__search-meta">{m.rollNumber} • {m.domain}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  <div className="admin-dash__picker">
                    {eventForm.allowedMembers.map(roll => {
                      const m = members.find(mem => Number(mem.rollNumber) === Number(roll));
                      return (
                        <div key={roll} className="admin-dash__chip admin-dash__chip--active" title={`Roll: ${roll}`} onClick={() => {
                          setEventForm({ ...eventForm, allowedMembers: eventForm.allowedMembers.filter(r => Number(r) !== Number(roll)) });
                        }}>
                          {m ? m.name : roll} <span style={{ marginLeft: 6, opacity: 0.5 }}>✕</span>
                        </div>
                      );
                    })}
                    {eventForm.allowedMembers.length === 0 && <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>Guest list is empty. Search above.</span>}
                  </div>
                </div>
              )}

              <div className="admin-dash__field admin-dash__field--full">
                <label>Available Roles (comma-separated)</label>
                <input 
                  value={Array.isArray(eventForm.roles) ? eventForm.roles.join(', ') : ''} 
                  onChange={e => setEventForm({ ...eventForm, roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean) })}
                  placeholder="Participant, Volunteer, Organizer"
                />
              </div>

              <div className="admin-dash__field">
                <label>Registration Status</label>
                <select value={eventForm.isRegistrationOpen ? 'open' : 'closed'} onChange={e => setEventForm({ ...eventForm, isRegistrationOpen: e.target.value === 'open' })}>
                  <option value="open">Open (Ready for sign-ups)</option>
                  <option value="closed">Closed (Manual Only)</option>
                </select>
              </div>
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

      {/* ── Registrations Modal ────────────────────────────── */}
      {showRegsModal && selectedEventForRegs && (
        <div className="admin-dash__overlay" data-lenis-prevent="true" onClick={() => setShowRegsModal(false)}>
          <div className="admin-dash__modal admin-dash__modal--large" onClick={e => e.stopPropagation()}>
            <div className="admin-dash__modal-header">
              <div>
                <h2>Registrations</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0, marginTop: 4 }}>{selectedEventForRegs.title}</p>
              </div>
              <button type="button" className="admin-dash__close-btn" onClick={() => setShowRegsModal(false)}><X size={20} /></button>
            </div>
            
            {regsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading registrations...</div>
            ) : (
              <div className="admin-dash__table-wrap" style={{ marginTop: 20, maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="admin-dash__table">
                  <thead style={{ position: 'sticky', top: 0, background: '#111', zIndex: 10 }}>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRegs.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 20 }}>No one has registered yet.</td></tr>
                    ) : eventRegs.map(reg => (
                      <tr key={reg.id}>
                        <td>{reg.name}</td>
                        <td className="admin-dash__mono">{reg.rollNumber}</td>
                        <td style={{ color: 'rgba(255,255,255,0.6)' }}>{reg.email.replace('@kluniversity.in', '')}</td>
                        <td>
                          <select 
                            value={reg.role || 'Participant'} 
                            onChange={(e) => updateMemberRole(reg.id, e.target.value)}
                            style={{ 
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', 
                              color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem', outline: 'none' 
                            }}
                          >
                            <option value="Participant">Participant</option>
                            <option value="Volunteer">Volunteer</option>
                            <option value="Organizer">Organizer</option>
                          </select>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{new Date(reg.registeredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="admin-dash__modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="admin-dash__cancel-btn" onClick={() => setShowRegsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
