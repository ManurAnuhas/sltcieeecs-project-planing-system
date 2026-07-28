import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logoutUser, getAllUsers, createProject, deleteProject, getPendingUsers, approveUser, rejectUser } from '../services/firebaseService';
import type { AppUser, ProjectWorkspace } from '../types';
import { MAIN_CS_POSITIONS } from '../types';
import { Shield, Plus, Users, FolderOpen, LogOut, Trash2, X, Check, Copy, Clock } from 'lucide-react';
import { subscribeUserProjects } from '../services/firebaseService';
import confetti from 'canvas-confetti';

export const AdminPage: React.FC = () => {
  const { appUser, isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'pending'>('projects');
  const [showNewProject, setShowNewProject] = useState(false);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);

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

  const handleApprove = async (uid: string) => {
    await approveUser(uid);
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    getAllUsers().then(setAllUsers);
  };

  const handleReject = async (uid: string) => {
    if (confirm('Reject and remove this user account?')) {
      await rejectUser(uid);
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
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
    if (confirm('Delete this project? This cannot be undone.')) {
      await deleteProject(id);
    }
  };

  const adminUsers = allUsers.filter(u => MAIN_CS_POSITIONS.includes(u.position as any));
  const otherUsers = allUsers.filter(u => !MAIN_CS_POSITIONS.includes(u.position as any));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/cs-logo-full.png" alt="IEEE CS" style={{ height: '46px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {appUser?.name} — <strong style={{ color: '#fbbf24' }}>{appUser?.position}</strong>
          </span>
          <button className="btn btn-outline" onClick={() => window.location.href = '/'} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <FolderOpen size={15} /> Dashboard
          </button>
          <button className="btn btn-outline" onClick={logoutUser} style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#f87171' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {MAIN_CS_POSITIONS.map(pos => {
                const user = adminUsers.find(u => u.position === pos);
                return (
                  <div key={pos} style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${user ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    background: user ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pos}</div>
                      {user ? (
                        <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '2px' }}>✓ {user.name}</div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Not registered yet</div>
                      )}
                    </div>
                    <span className={`badge ${user ? 'badge-published' : 'badge-draft'}`}>
                      {user ? 'Active' : 'Vacant'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Members */}
          {otherUsers.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700, fontSize: '1rem' }}>
                Other Committee Members ({otherUsers.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {otherUsers.map(u => (
                  <div key={u.uid} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <span className="badge badge-draft">{u.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                      onClick={() => handleApprove(u.uid)}
                    >
                      <Check size={15} /> Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                      onClick={() => handleReject(u.uid)}
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
  );
};
