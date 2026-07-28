import React, { useState } from 'react';
import type { ProjectWorkspace } from '../types';
import { FolderPlus, Plus, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectSelectorProps {
  projects: ProjectWorkspace[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (project: ProjectWorkspace) => void;
  canEdit: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  canEdit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chairperson, setChairperson] = useState('');
  const [coChairs, setCoChairs] = useState(['', '', '', '']);
  const [copiedShare, setCopiedShare] = useState(false);

  const currentProj = projects.find(p => p.id === currentProjectId) || projects[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newProj: ProjectWorkspace = {
      id: `proj-${Date.now()}`,
      name,
      description: description || 'SLTC IEEE CS Event / Project Workspace',
      chairperson: chairperson || 'Project Chairperson',
      coChairpersons: coChairs.filter(c => c.trim() !== ''),
      createdDate: new Date().toISOString().split('T')[0],
      shareCode: name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000)
    };

    onCreateProject(newProj);
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setChairperson('');
    setCoChairs(['', '', '', '']);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}?project=${currentProj.shareCode}&view=member`;
    navigator.clipboard.writeText(link);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left Side: Select Workspace Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ padding: '6px', borderRadius: '10px', background: 'rgba(255,163,0,0.12)', display: 'flex', alignItems: 'center' }}>
            <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '36px', objectFit: 'contain' }} />
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
              PROJECT WORKSPACE
            </div>
            <select
              value={currentProjectId}
              onChange={e => onSelectProject(e.target.value)}
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '2px 0',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '300px'
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#111827', color: '#fff' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Team Leadership Badge */}
        {currentProj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chairperson:</span> <strong>{currentProj.chairperson}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                Co-Chairs ({currentProj.coChairpersons.length}): {currentProj.coChairpersons.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Create New Project Button & Share Link */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleCopyShareLink} title="Share View Access Link with Members">
            {copiedShare ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copiedShare ? 'Copied View Link!' : 'Share Member View Link'}
          </button>

          {canEdit && (
            <button className="btn btn-gold" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> New Clean Project
            </button>
          )}
        </div>
      </div>

      {/* Modal for Creating New Clean Project */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={22} style={{ color: 'var(--secondary-gold)' }} /> Create New Project Workspace
              </h2>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '4px 10px' }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CodeSprint 6.0 / IEEEXtreme 19.0"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the event"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Project Chairperson Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Perera"
                  value={chairperson}
                  onChange={e => setChairperson(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Co-Chairpersons (Up to 4 Co-Chairs with Edit Access)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {coChairs.map((cc, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Co-Chair ${idx + 1} Name`}
                      value={cc}
                      onChange={e => {
                        const updated = [...coChairs];
                        updated[idx] = e.target.value;
                        setCoChairs(updated);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold">
                  Create Clean Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
