import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { Eye, Edit } from 'lucide-react';

interface AuthModalProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onSwitchUser, onClose }) => {
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState<UserRole>(currentUser.role);

  const presetProfiles: UserProfile[] = [
    {
      id: 'u-1',
      name: 'Kasun Perera',
      email: 'kasun.chair@sltc.lk',
      role: 'Chairperson'
    },
    {
      id: 'u-2',
      name: 'Nimali Silva',
      email: 'nimali.cochair@sltc.lk',
      role: 'Co-Chairperson'
    },
    {
      id: 'u-3',
      name: 'PV Team Lead (Design & Media)',
      email: 'pv.team@sltc.lk',
      role: 'PV-Team'
    },
    {
      id: 'u-4',
      name: 'SLTC IEEE Member (Viewer)',
      email: 'member@sltc.lk',
      role: 'Member-Viewer'
    }
  ];

  const handleCustomSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSwitchUser({
      id: `u-custom-${Date.now()}`,
      name: name || 'Anonymous User',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@sltc.lk`,
      role
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel" style={{ maxWidth: '520px' }}>
        {/* Modal Header with CS Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '38px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2 }}>Switch Account</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>SLTC IEEE CS — Committee Role Access</p>
            </div>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 10px' }}>✕</button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          Choose your role: <strong>Chairperson / Co-Chair</strong> = Edit Access &nbsp;|&nbsp; <strong>Member</strong> = View Only.
        </p>

        {/* Quick Select Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUICK PRESET PROFILES:</label>
          {presetProfiles.map(p => (
            <div
              key={p.id}
              onClick={() => onSwitchUser(p)}
              className="glass-panel"
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: currentUser.role === p.role && currentUser.name === p.name ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                background: currentUser.role === p.role && currentUser.name === p.name ? 'rgba(0,210,255,0.08)' : 'rgba(255,255,255,0.02)'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.email}</div>
              </div>

              <span className={`badge ${p.role === 'Chairperson' ? 'badge-published' : p.role === 'Co-Chairperson' ? 'badge-scheduled' : p.role === 'PV-Team' ? 'badge-in-design' : 'badge-draft'}`}>
                {p.role === 'Chairperson' || p.role === 'Co-Chairperson' ? <Edit size={12} /> : <Eye size={12} />}
                {p.role}
              </span>
            </div>
          ))}
        </div>

        {/* Custom Profile Form */}
        <form onSubmit={handleCustomSave} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>OR CREATE CUSTOM SESSION:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <select value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="Chairperson">Project Chairperson (Full Edit)</option>
              <option value="Co-Chairperson">Co-Chairperson (Full Edit)</option>
              <option value="PV-Team">PV Team (Status & Drive Links)</option>
              <option value="Member-Viewer">Committee Member (Read-Only)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save & Switch</button>
          </div>
        </form>
      </div>
    </div>
  );
};
