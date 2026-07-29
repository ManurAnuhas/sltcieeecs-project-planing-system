import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Layers, Share2, Plus, Download } from 'lucide-react';
import type { AssetPlanItem } from '../types';

interface SummaryCardsProps {
  items: AssetPlanItem[];
  projectName: string;
  canEdit: boolean;
  onOpenSummaryModal: () => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onImportCSV?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  items,
  projectName,
  canEdit,
  onOpenSummaryModal,
  onOpenAddModal,
  onExportCSV,
}) => {
  const totalCount = items.length;
  const publishedCount = items.filter(i => i.status === 'Published').length;
  const scheduledCount = items.filter(i => i.status === 'Scheduled').length;
  const inDesignCount = items.filter(i => i.status === 'In Design' || i.status === 'Under Review').length;
  const delayedCount = items.filter(i => i.status === 'Delayed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      {/* Top Banner Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(1.1rem, 4vw, 1.7rem)',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #ffffff, #93c5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
          }}>
            SLTC IEEE CS Asset &amp; Flyer Release System
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Active Workspace: <strong style={{ color: 'var(--accent-cyan)' }}>{projectName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <button className="btn btn-gold" onClick={onOpenSummaryModal} style={{ padding: '9px 14px' }}>
            <Share2 size={16} />
            <span className="desktop-only" style={{ display: 'inline' }}>Auto </span>Summary
          </button>
          
          {canEdit && (
            <button className="btn btn-primary" onClick={onOpenAddModal} style={{ padding: '9px 14px' }}>
              <Plus size={16} />
              <span className="desktop-only" style={{ display: 'inline' }}>Add New Asset</span>
              <span className="mobile-only" style={{ display: 'none' }}>Add</span>
            </button>
          )}

          <button className="btn btn-outline" onClick={onExportCSV} title="Export to CSV / Sheet" style={{ padding: '9px 14px' }}>
            <Download size={16} />
            <span className="desktop-only" style={{ display: 'inline' }}>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0, 102, 153, 0.2)', color: '#00d2ff', flexShrink: 0 }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUBLISHED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{publishedCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', flexShrink: 0 }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{scheduledCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN DESIGN</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{inDesignCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', flexShrink: 0 }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DELAYED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>{delayedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

