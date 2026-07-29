import React, { useState } from 'react';
import type { AppUser } from '../types';
import { updateUserProfile } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, X, Upload } from 'lucide-react';

interface ProfileModalProps {
  user: AppUser;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSuccess }) => {
  const { updateAppUserLocal } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPhotoURL(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display Name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updates: Partial<AppUser> = {
        name: name.trim(),
        photoURL: photoURL.trim(),
      };

      await updateUserProfile(user.uid, updates);
      updateAppUserLocal(updates);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const userInitials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(247,148,29,0.3), rgba(247,148,29,0.1))',
                border: '1px solid rgba(247,148,29,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F7941D',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f3f4f6' }}>Edit Profile</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Update your personal details & avatar
              </p>
            </div>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px 12px', minWidth: 'auto' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Avatar Preview & Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div style={{ position: 'relative' }}>
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={name}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--accent-cyan)',
                    boxShadow: '0 4px 12px rgba(0,210,255,0.2)',
                  }}
                  onError={(e) => {
                    // Fallback on broken image link
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #006699, #00d2ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,102,153,0.3)',
                  }}
                >
                  {userInitials}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                PROFILE PICTURE
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <label className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '6px 12px', cursor: 'pointer', gap: '6px', margin: 0 }}>
                  <Upload size={14} /> Upload Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                {photoURL && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setPhotoURL('')}
                    style={{ fontSize: '0.78rem', padding: '6px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Photo URL input fallback */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              OR IMAGE URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Display Name */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              DISPLAY NAME <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', fontSize: '0.88rem' }}
            />
          </div>

          {/* Read-Only Email */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                EMAIL ADDRESS
              </label>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} /> Read-only
              </span>
            </div>
            <input
              type="email"
              value={user.email}
              disabled
              readOnly
              style={{
                width: '100%',
                fontSize: '0.88rem',
                opacity: 0.6,
                cursor: 'not-allowed',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Read-Only Position */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                COMMITTEE POSITION
              </label>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} /> Read-only
              </span>
            </div>
            <input
              type="text"
              value={user.position}
              disabled
              readOnly
              style={{
                width: '100%',
                fontSize: '0.88rem',
                opacity: 0.6,
                cursor: 'not-allowed',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold" disabled={saving} style={{ gap: '6px' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
