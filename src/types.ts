export type UserRole = 'Chairperson' | 'Co-Chairperson' | 'PV-Team' | 'Member-Viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  releaseDate: string; // YYYY-MM-DD
  releaseTime: string; // HH:mm
  targetPlatforms: ('Facebook' | 'Instagram' | 'LinkedIn' | 'WhatsApp Group' | 'WhatsApp Status')[];
  assignedPVDesigner: string;
  assignedWriter: string;
  captionStatus: 'Pending' | 'In Progress' | 'Completed' | 'Approved';
  captionText: string;
  driveLink: string;
  status: 'Draft' | 'In Design' | 'Under Review' | 'Scheduled' | 'Published' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes?: string;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  description: string;
  chairperson: string;
  coChairpersons: string[]; // Up to 4 names/emails
  createdDate: string;
  shareCode: string;
}

export type FilterStatus = 'All' | 'Draft' | 'In Design' | 'Under Review' | 'Scheduled' | 'Published' | 'Delayed';
