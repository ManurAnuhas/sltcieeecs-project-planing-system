import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { AssetPlanItem, AssetCategory, AssetType } from '../types';

interface FlyerFormModalProps {
  item?: AssetPlanItem | null;
  projectId: string;
  onSave: (item: AssetPlanItem) => void;
  onClose: () => void;
}

export const FlyerFormModal: React.FC<FlyerFormModalProps> = ({ item, projectId, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<AssetPlanItem>>(
    item || {
      projectId,
      title: '',
      category: 'Flyer',
      assetType: 'Save The Date',
      releaseDate: new Date().toISOString().split('T')[0],
      releaseTime: '18:00',
      targetPlatforms: ['Facebook', 'Instagram', 'WhatsApp Group'],
      assignedPVDesigner: '',
      assignedWriter: '',
      captionStatus: 'Pending',
      captionText: '',
      driveLink: '',
      status: 'Draft',
      priority: 'Medium',
      notes: ''
    }
  );

  const availablePlatforms = ['Facebook', 'Instagram', 'LinkedIn', 'WhatsApp Group', 'WhatsApp Status'];

  const handlePlatformToggle = (platform: any) => {
    const current = formData.targetPlatforms || [];
    if (current.includes(platform)) {
      setFormData({ ...formData, targetPlatforms: current.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, targetPlatforms: [...current, platform] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please fill in the Asset Title');
      return;
    }

    const newItem: AssetPlanItem = {
      id: formData.id || `asset-${Date.now()}`,
      projectId: formData.projectId || projectId,
      title: formData.title || '',
      category: formData.category || 'Flyer',
      assetType: formData.assetType || 'Save The Date',
      releaseDate: formData.releaseDate || new Date().toISOString().split('T')[0],
      releaseTime: formData.releaseTime || '18:00',
      targetPlatforms: formData.targetPlatforms || [],
      assignedPVDesigner: formData.assignedPVDesigner || 'PV Team Member',
      assignedWriter: formData.assignedWriter || 'Content Writer',
      captionStatus: formData.captionStatus || 'Pending',
      captionText: formData.captionText || '',
      driveLink: formData.driveLink || '',
      status: formData.status || 'Draft',
      priority: formData.priority || 'Medium',
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newItem);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {item ? 'Edit Flyer Release Plan' : 'Add New Flyer Plan'}
          </h2>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px 12px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Asset Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as AssetCategory })}
              >
                <option value="Flyer">Flyer (Graphic)</option>
                <option value="Video">Video / Motion Graphic</option>
                <option value="Certificate">Certificate</option>
                <option value="Banner/Poster">Banner / Poster</option>
                <option value="Custom Asset">Custom Asset</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Asset Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Speaker Reveal Video / Teaser Flyer"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Asset Type / Stage
              </label>
              <select
                value={formData.assetType}
                onChange={e => setFormData({ ...formData, assetType: e.target.value as AssetType })}
              >
                <option value="Save The Date">Save The Date</option>
                <option value="Speaker Reveal">Speaker Reveal</option>
                <option value="Main Event Promo">Main Event Promo</option>
                <option value="Countdown Teaser">Countdown Teaser</option>
                <option value="Teaser Video">Teaser Video</option>
                <option value="Event Highlights Video">Event Highlights Video</option>
                <option value="Participant Certificate">Participant Certificate</option>
                <option value="Winner Certificate">Winner Certificate</option>
                <option value="Thank You Poster">Thank You Poster</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Target Release Date
              </label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Release Time
              </label>
              <input
                type="time"
                value={formData.releaseTime}
                onChange={e => setFormData({ ...formData, releaseTime: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Assigned PV Team Lead / Designer
              </label>
              <input
                type="text"
                placeholder="Name of PV Designer"
                value={formData.assignedPVDesigner}
                onChange={e => setFormData({ ...formData, assignedPVDesigner: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Assigned Content Writer
              </label>
              <input
                type="text"
                placeholder="Name of Content Writer"
                value={formData.assignedWriter}
                onChange={e => setFormData({ ...formData, assignedWriter: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Workflow Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Draft">Draft</option>
                <option value="In Design">In Design</option>
                <option value="Under Review">Under Review</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Published">Published</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Caption Status
              </label>
              <select
                value={formData.captionStatus}
                onChange={e => setFormData({ ...formData, captionStatus: e.target.value as any })}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Target Social Media Platforms
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              {availablePlatforms.map(plat => {
                const isSelected = (formData.targetPlatforms || []).includes(plat as any);
                return (
                  <button
                    type="button"
                    key={plat}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handlePlatformToggle(plat)}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Google Drive Link / Artwork URL
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={formData.driveLink}
              onChange={e => setFormData({ ...formData, driveLink: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Flyer Caption / Content Copy
            </label>
            <textarea
              rows={3}
              placeholder="Paste flyer caption here..."
              value={formData.captionText}
              onChange={e => setFormData({ ...formData, captionText: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">
              <Save size={16} /> Save Flyer Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
