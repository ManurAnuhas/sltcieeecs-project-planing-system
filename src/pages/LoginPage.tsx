import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/firebaseService';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
            alt="IEEE Computer Society - SLTC"
            style={{ height: '64px', objectFit: 'contain', filter: 'brightness(0) invert(1)', margin: '0 auto' }}
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
    </div>
  );
};
