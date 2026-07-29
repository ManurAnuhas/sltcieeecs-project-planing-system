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
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import type { AppUser, AppNotification, ProjectWorkspace, AssetPlanItem, UserRole, LogoItem } from '../types';
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
  position: UserRole,
  requestedProjectName?: string
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
    ...(requestedProjectName ? { requestedProjectName } : {}),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), userData);
  return { uid: cred.user.uid, ...userData };
};

/** Returns an array of main-committee positions already taken (registered in Firestore) */
export const getTakenMainPositions = async (): Promise<string[]> => {
  const snap = await getDocs(collection(db, 'users'));
  const taken: string[] = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.position) taken.push(data.position as string);
  });
  return taken;
};

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = async (): Promise<{ user: any; isNew: boolean; existingProfile?: AppUser }> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const email = result.user.email || '';

  if (!isAllowedEmail(email)) {
    await signOut(auth);
    throw new Error('access-denied-domain');
  }

  // Check if profile document already exists in Firestore
  const snap = await getDoc(doc(db, 'users', result.user.uid));
  if (snap.exists()) {
    return { user: result.user, isNew: false, existingProfile: { uid: result.user.uid, ...snap.data() } as AppUser };
  }

  return { user: result.user, isNew: true };
};

export const createGoogleUserProfile = async (
  uid: string,
  email: string,
  name: string,
  position: UserRole,
  requestedProjectName?: string
): Promise<AppUser> => {
  const status = NEEDS_APPROVAL(position) ? 'pending' : 'approved';
  const userData: Omit<AppUser, 'uid'> = {
    name,
    email,
    position,
    status,
    ...(requestedProjectName ? { requestedProjectName } : {}),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), userData);
  return { uid, ...userData };
};

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

export const approveUser = async (uid: string, actorName: string, userName: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { status: 'approved' });
  await createNotification({
    title: '✅ User Approved',
    message: `${userName} has been approved by ${actorName} and can now access the system.`,
    type: 'user_approved',
    actorName,
  });
};

export const rejectUser = async (uid: string, actorName: string, userName: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
  await createNotification({
    title: '❌ User Rejected',
    message: `${userName}'s access request was rejected by ${actorName}.`,
    type: 'user_rejected',
    actorName,
  });
};

export const updateUserProfile = async (uid: string, updates: Partial<AppUser>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), updates);
  if (auth.currentUser && auth.currentUser.uid === uid) {
    const profileUpdates: { displayName?: string; photoURL?: string } = {};
    if (updates.name) profileUpdates.displayName = updates.name;
    // Firebase Auth photoURL has a max length — skip base64 data URLs (they are too long)
    if (updates.photoURL !== undefined && !updates.photoURL.startsWith('data:')) {
      profileUpdates.photoURL = updates.photoURL;
    }
    if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(auth.currentUser, profileUpdates);
    }
  }
};

export const deleteUserAccount = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
};

export const sendAdminPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// ────────────────────────────────────────────
// NOTIFICATION SERVICES
// ────────────────────────────────────────────

export const createNotification = async (
  data: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>
): Promise<void> => {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
};

export const subscribeNotifications = (
  callback: (notifications: AppNotification[]) => void
): Unsubscribe => {
  return onSnapshot(
    query(collection(db, 'notifications'), orderBy('createdAt', 'desc')),
    snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    }
  );
};

export const markNotificationRead = (notificationId: string, uid: string) =>
  updateDoc(doc(db, 'notifications', notificationId), { readBy: arrayUnion(uid) });

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
  // Fire notification for all committee members
  await createNotification({
    title: '📁 New Project Created',
    message: `"${data.name}" has been created by ${data.chairpersonName || 'Admin'}.`,
    type: 'project_created',
    projectId: docRef.id,
    actorName: data.chairpersonName,
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

// ────────────────────────────────────────────
// LOGO / BRAND ASSET SERVICES
// ────────────────────────────────────────────

export const subscribeGlobalLogos = (callback: (logos: LogoItem[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, 'logos'), snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LogoItem));
    callback(items.filter(i => !i.projectId));
  });
};

export const subscribeProjectLogos = (projectId: string, callback: (logos: LogoItem[]) => void): Unsubscribe => {
  const q = query(collection(db, 'logos'), where('projectId', '==', projectId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogoItem)));
  });
};

export const addLogoItem = async (data: Omit<LogoItem, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'logos'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const deleteLogoItem = (id: string) => deleteDoc(doc(db, 'logos', id));
