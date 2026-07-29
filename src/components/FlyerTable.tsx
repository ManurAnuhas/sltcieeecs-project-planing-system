import React, { useState } from 'react';
import { Search, Filter, Edit3, Trash2, ExternalLink, Calendar, Clock, Film, FileText, Award, Image as ImageIcon } from 'lucide-react';
import type { AssetPlanItem, FilterStatus, AssetCategory } from '../types';

interface FlyerTableProps {
  items: AssetPlanItem[];
  projectName: string;
  canEdit: boolean;
  canUpdateStatusOnly: boolean;
  onEditItem: (item: AssetPlanItem) => void;
  onDeleteItem: (id: string) => void;
  onStatusChange: (id: string, newStatus: AssetPlanItem['status']) => void;
}

export const FlyerTable: React.FC<FlyerTableProps> = ({
  items,
  projectName,
  canEdit,
  canUpdateStatusOnly,
  onEditItem,
  onDeleteItem,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedPVDesigner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedWriter.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeClass = (status: AssetPlanItem['status']) => {
    switch (status) {
      case 'Draft': return 'badge-draft';
      case 'In Design': return 'badge-in-design';
      case 'Under Review': return 'badge-under-review';
      case 'Scheduled': return 'badge-scheduled';
      case 'Published': return 'badge-published';
      case 'Delayed': return 'badge-delayed';
      default: return 'badge-draft';
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'Flyer': return <ImageIcon size={14} style={{ color: '#00d2ff' }} />;
      case 'Video': return <Film size={14} style={{ color: '#c084fc' }} />;
      case 'Certificate': return <Award size={14} style={{ color: '#fbbf24' }} />;
      default: return <FileText size={14} style={{ color: '#9ca3af' }} />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Table Header & Workspace Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Asset & Media Plan ({projectName})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Track Flyers, Videos, & Certificates managed by Public Visibility Team
          </p>
        </div>

        {!canEdit && !canUpdateStatusOnly && (
          <span className="badge badge-draft" style={{ padding: '6px 12px' }}>
            🔒 Read-Only
          </span>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by title, designer, writer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ flex: 1, minWidth: '130px' }}
          >
            <option value="All">All Asset Types</option>
            <option value="Flyer">Flyer (Graphic)</option>
            <option value="Video">Video</option>
            <option value="Certificate">Certificate</option>
            <option value="Banner/Poster">Banner/Poster</option>
          </select>

          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value as FilterStatus)}
            style={{ flex: 1, minWidth: '130px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In Design">In Design</option>
            <option value="Under Review">Under Review</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Published">Published</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* ── DESKTOP TABLE VIEW ── */}
      <div className="desktop-only" style={{ overflowX: 'auto', display: 'block' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 14px' }}>Asset Category & Title</th>
              <th style={{ padding: '12px 14px' }}>Release Schedule</th>
              <th style={{ padding: '12px 14px' }}>PV Team & Writer</th>
              <th style={{ padding: '12px 14px' }}>Target Platforms</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Artwork / Link</th>
              {(canEdit || canUpdateStatusOnly) && (
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No planned assets found. Click <strong>"Add New Asset Plan"</strong> to get started.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {getCategoryIcon(item.category)}
                      <strong>{item.category}</strong> • <span>{item.assetType}</span>
                    </div>
                    <div style={{ fontWeight: 600, marginTop: '3px', color: '#f3f4f6', fontSize: '0.95rem' }}>
                      {item.title}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--secondary-gold)' }} />
                      <span style={{ fontWeight: 600 }}>{item.releaseDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Clock size={12} />
                      <span>{item.releaseTime}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      🎨 <span style={{ color: 'var(--text-muted)' }}>PV Des:</span> <strong>{item.assignedPVDesigner}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      ✍️ <span style={{ color: 'var(--text-muted)' }}>Writer:</span> <strong>{item.assignedWriter}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.targetPlatforms.map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', background: 'rgba(0,102,153,0.3)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {canEdit || canUpdateStatusOnly ? (
                      <select
                        value={item.status}
                        onChange={e => onStatusChange(item.id, e.target.value as any)}
                        className={`badge ${getStatusBadgeClass(item.status)}`}
                        style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                      >
                        <option value="Draft" style={{ background: '#111827', color: '#fff' }}>Draft</option>
                        <option value="In Design" style={{ background: '#111827', color: '#fff' }}>In Design</option>
                        <option value="Under Review" style={{ background: '#111827', color: '#fff' }}>Under Review</option>
                        <option value="Scheduled" style={{ background: '#111827', color: '#fff' }}>Scheduled</option>
                        <option value="Published" style={{ background: '#111827', color: '#fff' }}>Published</option>
                        <option value="Delayed" style={{ background: '#111827', color: '#fff' }}>Delayed</option>
                      </select>
                    ) : (
                      <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {item.driveLink ? (
                      <a href={item.driveLink} target="_blank" rel="noreferrer"
                        className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        <ExternalLink size={12} /> Drive Link
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No link yet</span>
                    )}
                  </td>
                  {(canEdit || canUpdateStatusOnly) && (
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => onEditItem(item)} title="Edit">
                          <Edit3 size={14} />
                        </button>
                        {canEdit && (
                          <button className="btn btn-outline" style={{ padding: '6px', color: '#f87171' }} onClick={() => onDeleteItem(item.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD VIEW ── */}
      <div className="mobile-only" style={{ flexDirection: 'column', display: 'none' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No assets found. Add a new asset plan to get started.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="mobile-asset-card">
              {/* Card Header: category + title + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    {getCategoryIcon(item.category)}
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.assetType}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f3f4f6', lineHeight: 1.3 }}>{item.title}</div>
                </div>
                {/* Status badge or select */}
                {(canEdit || canUpdateStatusOnly) ? (
                  <select
                    value={item.status}
                    onChange={e => onStatusChange(item.id, e.target.value as any)}
                    className={`badge ${getStatusBadgeClass(item.status)}`}
                    style={{ border: 'none', cursor: 'pointer', background: 'transparent', flexShrink: 0 }}
                  >
                    <option value="Draft" style={{ background: '#111827' }}>Draft</option>
                    <option value="In Design" style={{ background: '#111827' }}>In Design</option>
                    <option value="Under Review" style={{ background: '#111827' }}>Under Review</option>
                    <option value="Scheduled" style={{ background: '#111827' }}>Scheduled</option>
                    <option value="Published" style={{ background: '#111827' }}>Published</option>
                    <option value="Delayed" style={{ background: '#111827' }}>Delayed</option>
                  </select>
                ) : (
                  <span className={`badge ${getStatusBadgeClass(item.status)}`} style={{ flexShrink: 0 }}>{item.status}</span>
                )}
              </div>

              {/* Date + Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} style={{ color: 'var(--secondary-gold)' }} />
                  <span style={{ color: '#f3f4f6', fontWeight: 600 }}>{item.releaseDate}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />{item.releaseTime}
                </span>
              </div>

              {/* Team */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>🎨 <strong style={{ color: '#f3f4f6' }}>{item.assignedPVDesigner || '—'}</strong></span>
                <span>✍️ <strong style={{ color: '#f3f4f6' }}>{item.assignedWriter || '—'}</strong></span>
              </div>

              {/* Platforms */}
              {item.targetPlatforms.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {item.targetPlatforms.map(p => (
                    <span key={p} style={{ fontSize: '0.68rem', background: 'rgba(0,102,153,0.3)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>{p}</span>
                  ))}
                </div>
              )}

              {/* Actions row */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '2px' }}>
                {item.driveLink && (
                  <a href={item.driveLink} target="_blank" rel="noreferrer"
                    className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}>
                    <ExternalLink size={12} /> Drive
                  </a>
                )}
                {(canEdit || canUpdateStatusOnly) && (
                  <button className="btn btn-outline" style={{ padding: '7px 14px', flex: 1, justifyContent: 'center' }} onClick={() => onEditItem(item)}>
                    <Edit3 size={14} /> Edit
                  </button>
                )}
                {canEdit && (
                  <button className="btn btn-outline" style={{ padding: '7px', color: '#f87171' }} onClick={() => onDeleteItem(item.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
