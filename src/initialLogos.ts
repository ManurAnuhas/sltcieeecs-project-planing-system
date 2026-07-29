import type { LogoItem } from './types';

export const INITIAL_CAMPUS_LOGOS: Omit<LogoItem, 'id'>[] = [
  {
    title: '1PHI Official Logo (Orange Circle)',
    category: 'SLTC Campus',
    url: '/cs-logo-full.png',
    format: 'PNG',
    uploadedBy: 'System Admin',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'SLTC Research University Logo',
    category: 'SLTC Campus',
    url: '/cs-logo-sidebar.png',
    format: 'PNG',
    uploadedBy: 'System Admin',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'IEEE Computer Society Emblem',
    category: 'IEEE CS',
    url: '/cs-icon.png',
    format: 'PNG',
    uploadedBy: 'System Admin',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'IEEE Student Branch SLTC Logo',
    category: 'IEEE Branch',
    url: '/cs-logo-white.png',
    format: 'PNG',
    uploadedBy: 'System Admin',
    createdAt: new Date().toISOString(),
  },
];
