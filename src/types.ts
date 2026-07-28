export type UserRole =
  | 'Chairman'
  | 'Vice-Chairman'
  | 'Secretary'
  | 'Assistant Secretary'
  | 'Treasurer'
  | 'Assistant Treasurer'
  | 'Webmaster'
  | 'Assistant Webmaster'
  | 'Other'; // For additional invited members

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

export const IS_ADMIN_ROLE = (role: UserRole): boolean =>
  role === 'Webmaster' || role === 'Assistant Webmaster';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  position: UserRole;
  photoURL?: string;
  createdAt: string;
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
