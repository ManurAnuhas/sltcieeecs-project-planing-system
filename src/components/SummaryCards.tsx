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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SLTC IEEE CS Asset & Flyer Release System
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Active Workspace: <strong style={{ color: 'var(--accent-cyan)' }}>{projectName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" onClick={onOpenSummaryModal}>
            <Share2 size={18} />
            Auto Summary Generator
          </button>
          
          {canEdit && (
            <button className="btn btn-primary" onClick={onOpenAddModal}>
              <Plus size={18} />
              Add New Asset Plan
            </button>
          )}

          <button className="btn btn-outline" onClick={onExportCSV} title="Export to CSV / Sheet">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 102, 153, 0.2)', color: '#00d2ff' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL FLYERS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUBLISHED</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{publishedCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{scheduledCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN DESIGN / REVIEW</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>{inDesignCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DELAYED / ACTION</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }}>{delayedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
