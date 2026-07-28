import type { ProjectWorkspace, AssetPlanItem } from './types';

export const INITIAL_PROJECTS: ProjectWorkspace[] = [
  {
    id: 'proj-1',
    name: 'IEEE CS Tech Talk 2026',
    description: 'Annual flagship technical talk series on AI & Software Engineering',
    chairperson: 'Kasun Perera (Chairperson)',
    coChairpersons: [
      'Nimali Silva (Co-Chair 1)',
      'Sahan Wickramasinghe (Co-Chair 2)',
      'Dilini Bandara (Co-Chair 3)',
      'Kavindu Jayasooriya (Co-Chair 4)'
    ],
    createdDate: '2026-07-01',
    shareCode: 'TECTALK2026'
  },
  {
    id: 'proj-2',
    name: 'CodeSprint 5.0 Hackathon',
    description: 'Inter-university 24-hour coding challenge',
    chairperson: 'Kamal Jayawardena (Chairperson)',
    coChairpersons: [
      'Ruwan Fernando (Co-Chair 1)',
      'Anuki Perera (Co-Chair 2)'
    ],
    createdDate: '2026-07-15',
    shareCode: 'CODESPRINT5'
  }
];

export const INITIAL_ASSET_ITEMS: AssetPlanItem[] = [
  {
    id: 'asset-101',
    projectId: 'proj-1',
    title: 'Save The Date - AI & Machine Learning Session',
    category: 'Flyer',
    assetType: 'Save The Date',
    releaseDate: '2026-08-01',
    releaseTime: '18:00',
    targetPlatforms: ['Facebook', 'Instagram', 'WhatsApp Group', 'WhatsApp Status'],
    assignedPVDesigner: 'Kasun Perera',
    assignedWriter: 'Nimali Silva',
    captionStatus: 'Approved',
    captionText: '🚀 Mark your calendars! SLTC IEEE CS brings you an exclusive session on AI & ML Trends. Stay tuned! #SLTC #IEEECS #TechTalk',
    driveLink: 'https://drive.google.com/drive/folders/sample1',
    status: 'Scheduled',
    priority: 'High',
    notes: 'Approved by Project Chairperson'
  },
  {
    id: 'asset-102',
    projectId: 'proj-1',
    title: 'Teaser Promo Video 30s',
    category: 'Video',
    assetType: 'Teaser Video',
    releaseDate: '2026-08-02',
    releaseTime: '19:00',
    targetPlatforms: ['Facebook', 'Instagram', 'LinkedIn'],
    assignedPVDesigner: 'Sahan Wickramasinghe',
    assignedWriter: 'Nimali Silva',
    captionStatus: 'In Progress',
    captionText: 'Get ready for the biggest AI webinar of the term! Check out the teaser 🎥',
    driveLink: 'https://drive.google.com/drive/folders/sample_video',
    status: 'In Design',
    priority: 'Urgent',
    notes: 'Video rendering in 4K'
  },
  {
    id: 'asset-103',
    projectId: 'proj-1',
    title: 'Participant Certificate Design',
    category: 'Certificate',
    assetType: 'Participant Certificate',
    releaseDate: '2026-08-15',
    releaseTime: '12:00',
    targetPlatforms: ['WhatsApp Group'],
    assignedPVDesigner: 'Dilini Bandara',
    assignedWriter: 'Kavindu Jayasooriya',
    captionStatus: 'Pending',
    captionText: 'Official certificates for Tech Talk 2026 participants.',
    driveLink: '',
    status: 'Draft',
    priority: 'Medium',
    notes: 'Awaiting signature vectors'
  },
  {
    id: 'asset-201',
    projectId: 'proj-2',
    title: 'CodeSprint 5.0 Registration Open Poster',
    category: 'Flyer',
    assetType: 'Main Event Promo',
    releaseDate: '2026-08-10',
    releaseTime: '10:00',
    targetPlatforms: ['Facebook', 'Instagram', 'LinkedIn', 'WhatsApp Group'],
    assignedPVDesigner: 'Ruwan Fernando',
    assignedWriter: 'Anuki Perera',
    captionStatus: 'Approved',
    captionText: 'CodeSprint 5.0 Registrations are officially OPEN! Register now.',
    driveLink: 'https://drive.google.com/drive/folders/sample_codesprint',
    status: 'Scheduled',
    priority: 'Urgent',
    notes: 'Form link in bio'
  }
];
