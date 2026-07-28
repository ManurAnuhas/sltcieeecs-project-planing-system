import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProjectAssets } from '../services/firebaseService';
import type { ProjectWorkspace, AssetPlanItem } from '../types';
import { ExternalLink, Calendar, Clock, Film, FileText, Award, Image as ImageIcon } from 'lucide-react';

export const PublicViewPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [project, setProject] = useState<ProjectWorkspace | null>(null);
  const [assets, setAssets] = useState<AssetPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareCode) return;
    (async () => {
      try {
        const result = await getPublicProjectAssets(shareCode);
        if (!result.project) {
          setError('Project not found. Please check your link.');
        } else {
          setProject(result.project);
          setAssets(result.assets);
        }
      } catch (e) {
        setError('Failed to load project. Please try again.');
      }
      setLoading(false);
    })();
  }, [shareCode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' };
      case 'Scheduled': return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' };
      case 'Delayed': return { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' };
      case 'In Design': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
      default: return { bg: 'rgba(156,163,175,0.15)', color: '#d1d5db', border: 'rgba(156,163,175,0.3)' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Flyer': return <ImageIcon size={16} style={{ color: '#00d2ff' }} />;
      case 'Video': return <Film size={16} style={{ color: '#c084fc' }} />;
      case 'Certificate': return <Award size={16} style={{ color: '#fbbf24' }} />;
      default: return <FileText size={16} style={{ color: '#9ca3af' }} />;
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto', display: 'block', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading project view...</p>
      </div>
    </div>
  );

  if (error || !project) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
      <div>
        <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px' }} />
        <h2 style={{ color: '#f87171', marginBottom: '8px' }}>Project Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    </div>
  );

  const stats = {
    total: assets.length,
    published: assets.filter(a => a.status === 'Published').length,
    scheduled: assets.filter(a => a.status === 'Scheduled').length,
    inProgress: assets.filter(a => ['In Design', 'Under Review'].includes(a.status)).length,
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/cs-logo-full.png" alt="IEEE CS SLTC" style={{ height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <span className="badge badge-draft" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          👁️ Member View — Read Only
        </span>
      </div>

      {/* Project Info */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>{project.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{project.description}</p>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Chairperson:</span> <strong>{project.chairpersonName}</strong></span>
          <span><span style={{ color: 'var(--text-muted)' }}>Created:</span> <strong>{project.createdAt.split('T')[0]}</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Assets', value: stats.total, color: '#00d2ff' },
          { label: 'Published', value: stats.published, color: '#34d399' },
          { label: 'Scheduled', value: stats.scheduled, color: '#fbbf24' },
          { label: 'In Progress', value: stats.inProgress, color: '#60a5fa' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Asset List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>
          Asset & Flyer Release Schedule
        </h2>

        {assets.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No assets have been planned for this project yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assets
              .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
              .map(asset => {
                const sc = getStatusColor(asset.status);
                return (
                  <div
                    key={asset.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {getCategoryIcon(asset.category)}
                        <span>{asset.category} — {asset.assetType}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{asset.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        🎨 {asset.assignedPVDesigner} &nbsp;|&nbsp; ✍️ {asset.assignedWriter}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '90px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#fbbf24' }}>
                        <Calendar size={13} /> {asset.releaseDate}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <Clock size={12} /> {asset.releaseTime}
                      </div>
                    </div>

                    <span className="badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {asset.status}
                    </span>

                    {asset.driveLink ? (
                      <a href={asset.driveLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                        <ExternalLink size={12} /> Drive
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '60px' }}>No link</span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)' }}>
        SLTC IEEE CS — Asset Release Planner &nbsp;|&nbsp; View-Only Access
      </p>
    </div>
  );
};
