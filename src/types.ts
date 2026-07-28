export type UserRole =
  | 'Chairman'
  | 'Vice-Chairman'
  | 'Secretary'
  | 'Assistant Secretary'
  | 'Treasurer'
  | 'Assistant Treasurer'
  | 'Webmaster'
  | 'Assistant Webmaster'
  | 'Project-Chairperson'    // Needs admin approval
  | 'Project-Co-Chairperson' // Needs admin approval
  | 'Other';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export const MAIN_CS_POSITIONS: UserRole[] = [
  'Chairman',
  'Vice-Chairman',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Webmaster',
  'Assistant Webmaster',
];

// All 8 main positions can access Admin Panel
export const IS_ADMIN_ROLE = (role: UserRole): boolean =>
  MAIN_CS_POSITIONS.includes(role);

// These roles require Admin approval after signup
export const NEEDS_APPROVAL = (role: UserRole): boolean =>
  role === 'Project-Chairperson' || role === 'Project-Co-Chairperson';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  position: UserRole;
  status: UserStatus; // 'approved' for main 8, 'pending' for project roles
  requestedProjectName?: string;
  photoURL?: string;
  createdAt: string;
}

export type NotificationType = 'project_created' | 'user_approved' | 'user_rejected' | 'asset_updated' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  readBy: string[];      // uids who marked it read
  projectId?: string;
  actorName?: string;
}

export type ProjectRole = 'project-chair' | 'co-chair' | 'pv-lead' | 'viewer';

export interface ProjectMember {
  uid: string;
  name: string;
  email: string;
  projectRole: ProjectRole;
}

export type AssetCategory = 'Flyer' | 'Video' | 'Certificate' | 'Banner/Poster' | 'Custom Asset';

export type AssetType =
  | 'Save The Date'
  | 'Speaker Reveal'
  | 'Main Event Promo'
  | 'Countdown Teaser'
  | 'Teaser Video'
  | 'Event Highlights Video'
  | 'Participant Certificate'
  | 'Winner Certificate'
  | 'Thank You Poster'
  | 'Custom';

export interface AssetPlanItem {
  id: string;
  projectId: string;
  title: string;
  category: AssetCategory;
  assetType: AssetType;
  releaseDate: string;
  releaseTime: string;
  targetPlatforms: ('Facebook' | 'Instagram' | 'LinkedIn' | 'WhatsApp Group' | 'WhatsApp Status')[];
  assignedPVDesigner: string;
  assignedWriter: string;
  captionStatus: 'Pending' | 'In Progress' | 'Completed' | 'Approved';
  captionText: string;
  driveLink: string;
  status: 'Draft' | 'In Design' | 'Under Review' | 'Scheduled' | 'Published' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  description: string;
  createdBy: string; // uid
  chairpersonUid: string;
  chairpersonName: string;
  coChairUids: string[];
  pvLeadUid: string;
  memberUids: string[]; // all who can see (chair + co-chairs + pv)
  shareCode: string;
  createdAt: string;
}

export type FilterStatus = 'All' | 'Draft' | 'In Design' | 'Under Review' | 'Scheduled' | 'Published' | 'Delayed';
