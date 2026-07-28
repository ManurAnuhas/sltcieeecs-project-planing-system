import React, { useState } from 'react';
import { Copy, Check, Sparkles, X, MessageSquare, FileText } from 'lucide-react';
import type { AssetPlanItem, ProjectWorkspace } from '../types';
import confetti from 'canvas-confetti';

interface SummaryModalProps {
  items: AssetPlanItem[];
  project: ProjectWorkspace;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ items, project, onClose }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Generate WhatsApp Committee Update Text
  const generateWhatsAppSummary = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let text = `📌 *SLTC IEEE CS RELEASE SCHEDULE UPDATE*\n`;
    text += `🔷 *Project: ${project.name}*\n`;
    text += `👤 Chairperson: ${project.chairpersonName}\n`;
    text += `🗓️ Date: ${today}\n\n`;

    if (items.length === 0) {
      text += `No assets scheduled yet for this project.\n`;
    } else {
      items.forEach(item => {
        const icon = item.status === 'Published' ? '✅' : item.status === 'Scheduled' ? '📅' : item.status === 'Delayed' ? '⚠️' : '🎨';
        text += `${icon} *${item.title}* [${item.category} - ${item.assetType}]\n`;
        text += `   • Status: *${item.status}*\n`;
        text += `   • Release: ${item.releaseDate} @ ${item.releaseTime}\n`;
        text += `   • PV Designer: ${item.assignedPVDesigner} | Writer: ${item.assignedWriter}\n`;
        text += `   • Platforms: ${item.targetPlatforms.join(', ')}\n`;
        if (item.driveLink) {
          text += `   • Drive Link: ${item.driveLink}\n`;
        }
        text += `\n`;
      });
    }

    text += `─────────────\nGenerated via SLTC IEEE CS Asset Release System 🚀`;
    return text;
  };

  // Generate Formal Meeting Report Text
  const generateFormalReport = () => {
    const published = items.filter(i => i.status === 'Published');
    const pending = items.filter(i => i.status !== 'Published');

    let text = `========================================================\n`;
    text += `SLTC IEEE COMPUTER SOCIETY - ASSET & MEDIA REPORT\n`;
    text += `Project: ${project.name}\n`;
    text += `Chairperson: ${project.chairpersonName}\n`;
    text += `Date: ${new Date().toISOString().split('T')[0]}\n`;
    text += `========================================================\n\n`;

    text += `SUMMARY METRICS:\n`;
    text += `- Total Planned Assets (Flyers, Videos, Certs): ${items.length}\n`;
    text += `- Released / Published: ${published.length}\n`;
    text += `- Pending Release / In Pipeline: ${pending.length}\n\n`;

    text += `1. PUBLISHED ASSETS:\n`;
    if (published.length === 0) text += `   (None yet)\n`;
    published.forEach((p, idx) => {
      text += `   ${idx + 1}. [${p.category}] ${p.title} - Released on ${p.releaseDate}\n`;
    });

    text += `\n2. UPCOMING RELEASE PIPELINE:\n`;
    pending.forEach((p, idx) => {
      text += `   ${idx + 1}. [${p.category}] ${p.title} (${p.assetType})\n`;
      text += `      Release Date: ${p.releaseDate} ${p.releaseTime} | Status: ${p.status}\n`;
      text += `      PV Designer: ${p.assignedPVDesigner} | Writer: ${p.assignedWriter}\n`;
    });

    return text;
  };

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel" style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ color: 'var(--secondary-gold)' }} size={24} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Auto-Generated Flyer Plan Summary</h2>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px 12px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Copy pre-formatted release summaries directly for WhatsApp committee groups or formal IEEE ExCo reports.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* WhatsApp Format */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#25D366' }}>
                <MessageSquare size={16} /> WhatsApp Format
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#25D366' }}
                onClick={() => handleCopy(generateWhatsAppSummary(), 'whatsapp')}
              >
                {copiedFormat === 'whatsapp' ? <Check size={14} /> : <Copy size={14} />}
                {copiedFormat === 'whatsapp' ? 'Copied!' : 'Copy WhatsApp Text'}
              </button>
            </div>
            <textarea
              readOnly
              value={generateWhatsAppSummary()}
              style={{ height: '320px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>

          {/* Formal Meeting Report Format */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#00d2ff' }}>
                <FileText size={16} /> Formal ExCo Report
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => handleCopy(generateFormalReport(), 'formal')}
              >
                {copiedFormat === 'formal' ? <Check size={14} /> : <Copy size={14} />}
                {copiedFormat === 'formal' ? 'Copied!' : 'Copy Report Text'}
              </button>
            </div>
            <textarea
              readOnly
              value={generateFormalReport()}
              style={{ height: '320px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
