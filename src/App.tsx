import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminPage } from './pages/AdminPage';
import { PublicViewPage } from './pages/PublicViewPage';
import {
  subscribeUserProjects,
  subscribeProjectAssets,
  subscribeNotifications,
  createAsset,
  updateAsset,
  deleteAsset,
  createProject,
  logoutUser,
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
} from './services/firebaseService';
import type { ProjectWorkspace, AssetPlanItem, AppNotification, AppUser } from './types';
import { IS_ADMIN_ROLE } from './types';
import { SummaryCards } from './components/SummaryCards';
import { FlyerTable } from './components/FlyerTable';
import { FlyerFormModal } from './components/FlyerFormModal';
import { SummaryModal } from './components/SummaryModal';
import { ProjectSelector } from './components/ProjectSelector';
import { NotificationPanel } from './components/NotificationPanel';
import { ProfileModal } from './components/ProfileModal';
import { LogoLibraryModal } from './components/LogoLibraryModal';
import { ProjectLogoVault } from './components/ProjectLogoVault';
import { useConfirm, useToast } from './components/DialogComponents';
import { LogOut, Shield, User as UserIcon, Plus, Clock, Check, X, Menu, Settings, Image as ImageIcon } from 'lucide-react';

// Protected Route Wrapper — also handles pending approval screen
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, appUser, loading, isPending } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  // User registered but waiting for admin approval
  if (isPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <img src="/cs-logo-full.png" alt="1PHI SLTC" style={{ height: '64px', margin: '0 auto 24px', display: 'block' }} />
          <div className="glass-panel" style={{ padding: '36px 28px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>Awaiting Approval</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              Your account has been created successfully as <strong style={{ color: '#fbbf24' }}>{appUser?.position}</strong>.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '24px' }}>
              A <strong>main committee member</strong> needs to approve your account before you can access the system. 
              Please wait or contact your Chairperson / Webmaster.
            </p>
            <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.08)', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)', fontSize: '0.85rem', color: '#fbbf24', marginBottom: '20px' }}>
              📧 <strong>{appUser?.email}</strong>
            </div>
            <button className="btn btn-outline" onClick={logoutUser} style={{ color: '#f87171' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Admin-only Route — all 8 main committee positions
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  const isWebmaster = appUser ? (appUser.position === 'Webmaster' || appUser.position === 'Assistant Webmaster') : false;

  if (!isWebmaster) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
        <div>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '56px', margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#f87171', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '400px' }}>
            The Admin Panel is restricted to <strong>Webmaster</strong> and <strong>Assistant Webmaster</strong> only.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Your position: <strong style={{ color: '#fbbf24' }}>{appUser?.position || 'Unknown'}</strong>
          </p>
          <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>← Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Main Dashboard View
const Dashboard: React.FC = () => {
  const { appUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isMainCommittee = appUser ? IS_ADMIN_ROLE(appUser.position) : false;
  const isWebmaster = appUser ? (appUser.position?.toLowerCase().includes('webmaster') || false) : false;

  // Core project / asset state
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [assetItems, setAssetItems] = useState<AssetPlanItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetPlanItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { toast, ToastNode } = useToast();

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  // All 8 main committee: Create Project modal
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '', description: '',
    chairpersonUid: '', coChairUids: ['', '', '', ''], pvLeadUid: '',
  });
  const [creating, setCreating] = useState(false);

  // All 8 main committee: Pending approvals
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [showPending, setShowPending] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGlobalLogoHub, setShowGlobalLogoHub] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'logos'>('planner');

  // Subscribe to Projects
  useEffect(() => {
    if (!appUser) return;
    const unsub = subscribeUserProjects(appUser.uid, isAdmin, (projs) => {
      setProjects(projs);
      if (projs.length > 0 && !currentProjectId) setCurrentProjectId(projs[0].id);
    });
    return () => unsub();
  }, [appUser, isAdmin]);

  // Subscribe to Assets
  useEffect(() => {
    if (!currentProjectId) { setAssetItems([]); return; }
    const unsub = subscribeProjectAssets(currentProjectId, setAssetItems);
    return () => unsub();
  }, [currentProjectId]);

  // Subscribe to notifications (all logged-in users)
  useEffect(() => {
    const unsub = subscribeNotifications(setNotifications);
    return () => unsub();
  }, []);

  // Load allUsers + pending users for main committee
  useEffect(() => {
    if (!isMainCommittee) return;
    getAllUsers().then(setAllUsers);
    getPendingUsers().then(setPendingUsers);
  }, [isMainCommittee]);

  const refreshPending = useCallback(() => {
    if (isMainCommittee) getPendingUsers().then(setPendingUsers);
  }, [isMainCommittee]);

  const activeProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const isChairOrCoChair = activeProject && (
    activeProject.chairpersonUid === appUser?.uid ||
    activeProject.coChairUids.includes(appUser?.uid || '')
  );
  const canEditProject = isAdmin || isChairOrCoChair;
  const canUpdateStatusOnly = !canEditProject && activeProject?.pvLeadUid === appUser?.uid;

  const handleSaveAsset = async (item: AssetPlanItem) => {
    if (editingItem) { await updateAsset(item.id, item); }
    else { await createAsset(item); }
    setIsFormOpen(false); setEditingItem(null);
  };

  const handleDeleteAsset = async (id: string) => {
    const ok = await confirm({ title: 'Delete Asset', message: 'Are you sure you want to delete this planned asset? This action cannot be undone.', confirmLabel: 'Delete', variant: 'danger' });
    if (ok) { await deleteAsset(id); toast('Asset deleted.', 'success'); }
  };

  const handleStatusChange = async (id: string, newStatus: AssetPlanItem['status']) => {
    await updateAsset(id, { status: newStatus });
  };

  // Create Project (for all 8 main committee)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !createForm.name || !createForm.chairpersonUid) return;
    setCreating(true);
    const chairUser = allUsers.find(u => u.uid === createForm.chairpersonUid);
    const memberUids = Array.from(new Set([
      createForm.chairpersonUid,
      ...createForm.coChairUids.filter(Boolean),
      ...(createForm.pvLeadUid ? [createForm.pvLeadUid] : []),
    ]));
    await createProject({
      name: createForm.name,
      description: createForm.description,
      chairpersonUid: createForm.chairpersonUid,
      chairpersonName: chairUser?.name || '',
      coChairUids: createForm.coChairUids.filter(Boolean),
      pvLeadUid: createForm.pvLeadUid,
      memberUids,
      createdBy: appUser.uid,
    });
    setCreateForm({ name: '', description: '', chairpersonUid: '', coChairUids: ['', '', '', ''], pvLeadUid: '' });
    setShowCreateProject(false);
    setCreating(false);
  };

  // Approve / Reject pending users
  const handleApprove = async (u: AppUser) => {
    await approveUser(u.uid, appUser?.name || 'Admin', u.name);
    setPendingUsers(prev => prev.filter(x => x.uid !== u.uid));
    getAllUsers().then(setAllUsers);
  };
  const handleReject = async (u: AppUser) => {
    const ok = await confirm({ title: 'Reject Access Request', message: `Reject ${u.name}'s access request? They will not be able to log in.`, confirmLabel: 'Reject', cancelLabel: 'Keep', variant: 'warning' });
    if (ok) {
      await rejectUser(u.uid, appUser?.name || 'Admin', u.name);
      setPendingUsers(prev => prev.filter(x => x.uid !== u.uid));
      toast(`${u.name}'s request was rejected.`, 'info');
    }
  };

  const handleExportCSV = () => {
    if (!activeProject) return;
    const headers = ['ID', 'Asset Category', 'Title', 'Type', 'Release Date', 'Release Time', 'Status', 'PV Designer', 'Writer', 'Platforms', 'Drive Link'];
    const rows = assetItems.map(i => [
      i.id, `"${i.category}"`, `"${i.title}"`, `"${i.assetType}"`,
      i.releaseDate, i.releaseTime, i.status,
      `"${i.assignedPVDesigner}"`, `"${i.assignedWriter}"`,
      `"${i.targetPlatforms.join(';')}"`, `"${i.driveLink}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_asset_plan.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const SIDEBAR_W = 240;

  // Shared sidebar nav content (used in both desktop sidebar & mobile drawer)
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Brand Header */}
      <div style={{ marginBottom: '28px', paddingLeft: '4px' }}>
        <img
          src="/cs-icon.png"
          alt="IEEE CS SLTC"
          style={{ height: '48px', objectFit: 'contain', marginBottom: '10px', display: 'block' }}
        />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(247,148,29,0.18), rgba(247,148,29,0.08))',
          border: '1px solid rgba(247,148,29,0.4)',
          fontSize: '0.65rem', fontWeight: 800, color: '#F7941D',
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F7941D', boxShadow: '0 0 6px #F7941D' }} />
          PROJECT PORTAL
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>
        NAVIGATION
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn" onClick={() => { navigate('/'); onNavClick?.(); }}
          style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 14px', gap: '10px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, rgba(0, 98, 155, 0.5), rgba(0, 98, 155, 0.2))', border: '1px solid rgba(0, 98, 155, 0.6)', color: '#e0f0ff', boxShadow: '0 4px 14px rgba(0,98,155,0.25)', transition: 'all 0.2s ease' }}>
          🏠 Dashboard Home
        </button>

        <button className="btn" onClick={() => { setShowGlobalLogoHub(true); onNavClick?.(); }}
          style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 14px', gap: '10px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(168,85,247,0.15))', border: '1px solid rgba(168,85,247,0.5)', color: '#f3e8ff', boxShadow: '0 4px 14px rgba(168,85,247,0.2)', transition: 'all 0.2s ease' }}>
          <ImageIcon size={17} style={{ color: '#c084fc' }} /> Common Logo Hub
        </button>

        {isWebmaster && (
          <button className="btn" onClick={() => { navigate('/admin'); onNavClick?.(); }}
            style={{ width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 14px', gap: '10px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, rgba(247,148,29,0.55), rgba(247,148,29,0.25))', border: '1px solid rgba(247,148,29,0.7)', color: '#fff8ee', boxShadow: '0 4px 14px rgba(247,148,29,0.3)', transition: 'all 0.2s ease' }}>
            <Shield size={17} style={{ color: '#F7941D' }} /> Admin Panel
          </button>
        )}



        {isMainCommittee && (
          <button className="btn" onClick={() => { refreshPending(); setShowPending(p => !p); onNavClick?.(); }}
            style={{ width: '100%', height: '44px', justifyContent: 'space-between', padding: '0 14px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: showPending ? 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.12))' : 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))', border: `1px solid ${showPending ? 'rgba(251,191,36,0.6)' : 'rgba(251,191,36,0.3)'}`, color: '#fef3c7', boxShadow: showPending ? '0 4px 14px rgba(251,191,36,0.2)' : 'none', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={17} style={{ color: '#fbbf24' }} /> Approvals
            </div>
            {pendingUsers.length > 0 && (
              <span style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', color: '#fff', borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}>
                {pendingUsers.length}
              </span>
            )}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* User Card */}
      <div
        onClick={() => setShowProfileModal(true)}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '10px 12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Click to edit profile"
      >
        {appUser?.photoURL ? (
          <img
            src={appUser.photoURL}
            alt={appUser.name}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--accent-cyan)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #006699, #00d2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {appUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <UserIcon size={16} />}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUser?.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUser?.position}</div>
        </div>
        <Settings size={15} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
      </div>

      <button className="btn btn-outline" onClick={logoutUser} title="Sign Out"
        style={{ width: '100%', height: '40px', justifyContent: 'flex-start', padding: '0 14px', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600, borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.05)' }}>
        <LogOut size={16} /> Sign Out
      </button>

      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '12px', textAlign: 'center' }}>
        © 2026 IEEE CS SLTC
      </div>
    </>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════
          MOBILE DRAWER BACKDROP
      ══════════════════════════════════════════════ */}
      <div className={`mobile-drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={closeDrawer} />

      {/* ══════════════════════════════════════════════
          MOBILE SLIDE-IN DRAWER
      ══════════════════════════════════════════════ */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <SidebarContent onNavClick={closeDrawer} />
      </div>

      {/* ══════════════════════════════════════════════
          FIXED LEFT SIDEBAR — desktop only
      ══════════════════════════════════════════════ */}
      <div className="desktop-only" style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: `${SIDEBAR_W}px`,
        zIndex: 200,
        background: '#090d16',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        padding: '24px 16px',
      }}>
        <SidebarContent />
      </div>

      {/* ══════════════════════════════════════════════
          FIXED TOP BAR
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 0,
        /* Desktop: offset by sidebar width; Mobile: full width via CSS var */
        left: 0,
        right: 0,
        zIndex: 180,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      }}>
        {/* Left: hamburger (mobile) + spacer (desktop) + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger — mobile only */}
          <button className="hamburger-btn" onClick={() => setDrawerOpen(o => !o)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          {/* Sidebar spacer on desktop */}
          <div className="desktop-only" style={{ width: `${SIDEBAR_W - 16}px`, flexShrink: 0 }} />
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f3f4f6' }}>
            Project Planning Dashboard
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMainCommittee && (
            <button className="btn" onClick={() => { getAllUsers().then(setAllUsers); setShowCreateProject(true); }}
              style={{ height: '36px', padding: '0 14px', gap: '6px', fontSize: '0.82rem', borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg, rgba(6,182,212,0.5), rgba(2,132,199,0.3))', border: '1px solid rgba(6,182,212,0.6)', color: '#e0fbff', boxShadow: '0 2px 10px rgba(6,182,212,0.25)', transition: 'all 0.2s ease' }}>
              <Plus size={16} style={{ color: '#22d3ee' }} /> New Project
            </button>
          )}
          {appUser && (
            <NotificationPanel
              notifications={notifications}
              uid={appUser.uid}
              isOpen={notifOpen}
              onToggle={() => setNotifOpen(o => !o)}
            />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN PAGE CONTENT AREA
      ══════════════════════════════════════════════ */}
      {/* Content area: offset by sidebar on desktop, full-width on mobile */}
      <div style={{ marginLeft: 0, padding: '80px 16px 32px' }}
        className="main-content">

      {/* ── Pending Approvals Panel (main committee only) ── */}
      {isMainCommittee && showPending && (
        <div className="glass-panel" style={{ marginBottom: '20px', padding: '18px 20px', borderColor: 'rgba(251,191,36,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#fbbf24' }} /> Pending Approvals ({pendingUsers.length})
            </h3>
            <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowPending(false)}><X size={14} /></button>
          </div>
          {pendingUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>✅ No pending approvals right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingUsers.map(u => (
                <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.04)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span className="badge badge-scheduled">{u.position}</span>
                      {u.requestedProjectName && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '6px', padding: '1px 8px', fontWeight: 600 }}>
                          🎯 Project: {u.requestedProjectName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', fontSize: '0.82rem' }} onClick={() => handleApprove(u)}>
                      <Check size={14} /> Approve
                    </button>
                    <button className="btn btn-outline" style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.82rem' }} onClick={() => handleReject(u)}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Projects Workspace ── */}
      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', margin: '40px 0' }}>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Assigned Projects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 20px' }}>
            You have not been assigned to any project workspace yet.
            {isMainCommittee ? ' Create a new project above to get started.' : ' Ask a main committee member to assign you.'}
          </p>
          {isMainCommittee && (
            <button className="btn btn-primary" onClick={() => { getAllUsers().then(setAllUsers); setShowCreateProject(true); }}>
              <Plus size={16} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <>
          <ProjectSelector
            projects={projects}
            currentProjectId={currentProjectId}
            onSelectProject={id => setCurrentProjectId(id)}
            onCreateProject={() => { getAllUsers().then(setAllUsers); setShowCreateProject(true); }}
            canEdit={canEditProject}
          />

          {/* Project View Sub-Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setActiveTab('planner')}
              style={{
                fontSize: '0.88rem',
                fontWeight: activeTab === 'planner' ? 700 : 500,
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'planner' ? 'linear-gradient(135deg, rgba(0, 98, 155, 0.6), rgba(0, 98, 155, 0.3))' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === 'planner' ? '#006699' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === 'planner' ? '#e0f0ff' : 'var(--text-muted)',
                gap: '8px',
              }}
            >
              📊 Asset Release Matrix
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setActiveTab('logos')}
              style={{
                fontSize: '0.88rem',
                fontWeight: activeTab === 'logos' ? 700 : 500,
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'logos' ? 'linear-gradient(135deg, rgba(247,148,29,0.5), rgba(247,148,29,0.2))' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === 'logos' ? '#F7941D' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === 'logos' ? '#fff' : 'var(--text-muted)',
                gap: '8px',
              }}
            >
              <ImageIcon size={16} style={{ color: '#F7941D' }} /> Project Logos & Media Vault
            </button>
          </div>

          {activeTab === 'planner' ? (
            <>
              <SummaryCards
                items={assetItems}
                projectName={activeProject?.name || ''}
                canEdit={canEditProject}
                onOpenSummaryModal={() => setIsSummaryOpen(true)}
                onOpenAddModal={() => { setEditingItem(null); setIsFormOpen(true); }}
                onExportCSV={handleExportCSV}
              />
              <FlyerTable
                items={assetItems}
                projectName={activeProject?.name || ''}
                canEdit={canEditProject}
                canUpdateStatusOnly={canUpdateStatusOnly}
                onEditItem={item => { setEditingItem(item); setIsFormOpen(true); }}
                onDeleteItem={handleDeleteAsset}
                onStatusChange={handleStatusChange}
              />
            </>
          ) : (
            activeProject && (
              <ProjectLogoVault
                project={activeProject}
                currentUser={appUser}
                canManage={canEditProject}
              />
            )
          )}
        </>
      )}

      {/* ── Asset Form Modal ── */}
      {isFormOpen && (
        <FlyerFormModal item={editingItem} projectId={currentProjectId} onSave={handleSaveAsset}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }} />
      )}
      {isSummaryOpen && activeProject && (
        <SummaryModal items={assetItems} project={activeProject} onClose={() => setIsSummaryOpen(false)} />
      )}

      {/* ── Create Project Modal (all 8 main committee) ── */}
      {showCreateProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>📁 Create New Project</h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setShowCreateProject(false)}><X size={15} /></button>
            </div>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>PROJECT NAME *</label>
                <input placeholder="e.g. IEEE CS Tech Talk 2026" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>DESCRIPTION</label>
                <input placeholder="Short description..." value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>PROJECT CHAIRPERSON *</label>
                <select value={createForm.chairpersonUid} onChange={e => setCreateForm(f => ({ ...f, chairpersonUid: e.target.value }))} required>
                  <option value="">Select Chairperson...</option>
                  {allUsers.filter(u => u.status === 'approved').map(u => <option key={u.uid} value={u.uid}>{u.name} — {u.position}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>CO-CHAIRPERSONS (optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {createForm.coChairUids.map((uid, i) => (
                    <select key={i} value={uid} onChange={e => { const u = [...createForm.coChairUids]; u[i] = e.target.value; setCreateForm(f => ({ ...f, coChairUids: u })); }}>
                      <option value="">Co-Chair {i + 1} (optional)</option>
                      {allUsers.filter(u => u.status === 'approved').map(u => <option key={u.uid} value={u.uid}>{u.name} — {u.position}</option>)}
                    </select>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>PV TEAM LEAD (optional)</label>
                <select value={createForm.pvLeadUid} onChange={e => setCreateForm(f => ({ ...f, pvLeadUid: e.target.value }))}>
                  <option value="">Select PV Lead...</option>
                  {allUsers.filter(u => u.status === 'approved').map(u => <option key={u.uid} value={u.uid}>{u.name} — {u.position}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateProject(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={creating}>
                  {creating ? 'Creating...' : <><Plus size={15} /> Create Project</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      {showProfileModal && appUser && (
        <ProfileModal
          user={appUser}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => toast('Profile updated successfully!', 'success')}
        />
      )}
      {showGlobalLogoHub && (
        <LogoLibraryModal
          currentUser={appUser}
          isAdmin={isAdmin}
          onClose={() => setShowGlobalLogoHub(false)}
        />
      )}
      {/* Global modals — rendered outside content div so they're never clipped */}
      {ConfirmDialogNode}
      {ToastNode}
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/view/:shareCode" element={<PublicViewPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
