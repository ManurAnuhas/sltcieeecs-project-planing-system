import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  logoutUser,
  getAllUsers,
  createProject,
  deleteProject,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateUserProfile,
  deleteUserAccount,
  sendAdminPasswordReset,
  subscribeUserProjects,
} from '../services/firebaseService';
import type { AppUser, ProjectWorkspace, UserRole } from '../types';
import { MAIN_CS_POSITIONS } from '../types';
import { Shield, Plus, Users, FolderOpen, LogOut, Trash2, X, Check, Copy, Clock, Edit, Key } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm, useToast } from '../components/DialogComponents';

export const AdminPage: React.FC = () => {
  const { appUser, isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'pending'>('projects');
  const [showNewProject, setShowNewProject] = useState(false);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; position: UserRole; status: 'pending' | 'approved' | 'rejected' }>({
    name: '',
    position: 'Other',
    status: 'approved',
  });
  const [resetSent, setResetSent] = useState(false);
  const { confirm, ConfirmDialogNode } = useConfirm();
  const { toast, ToastNode } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    chairpersonUid: '',
    coChairUids: ['', '', '', ''],
    pvLeadUid: '',
  });

  useEffect(() => {
    if (!appUser) return;
    const unsub = subscribeUserProjects(appUser.uid, isAdmin, setProjects);
    return () => unsub();
  }, [appUser, isAdmin]);

  useEffect(() => {
    getAllUsers().then(setAllUsers);
    getPendingUsers().then(setPendingUsers);
  }, []);

  const handleApprove = async (uid: string, userName: string) => {
    await approveUser(uid, appUser?.name || 'Admin', userName);
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    getAllUsers().then(setAllUsers);
  };

  const handleReject = async (uid: string, userName: string) => {
    const ok = await confirm({ title: 'Reject Access Request', message: `Reject and remove ${userName}'s access request? They will be unable to log in.`, confirmLabel: 'Reject', cancelLabel: 'Keep', variant: 'warning' });
    if (ok) {
      await rejectUser(uid, appUser?.name || 'Admin', userName);
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
      toast(`${userName}'s request was rejected.`, 'info');
    }
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      position: user.position,
      status: user.status as any,
    });
    setResetSent(false);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUserProfile(editingUser.uid, {
      name: editForm.name,
      position: editForm.position,
      status: editForm.status,
    });
    setEditingUser(null);
    getAllUsers().then(setAllUsers);
  };

  const handleDeleteUser = async (user: AppUser) => {
    const ok = await confirm({ title: 'Remove Member', message: `Are you sure you want to permanently remove ${user.name} (${user.email})? This action cannot be undone.`, confirmLabel: 'Remove', variant: 'danger' });
    if (ok) {
      await deleteUserAccount(user.uid);
      setAllUsers(prev => prev.filter(u => u.uid !== user.uid));
      setPendingUsers(prev => prev.filter(u => u.uid !== user.uid));
      toast(`${user.name} has been removed.`, 'success');
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      await sendAdminPasswordReset(email);
      setResetSent(true);
      toast('Password reset email sent!', 'success');
    } catch (err: any) {
      toast('Error sending password reset: ' + err.message, 'error');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !form.name || !form.chairpersonUid) return;

    const chairUser = allUsers.find(u => u.uid === form.chairpersonUid);
    const validCoChairs = form.coChairUids.filter(u => u !== '');
    const pvUid = form.pvLeadUid;

    const memberUids = Array.from(new Set([
      form.chairpersonUid,
      ...validCoChairs,
      ...(pvUid ? [pvUid] : []),
    ]));

    await createProject({
      name: form.name,
      description: form.description,
      createdBy: appUser.uid,
      chairpersonUid: form.chairpersonUid,
      chairpersonName: chairUser ? chairUser.name : 'Chairperson',
      coChairUids: validCoChairs,
      pvLeadUid: pvUid,
      memberUids,
    });

    setShowNewProject(false);
    setForm({ name: '', description: '', chairpersonUid: '', coChairUids: ['', '', '', ''], pvLeadUid: '' });
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const handleCopyShareLink = (shareCode: string) => {
    const link = `${window.location.origin}/view/${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopiedShare(shareCode);
    setTimeout(() => setCopiedShare(null), 2000);
  };

  const handleDeleteProject = async (id: string) => {
    const ok = await confirm({ title: 'Delete Project', message: 'Delete this project and all its data? This cannot be undone.', confirmLabel: 'Delete Project', variant: 'danger' });
    if (ok) {
      await deleteProject(id);
      toast('Project deleted.', 'success');
    }
  };

  const adminUsers = allUsers.filter(u => MAIN_CS_POSITIONS.includes(u.position as any));

  const SIDEBAR_W = 240;

  return (
    <>
      {/* ══════════════════════════════════════════════
          FIXED LEFT SIDEBAR (Muxx-style Layout)
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: `${SIDEBAR_W}px`,
        zIndex: 200,
        background: '#090d16',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
      }}>
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
            background: 'linear-gradient(135deg, rgba(247,148,29,0.25), rgba(247,148,29,0.08))',
            border: '1px solid rgba(247,148,29,0.5)',
            fontSize: '0.65rem', fontWeight: 800, color: '#F7941D',
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F7941D', boxShadow: '0 0 6px #F7941D' }} />
            ADMIN PORTAL
          </div>
        </div>

        {/* Section Label */}
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>
          NAVIGATION
        </div>

        {/* Navigation Actions Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="btn"
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 14px', gap: '10px',
              fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(0, 98, 155, 0.5), rgba(0, 98, 155, 0.2))',
              border: '1px solid rgba(0, 98, 155, 0.6)',
              color: '#e0f0ff', boxShadow: '0 4px 14px rgba(0,98,155,0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            🏠 Dashboard Home
          </button>

          <button
            className="btn"
            onClick={() => { setActiveTab('projects'); setShowNewProject(true); }}
            style={{
              width: '100%', height: '44px', justifyContent: 'flex-start', padding: '0 14px', gap: '10px',
              fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.5), rgba(2,132,199,0.3))',
              border: '1px solid rgba(6,182,212,0.6)',
              color: '#e0fbff', boxShadow: '0 4px 14px rgba(6,182,212,0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={17} style={{ color: '#22d3ee' }} /> New Project
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '12px', marginBottom: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97706, #fbbf24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 800, color: '#000', flexShrink: 0,
          }}>
            <Shield size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUser?.name}</div>
            <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appUser?.position}</div>
          </div>
        </div>

        {/* Logout Button Fixed at Bottom */}
        <button
          className="btn btn-outline"
          onClick={logoutUser}
          title="Sign Out"
          style={{
            width: '100%', height: '40px', justifyContent: 'flex-start', padding: '0 14px',
            borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600,
            borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.05)',
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>

        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '12px', textAlign: 'center' }}>
          © 2026 IEEE CS SLTC
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FIXED TOP BAR (Admin Title)
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 0, left: `${SIDEBAR_W}px`, right: 0,
        zIndex: 180,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.3px' }}>
          Webmaster Admin Console
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════ */}
      <div style={{ marginLeft: `${SIDEBAR_W}px`, padding: '80px 24px 32px' }}>


      {/* Admin Badge */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,163,0,0.06)', borderColor: 'rgba(255,163,0,0.2)' }}>
        <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '36px' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Admin Panel — SLTC IEEE CS</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage projects, assign access, and view all committee members.</div>
        </div>
        <span className="badge badge-published" style={{ marginLeft: 'auto' }}>
          <Shield size={12} /> Admin Access
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderOpen size={16} /> Projects ({projects.length})
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Members ({allUsers.length})
        </button>
        <button
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('pending')}
          style={{ position: 'relative' }}
        >
          <Clock size={16} /> Pending Approval ({pendingUsers.length})
          {pendingUsers.length > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: '#f87171', color: '#fff', borderRadius: '50%',
              width: '18px', height: '18px', fontSize: '0.7rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
            }}>{pendingUsers.length}</span>
          )}
        </button>
      </div>

      {/* ─── PROJECTS TAB ─── */}
      {activeTab === 'projects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn btn-gold" onClick={() => setShowNewProject(true)}>
              <Plus size={16} /> New Clean Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No projects yet. Click "New Clean Project" to create the first one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map(proj => {
                return (
                  <div key={proj.id} className="glass-panel" style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{proj.name}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{proj.description}</p>
                        <div style={{ fontSize: '0.82rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span>👤 Chair: <strong>{proj.chairpersonName}</strong></span>
                          <span>👥 Co-Chairs: <strong>{proj.coChairUids.length}</strong></span>
                          <span>🎨 PV Lead: <strong>{allUsers.find(u => u.uid === proj.pvLeadUid)?.name || 'Unassigned'}</strong></span>
                          <span>👁️ Members: <strong>{proj.memberUids.length}</strong></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleCopyShareLink(proj.shareCode)}
                        >
                          {copiedShare === proj.shareCode ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Share View Link</>}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', color: '#f87171' }}
                          onClick={() => handleDeleteProject(proj.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Project Modal */}
          {showNewProject && (
            <div className="modal-backdrop">
              <div className="modal-content glass-panel" style={{ maxWidth: '620px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Project Workspace</h2>
                  <button className="btn btn-outline" onClick={() => setShowNewProject(false)} style={{ padding: '4px 10px' }}><X size={16} /></button>
                </div>

                <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>PROJECT NAME *</label>
                      <input type="text" placeholder="e.g. CodeSprint 6.0" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>DESCRIPTION</label>
                      <input type="text" placeholder="Brief event description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>PROJECT CHAIRPERSON (Full Edit Access) *</label>
                    <select value={form.chairpersonUid} onChange={e => setForm({ ...form, chairpersonUid: e.target.value })} required>
                      <option value="" style={{ background: '#111827' }}>Select Chairperson...</option>
                      {allUsers.map(u => (
                        <option key={u.uid} value={u.uid} style={{ background: '#111827' }}>
                          {u.name} — {u.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>CO-CHAIRPERSONS (Full Edit Access — Up to 4)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {form.coChairUids.map((uid, idx) => (
                        <select key={idx} value={uid} onChange={e => {
                          const updated = [...form.coChairUids];
                          updated[idx] = e.target.value;
                          setForm({ ...form, coChairUids: updated });
                        }}>
                          <option value="" style={{ background: '#111827' }}>Co-Chair {idx + 1} (optional)</option>
                          {allUsers.map(u => (
                            <option key={u.uid} value={u.uid} style={{ background: '#111827' }}>
                              {u.name} — {u.position}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>PV TEAM LEAD (Status Update Access Only)</label>
                    <select value={form.pvLeadUid} onChange={e => setForm({ ...form, pvLeadUid: e.target.value })}>
                      <option value="" style={{ background: '#111827' }}>Select PV Lead (optional)...</option>
                      {allUsers.map(u => (
                        <option key={u.uid} value={u.uid} style={{ background: '#111827' }}>
                          {u.name} — {u.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowNewProject(false)}>Cancel</button>
                    <button type="submit" className="btn btn-gold"><Plus size={16} /> Create Project</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 8 Main Positions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/cs-icon.png" alt="" style={{ height: '24px' }} />
              Main Committee Positions ({adminUsers.length}/8 registered)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {MAIN_CS_POSITIONS.map(pos => {
                const user = adminUsers.find(u => u.position === pos);
                return (
                  <div key={pos} style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${user ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    background: user ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pos}</div>
                      {user ? (
                        <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {user.name}</div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Not registered yet</div>
                      )}
                    </div>
                    {user ? (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button className="btn btn-outline" style={{ padding: '5px 9px', fontSize: '0.75rem' }} onClick={() => handleOpenEditUser(user)} title="Edit Details & Access">
                          <Edit size={13} /> Edit
                        </button>
                        <button className="btn btn-outline" style={{ padding: '5px 7px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => handleDeleteUser(user)} title="Remove Member">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="badge badge-draft">Vacant</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Registered Users */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--accent-cyan)' }} />
              All Registered Members ({allUsers.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allUsers.map(u => (
                <div key={u.uid} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.name}
                      <span className={`badge ${u.status === 'approved' ? 'badge-published' : 'badge-scheduled'}`} style={{ fontSize: '0.68rem' }}>
                        {u.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email} • <strong style={{ color: 'var(--accent-cyan)' }}>{u.position}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px' }} onClick={() => handleOpenEditUser(u)}>
                      <Edit size={14} /> Edit / Access
                    </button>
                    <button className="btn btn-outline" style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.8rem' }} onClick={() => handleDeleteUser(u)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PENDING APPROVALS TAB ─── */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 600 }}>No pending approvals</div>
              <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>All registered users have been reviewed.</div>
            </div>
          ) : (
            pendingUsers.map(u => (
              <div key={u.uid} className="glass-panel" style={{ padding: '18px 22px', borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>{u.email}</div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-scheduled">{u.position}</span>
                      {u.requestedProjectName && (
                        <span style={{ fontSize: '0.78rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '6px', padding: '2px 8px', fontWeight: 600 }}>
                          🎯 Project: {u.requestedProjectName}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: '#fbbf24' }}>⏳ Awaiting approval</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}
                      onClick={() => handleApprove(u.uid, u.name)}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                      onClick={() => handleReject(u.uid, u.name)}
                    >
                      <X size={15} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── EDIT USER & ACCESS MODAL ─── */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} style={{ color: 'var(--accent-cyan)' }} /> Edit Member & Access Control
              </h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setEditingUser(null)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>FULL NAME</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>EMAIL (READ ONLY)</label>
                <input value={editingUser.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>POSITION / ACCESS ROLE</label>
                <select value={editForm.position} onChange={e => setEditForm(f => ({ ...f, position: e.target.value as UserRole }))}>
                  <optgroup label="Main Committee Positions (Full System Access)">
                    {MAIN_CS_POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </optgroup>
                  <optgroup label="General Members & Project Positions">
                    <option value="Project-Chairperson">Project Chairperson</option>
                    <option value="Project-Co-Chairperson">Project Co-Chairperson</option>
                    <option value="Other">General Committee Member / Other</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>ACCOUNT STATUS</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="approved">Approved (Full Access)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected / Suspended</option>
                </select>
              </div>

              {/* Password Reset option */}
              <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} style={{ color: '#fbbf24' }} /> Reset Password
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                  Send a password reset email link to {editingUser.email}.
                </p>
                {resetSent ? (
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                    ✓ Password reset email sent!
                  </span>
                ) : (
                  <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }} onClick={() => handleSendPasswordReset(editingUser.email)}>
                    <Key size={13} /> Send Reset Link
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', fontSize: '0.85rem' }} onClick={() => handleDeleteUser(editingUser)}>
                  <Trash2 size={15} /> Delete Account
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-gold">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PENDING APPROVALS TAB ─── */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 600 }}>No pending approvals</div>
              <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>All registered users have been reviewed.</div>
            </div>
          ) : (
            pendingUsers.map(u => (
              <div key={u.uid} className="glass-panel" style={{ padding: '18px 22px', borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>{u.email}</div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-scheduled">{u.position}</span>
                      <span style={{ fontSize: '0.78rem', color: '#fbbf24' }}>⏳ Awaiting approval</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}
                      onClick={() => handleApprove(u.uid, u.name)}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                      onClick={() => handleReject(u.uid, u.name)}
                    >
                      <X size={15} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
      {ConfirmDialogNode}
      {ToastNode}
    </>
  );
};
