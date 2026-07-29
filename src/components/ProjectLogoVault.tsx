import React, { useState, useEffect } from 'react';
import type { LogoItem, LogoCategory, AppUser, ProjectWorkspace } from '../types';
import { subscribeProjectLogos, addLogoItem, deleteLogoItem } from '../services/firebaseService';
import { Download, Plus, Trash2, Image as ImageIcon, Upload, Check, Copy } from 'lucide-react';
import { useToast, useConfirm } from './DialogComponents';

interface ProjectLogoVaultProps {
  project: ProjectWorkspace;
  currentUser: AppUser | null;
  canManage: boolean;
}

const CATEGORIES: LogoCategory[] = ['Sponsor', 'Project Asset', 'SLTC Campus', 'IEEE Branch', 'IEEE CS', 'Other'];

export const ProjectLogoVault: React.FC<ProjectLogoVaultProps> = ({ project, currentUser, canManage }) => {
  const { toast, ToastNode } = useToast();
  const { confirm, ConfirmDialogNode } = useConfirm();
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LogoCategory>('Project Asset');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project?.id) return;
    const unsub = subscribeProjectLogos(project.id, setLogos);
    return () => unsub();
  }, [project?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast('File size must be under 3MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setUrl(reader.result);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast('Please enter title and select an image', 'warning');
      return;
    }
    setSaving(true);
    try {
      await addLogoItem({
        title: title.trim(),
        category,
        url: url.trim(),
        projectId: project.id,
        uploadedBy: currentUser?.name || 'Project Member',
        createdAt: new Date().toISOString(),
      });
      toast(`Added logo to "${project.name}" vault!`, 'success');
      setTitle('');
      setUrl('');
      setIsUploading(false);
    } catch (err: any) {
      toast('Failed to upload logo: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logo: LogoItem) => {
    const ok = await confirm({
      title: 'Delete Asset',
      message: `Remove "${logo.title}" from project assets?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (ok) {
      await deleteLogoItem(logo.id);
      toast('Asset deleted.', 'info');
    }
  };

  const handleDownload = (logoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg')
      ? filename
      : `${filename.replace(/\s+/g, '_')}_asset.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Downloading ${filename}...`, 'info');
  };

  const handleCopyLink = (logo: LogoItem) => {
    navigator.clipboard.writeText(logo.url);
    setCopiedId(logo.id);
    toast('Asset link copied!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginTop: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={20} style={{ color: '#F7941D' }} /> Project Logos & Design Vault
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Sponsor logos, branding badges, and assets for <strong>{project.name}</strong>
          </p>
        </div>

        <button
          className="btn btn-gold"
          onClick={() => setIsUploading(p => !p)}
          style={{ fontSize: '0.82rem', gap: '6px' }}
        >
          <Plus size={16} /> Add Project Asset
        </button>
      </div>

      {/* Upload Accordion Form */}
      {isUploading && (
        <form
          onSubmit={handleAddLogo}
          style={{
            padding: '18px',
            marginBottom: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(247,148,29,0.4)',
            background: 'rgba(247,148,29,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F7941D' }}>
            Upload Asset for {project.name}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                ASSET / LOGO TITLE *
              </label>
              <input
                type="text"
                placeholder="e.g. Main Sponsor Crest Logo"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                CATEGORY
              </label>
              <select value={category} onChange={e => setCategory(e.target.value as LogoCategory)}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              CHOOSE IMAGE FILE OR PASTE IMAGE URL
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <label className="btn btn-outline" style={{ fontSize: '0.8rem', cursor: 'pointer', gap: '6px' }}>
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <img src={url} alt="Preview" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain' }} />
              <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Preview ready!</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsUploading(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              {saving ? 'Saving...' : 'Add to Vault'}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Logos */}
      {logos.length === 0 ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)',
            color: 'var(--text-muted)',
          }}
        >
          <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '0.88rem' }}>No project logos uploaded yet.</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', opacity: 0.7 }}>
            Upload sponsor logos, event badges, and graphics for project members to use in designs.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {logos.map(logo => (
            <div
              key={logo.id}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div
                style={{
                  height: '90px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                <img src={logo.url} alt={logo.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {logo.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  {logo.category}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => handleDownload(logo.url, logo.title)}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '5px 8px', gap: '4px' }}
                  title="Download asset"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleCopyLink(logo)}
                  style={{ padding: '5px 8px', color: copiedId === logo.id ? '#10b981' : 'var(--text-muted)' }}
                  title="Copy link"
                >
                  {copiedId === logo.id ? <Check size={13} /> : <Copy size={13} />}
                </button>
                {(canManage || logo.uploadedBy === currentUser?.name) && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleDelete(logo)}
                    style={{ padding: '5px 8px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                    title="Delete asset"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {ConfirmDialogNode}
      {ToastNode}
    </div>
  );
};
