import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signInWithGoogle, createGoogleUserProfile, logoutUser, subscribeTakenMainPositions } from '../services/firebaseService';
import { MAIN_CS_POSITIONS } from '../types';
import type { UserRole } from '../types';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenPositions, setTakenPositions] = useState<string[]>([]);
  
  // Google sign up profile completion dialog
  const [googleUser, setGoogleUser] = useState<{ uid: string; email: string; name: string } | null>(null);
  const [googleRole, setGoogleRole] = useState<UserRole>('Chairman');
  
  const navigate = useNavigate();

  // Subscribe to taken positions
  React.useEffect(() => {
    const unsubscribe = subscribeTakenMainPositions(setTakenPositions);
    return () => unsubscribe();
  }, []);

  const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const availableMain = MAIN_CS_POSITIONS.filter(
    pos => !takenPositions.some(taken => norm(taken) === norm(pos))
  );
  const GOOGLE_POSITIONS: UserRole[] = [
    ...availableMain,
    'Project-Chairperson',
    'Project-Co-Chairperson',
    'Other',
    'Member',
  ];

  // Update selected googleRole if taken
  React.useEffect(() => {
    if (GOOGLE_POSITIONS.length > 0 && !GOOGLE_POSITIONS.includes(googleRole)) {
      setGoogleRole(GOOGLE_POSITIONS[0]);
    }
  }, [takenPositions, googleUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.isNew) {
        // Show role selection modal
        setGoogleUser({
          uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || 'Google User',
        });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      if (err.message === 'access-denied-domain') {
        setError('Access denied. Only SLTC email addresses are allowed (@sltc.ac.lk or @sltc.edu.lk).');
      } else {
        setError('Google authentication failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    setLoading(true);
    try {
      await createGoogleUserProfile(googleUser.uid, googleUser.email, googleUser.name, googleRole);
      setGoogleUser(null);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* IEEE CS Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img
            src="/cs-logo-full.png"
            alt="1PHI SLTC"
            style={{ height: '64px', objectFit: 'contain', margin: '0 auto' }}
          />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Asset & Flyer Release Planning System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>Sign In</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Use your SLTC email address (@sltc.ac.lk or @sltc.edu.lk)
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#f87171',
              fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                SLTC EMAIL ADDRESS
              </label>
              <input
                type="email"
                placeholder="yourname@sltc.ac.lk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ padding: '0 10px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
              Create Account
            </a>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
          SLTC IEEE Computer Society Student Branch Chapter
        </p>
      </div>

      {/* Google Setup Role Modal */}
      {googleUser && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Complete Your Profile</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Welcome, <strong>{googleUser.name}</strong>! Select your committee position to request access.
            </p>

            <form onSubmit={handleCompleteGoogleProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>COMMITTEE POSITION</label>
                <select
                  value={googleRole}
                  onChange={e => setGoogleRole(e.target.value as UserRole)}
                  required
                  style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                >
                  {GOOGLE_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                {MAIN_CS_POSITIONS.includes(googleRole) && (
                  <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '6px' }}>
                    ✓ Main committee position — you will have Admin Panel access
                  </p>
                )}
                {(googleRole === 'Project-Chairperson' || googleRole === 'Project-Co-Chairperson') && (
                  <p style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '6px' }}>
                    ⏳ Requires approval from a main committee member before you can access.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setGoogleUser(null);
                    logoutUser();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold" disabled={loading}>
                  {loading ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
