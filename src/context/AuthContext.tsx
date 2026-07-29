import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AppUser } from '../types';
import { IS_ADMIN_ROLE, IS_MEMBER_ROLE } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isPending: boolean;
  refreshProfile: () => Promise<void>;
  updateAppUserLocal: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  isAdmin: false,
  isMember: false,
  isPending: false,
  refreshProfile: async () => {},
  updateAppUserLocal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setAppUser({ uid, ...snap.data() } as AppUser);
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  };

  const updateAppUserLocal = (updates: Partial<AppUser>) => {
    setAppUser(prev => prev ? { ...prev, ...updates } : null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser.uid);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = appUser ? IS_ADMIN_ROLE(appUser.position) : false;
  const isMember = appUser ? IS_MEMBER_ROLE(appUser.position) : false;
  const isPending = appUser ? appUser.status === 'pending' : false;

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, isAdmin, isMember, isPending, refreshProfile, updateAppUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
