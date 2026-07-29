import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, isAllowedEmail, getTakenMainPositions, subscribeTakenMainPositions } from '../services/firebaseService';
import { MAIN_CS_POSITIONS } from '../types';
import type { UserRole } from '../types';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [position, setPosition] = useState<UserRole>('Chairman');
  const [takenPositions, setTakenPositions] = useState<string[]>([]);

  // Real‑time subscription for taken main‑committee positions
  useEffect(() => {
    const unsubscribe = subscribeTakenMainPositions(setTakenPositions);
    return () => unsubscribe();
  }, []);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isProjectRole = position === 'Project-Chairperson' || position === 'Project-Co-Chairperson';

  const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Build the dropdown list – filter out any main‑committee role that is already taken
  const availableMain = MAIN_CS_POSITIONS.filter(
    pos => !takenPositions.some(taken => norm(taken) === norm(pos))
  );
  const ALL_POSITIONS: UserRole[] = [
    ...availableMain,
    'Project-Chairperson',
    'Project-Co-Chairperson',
    'Other',
    'Member',
  ];

  // Keep selected position valid when taken positions update
  useEffect(() => {
    if (ALL_POSITIONS.length > 0 && !ALL_POSITIONS.includes(position)) {
      setPosition(ALL_POSITIONS[0]);
    }
  }, [takenPositions]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAllowedEmail(email)) {
      setError('Only SLTC email addresses are allowed (@sltc.ac.lk or @sltc.edu.lk)');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }
    if (isProjectRole && !requestedProjectName.trim()) {
      setError('Please specify the project name you are registering for.');
      return;
    }

    setLoading(true);
    try {
      await signUpUser(email, password, name, position, isProjectRole ? requestedProjectName.trim() : undefined);
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 8 characters.');
      } else {
        setError('Account creation failed. Please try again.');
      }
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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* IEEE CS Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/cs-logo-full.png"
            alt="1PHI SLTC"
            style={{ height: '56px', objectFit: 'contain', margin: '0 auto' }}
          />
          <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Create your committee account
          </p>
        </div>

        {/* Signup Card */}
        <div className="glass-panel" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '4px' }}>Create Account</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '22px' }}>
            SLTC IEEE CS committee members only. Select your committee position.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '18px',
              color: '#f87171',
              fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                FULL NAME
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                COMMITTEE POSITION
              </label>
              <select
                value={position}
                onChange={e => setPosition(e.target.value as UserRole)}
                style={{ width: '100%' }}
              >
                {ALL_POSITIONS.map(pos => (
                  <option key={pos} value={pos} style={{ background: '#111827', color: '#fff' }}>
                    {pos}
                  </option>
                ))}
              </select>
              {MAIN_CS_POSITIONS.includes(position) && (
                <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>
                  ✓ Main committee position — you will have Admin Panel access
                </p>
              )}
              {isProjectRole && (
                <p style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px' }}>
                  ⏳ This role requires approval from a main committee member before you can access the workspace.
                </p>
              )}
            </div>

            {isProjectRole && (
              <div>
                <label style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  REGISTERING PROJECT NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. IEEE CS Tech Talk 2026 / Hackathon"
                  value={requestedProjectName}
                  onChange={e => setRequestedProjectName(e.target.value)}
                  required
                  style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.05)' }}
                />
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Enter the exact name of the project you are chairing/co-chairing.
                </p>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                PASSWORD (min. 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
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

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating Account...' : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
          SLTC IEEE Computer Society Student Branch Chapter
        </p>
      </div>
    </div>
  );
};
