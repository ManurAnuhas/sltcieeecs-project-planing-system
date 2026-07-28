import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import type { AppUser, ProjectWorkspace, AssetPlanItem, UserRole } from '../types';
import { NEEDS_APPROVAL } from '../types';

// ────────────────────────────────────────────
// AUTH SERVICES
// ────────────────────────────────────────────

const ALLOWED_DOMAINS = ['sltc.ac.lk', 'sltc.edu.lk'];

export const isAllowedEmail = (email: string): boolean => {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  position: UserRole
): Promise<AppUser> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Main 8 committee positions are auto-approved; project roles need admin approval
  const status = NEEDS_APPROVAL(position) ? 'pending' : 'approved';

  const userData: Omit<AppUser, 'uid'> = {
    name,
    email,
    position,
    status,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), userData);
  return { uid: cred.user.uid, ...userData };
};

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

// ────────────────────────────────────────────
// USER SERVICES
// ────────────────────────────────────────────

export const getUser = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? ({ uid, ...snap.data() } as AppUser) : null;
};

export const getAllUsers = async (): Promise<AppUser[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
};

export const getPendingUsers = async (): Promise<AppUser[]> => {
  const q = query(collection(db, 'users'), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
};

export const approveUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { status: 'approved' });
};

export const rejectUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
};

// ────────────────────────────────────────────
// PROJECT SERVICES
// ────────────────────────────────────────────

export const createProject = async (
  data: Omit<ProjectWorkspace, 'id' | 'createdAt' | 'shareCode'>
): Promise<string> => {
  const shareCode =
    data.name.replace(/\s+/g, '').substring(0, 4).toUpperCase() +
    Math.floor(1000 + Math.random() * 9000);

  const docRef = await addDoc(collection(db, 'projects'), {
    ...data,
    shareCode,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateProject = (id: string, data: Partial<ProjectWorkspace>) =>
  updateDoc(doc(db, 'projects', id), data);

export const deleteProject = (id: string) => deleteDoc(doc(db, 'projects', id));

export const getProjectByShareCode = async (shareCode: string): Promise<ProjectWorkspace | null> => {
  const q = query(collection(db, 'projects'), where('shareCode', '==', shareCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ProjectWorkspace;
};

/** Returns only projects where the current user is in memberUids */
export const subscribeUserProjects = (
  uid: string,
  isAdmin: boolean,
  callback: (projects: ProjectWorkspace[]) => void
): Unsubscribe => {
  if (isAdmin) {
    // Admin can see ALL projects
    return onSnapshot(collection(db, 'projects'), snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectWorkspace)));
    });
  }
  // Regular user: only projects in memberUids
  const q = query(collection(db, 'projects'), where('memberUids', 'array-contains', uid));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectWorkspace)));
  });
};

// ────────────────────────────────────────────
// ASSET SERVICES
// ────────────────────────────────────────────

export const subscribeProjectAssets = (
  projectId: string,
  callback: (assets: AssetPlanItem[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'assets'), where('projectId', '==', projectId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetPlanItem)));
  });
};

export const createAsset = async (data: Omit<AssetPlanItem, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'assets'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateAsset = (id: string, data: Partial<AssetPlanItem>) =>
  updateDoc(doc(db, 'assets', id), { ...data, updatedAt: new Date().toISOString() });

export const deleteAsset = (id: string) => deleteDoc(doc(db, 'assets', id));

export const getPublicProjectAssets = async (shareCode: string) => {
  const project = await getProjectByShareCode(shareCode);
  if (!project) return { project: null, assets: [] };
  const q = query(collection(db, 'assets'), where('projectId', '==', project.id));
  const snap = await getDocs(q);
  const assets = snap.docs.map(d => ({ id: d.id, ...d.data() } as AssetPlanItem));
  return { project, assets };
};
