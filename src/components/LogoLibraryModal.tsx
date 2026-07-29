import React, { useState, useEffect, useMemo } from 'react';
import type { LogoItem, LogoCategory, AppUser } from '../types';
import { INITIAL_CAMPUS_LOGOS } from '../initialLogos';
import { subscribeGlobalLogos, addLogoItem, deleteLogoItem } from '../services/firebaseService';
import { Download, Plus, Search, Trash2, X, Image as ImageIcon, Copy, Check, Upload, Tag } from 'lucide-react';
import { useToast, useConfirm } from './DialogComponents';

const PRESET_CATEGORIES: LogoCategory[] = ['SLTC Campus', 'IEEE Branch', 'IEEE CS', 'Sponsor', 'Other'];

interface LogoLibraryModalProps {
  currentUser: AppUser | null;
  isAdmin?: boolean;
  onClose: () => void;
}

export const LogoLibraryModal: React.FC<LogoLibraryModalProps> = ({ currentUser, isAdmin = false, onClose }) => {
  const { toast, ToastNode } = useToast();
  const { confirm, ConfirmDialogNode } = useConfirm();
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategorySelect, setNewCategorySelect] = useState<string>('SLTC Campus');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // When 'Other' is selected and user typed a custom name, use it; otherwise fall back to selected
  const effectiveNewCategory = (newCategorySelect === 'Other' && customCategoryText.trim())
    ? customCategoryText.trim()
    : newCategorySelect;

  useEffect(() => {
    const unsub = subscribeGlobalLogos(firestoreLogos => {
      // Merge initial preset logos with firestore logos so default logos are always visible
      const presetLogos: LogoItem[] = INITIAL_CAMPUS_LOGOS.map((item, index) => ({
        id: `preset-${index}`,
        ...item,
      }));

      // Combine preset logos with user-uploaded logos, removing duplicates by title
      const combined = [...presetLogos];
      firestoreLogos.forEach(fl => {
        if (!combined.some(c => c.title === fl.title)) {
          combined.push(fl);
        }
      });
      setLogos(combined);
    });
    return () => unsub();
  }, []);

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
        setNewUrl(reader.result);
        if (!newTitle) {
          setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      toast('Please provide a title and logo image', 'warning');
      return;
    }
    setSaving(true);
    try {
      await addLogoItem({
        title: newTitle.trim(),
        category: effectiveNewCategory as LogoCategory,
        url: newUrl.trim(),
        format: newUrl.startsWith('data:image/svg') ? 'SVG' : 'PNG',
        uploadedBy: currentUser?.name || 'Committee Member',
        createdAt: new Date().toISOString(),
      });
      toast('New logo added to Common Hub!', 'success');
      setNewTitle('');
      setNewUrl('');
      setNewCategorySelect('SLTC Campus');
      setCustomCategoryText('');
      setIsUploading(false);
    } catch (err: any) {
      toast('Failed to add logo: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logo: LogoItem) => {
    const ok = await confirm({
      title: 'Delete Logo',
      message: `Delete logo "${logo.title}" from Common Hub? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    if (logo.id.startsWith('preset-')) {
      // Preset logos are not in Firestore — just hide them locally by
      // adding a "hidden preset" marker in Firestore
      await addLogoItem({
        title: `__hidden__${logo.title}`,
        category: logo.category,
        url: '',
        uploadedBy: currentUser?.name || 'Admin',
        createdAt: new Date().toISOString(),
      });
      toast('Preset logo hidden from hub.', 'info');
    } else {
      await deleteLogoItem(logo.id);
      toast('Logo removed.', 'info');
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg')
      ? filename
      : `${filename.replace(/\s+/g, '_')}_logo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Downloading ${filename}...`, 'info');
  };

  const handleCopyLink = (logo: LogoItem) => {
    navigator.clipboard.writeText(window.location.origin + logo.url);
    setCopiedId(logo.id);
    toast('Logo link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Collect all distinct categories in use (presets + custom) for the filter chips
  const allCategoriesInUse = useMemo(() => {
    const cats = new Set<string>(PRESET_CATEGORIES);
    logos.forEach(l => { if (l.category) cats.add(l.category); });
    return Array.from(cats);
  }, [logos]);

  // Filter out hidden-preset markers and filter by search/category
  const filteredLogos = logos.filter(l => {
    if (l.title.startsWith('__hidden__') || l.url === '') return false;
    const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(247,148,29,0.3), rgba(247,148,29,0.1))',
                border: '1px solid rgba(247,148,29,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F7941D',
              }}
            >
              <ImageIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f3f4f6' }}>
                Campus Brand & Logo Hub
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Official SLTC, IEEE & Society Logos — Free to view & 1-click download
              </p>
            </div>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px 12px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: Search & Category Filter */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            background: 'rgba(0,0,0,0.2)',
            padding: '12px 16px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search logos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', width: '100%', fontSize: '0.85rem', height: '38px' }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
            {['All', ...allCategoriesInUse].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="btn"
                style={{
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  height: '32px',
                  borderRadius: '20px',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  background:
                    selectedCategory === cat
                      ? 'linear-gradient(135deg, rgba(247,148,29,0.5), rgba(247,148,29,0.2))'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedCategory === cat ? '#F7941D' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add New Logo — Admin only */}
          {isAdmin && (
            <button
              className="btn btn-gold"
              onClick={() => setIsUploading(p => !p)}
              style={{ fontSize: '0.82rem', height: '38px', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Plus size={16} /> Add Common Logo
            </button>
          )}
        </div>

        {/* Upload Form Modal Accordion */}
        {isUploading && (
          <form
            onSubmit={handleAddLogo}
            className="glass-panel"
            style={{
              padding: '18px',
              marginBottom: '20px',
              border: '1px solid rgba(247,148,29,0.4)',
              background: 'rgba(247,148,29,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F7941D' }}>
              Upload New Common Logo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  LOGO TITLE *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLTC Official Crest (PNG)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  CATEGORY
                </label>
                <select
                  value={newCategorySelect}
                  onChange={e => { setNewCategorySelect(e.target.value); setCustomCategoryText(''); }}
                >
                  {PRESET_CATEGORIES.filter(c => c !== 'Other').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {/* Custom categories already in use */}
                  {allCategoriesInUse
                    .filter(c => !PRESET_CATEGORIES.includes(c as LogoCategory))
                    .map(c => <option key={c} value={c}>{c}</option>)
                  }
                  <option value="Other">Other / New Category...</option>
                </select>
                {newCategorySelect === 'Other' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 10px', background: 'rgba(247,148,29,0.05)', border: '1px solid rgba(247,148,29,0.2)', borderRadius: '8px' }}>
                    <Tag size={14} style={{ color: '#F7941D', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Type a new custom category name (or leave blank for 'Other')"
                      value={customCategoryText}
                      onChange={e => setCustomCategoryText(e.target.value)}
                      autoFocus
                      style={{ flex: 1, fontSize: '0.82rem', background: 'transparent', border: 'none', outline: 'none', color: '#f3f4f6' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                UPLOAD IMAGE FILE OR PASTE IMAGE URL
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <label className="btn btn-outline" style={{ fontSize: '0.8rem', cursor: 'pointer', gap: '6px' }}>
                  <Upload size={14} /> Browse...
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {newUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <img src={newUrl} alt="Preview" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain' }} />
                <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Preview ready!</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsUploading(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Saving...' : 'Save Logo'}
              </button>
            </div>
          </form>
        )}

        {/* Logo Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
            paddingRight: '4px',
          }}
        >
          {filteredLogos.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <ImageIcon size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>No logos found matching your criteria.</p>
            </div>
          ) : (
            filteredLogos.map(logo => (
              <div
                key={logo.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Logo Image Box */}
                <div
                  style={{
                    height: '110px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    position: 'relative',
                  }}
                >
                  <img
                    src={logo.url}
                    alt={logo.title}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      border: '1px solid rgba(0,210,255,0.3)',
                    }}
                  >
                    {logo.category}
                  </span>
                </div>

                {/* Details & Actions */}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {logo.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>By {logo.uploadedBy || 'Admin'}</span>
                    <span>{logo.format || 'PNG'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => handleDownload(logo.url, logo.title)}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', gap: '6px' }}
                    title="Download logo file"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleCopyLink(logo)}
                    style={{ padding: '6px 10px', color: copiedId === logo.id ? '#10b981' : 'var(--text-muted)' }}
                    title="Copy Link"
                  >
                    {copiedId === logo.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleDelete(logo)}
                      style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                      title="Delete logo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {ConfirmDialogNode}
      {ToastNode}
    </div>
  );
};
