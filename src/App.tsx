import { useState, useEffect } from 'react';
import { INITIAL_PROJECTS, INITIAL_ASSET_ITEMS } from './initialData';
import type { ProjectWorkspace, AssetPlanItem, UserProfile } from './types';
import { SummaryCards } from './components/SummaryCards';
import { FlyerTable } from './components/FlyerTable';
import { FlyerFormModal } from './components/FlyerFormModal';
import { SummaryModal } from './components/SummaryModal';
import { ProjectSelector } from './components/ProjectSelector';
import { AuthModal } from './components/AuthModal';
import { User } from 'lucide-react';

export function App() {
  // Current Logged In User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('sltc_ieee_cs_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) {}
    }
    return {
      id: 'u-1',
      name: 'Kasun Perera',
      email: 'kasun.chair@sltc.lk',
      role: 'Chairperson'
    };
  });

  // Projects State
  const [projects, setProjects] = useState<ProjectWorkspace[]>(() => {
    const savedProjects = localStorage.getItem('sltc_ieee_cs_projects');
    if (savedProjects) {
      try { return JSON.parse(savedProjects); } catch (e) {}
    }
    return INITIAL_PROJECTS;
  });

  // Active Project Selection
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('project');
    if (codeParam) {
      const match = INITIAL_PROJECTS.find(p => p.shareCode === codeParam);
      if (match) return match.id;
    }
    return projects[0]?.id || 'proj-1';
  });

  // Assets State
  const [assetItems, setAssetItems] = useState<AssetPlanItem[]>(() => {
    const savedAssets = localStorage.getItem('sltc_ieee_cs_assets');
    if (savedAssets) {
      try { return JSON.parse(savedAssets); } catch (e) {}
    }
    return INITIAL_ASSET_ITEMS;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetPlanItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('sltc_ieee_cs_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sltc_ieee_cs_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('sltc_ieee_cs_assets', JSON.stringify(assetItems));
  }, [assetItems]);

  const activeProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // RBAC Permission checks
  const canEditProject = currentUser.role === 'Chairperson' || currentUser.role === 'Co-Chairperson';
  const canUpdateStatusOnly = currentUser.role === 'PV-Team';

  // Filter items for current active project workspace
  const currentProjectAssets = assetItems.filter(item => item.projectId === currentProjectId);

  const handleCreateProject = (newProj: ProjectWorkspace) => {
    setProjects([newProj, ...projects]);
    setCurrentProjectId(newProj.id);
  };

  const handleSaveAsset = (item: AssetPlanItem) => {
    if (editingItem) {
      setAssetItems(assetItems.map(i => (i.id === item.id ? item : i)));
    } else {
      setAssetItems([item, ...assetItems]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Are you sure you want to delete this planned asset?')) {
      setAssetItems(assetItems.filter(i => i.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: AssetPlanItem['status']) => {
    setAssetItems(assetItems.map(i => (i.id === id ? { ...i, status: newStatus } : i)));
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Asset Category', 'Title', 'Type', 'Release Date', 'Release Time', 'Status', 'PV Designer', 'Writer', 'Platforms', 'Drive Link'];
    const rows = currentProjectAssets.map(i => [
      i.id,
      `"${i.category}"`,
      `"${i.title}"`,
      `"${i.assetType}"`,
      i.releaseDate,
      i.releaseTime,
      i.status,
      `"${i.assignedPVDesigner}"`,
      `"${i.assignedWriter}"`,
      `"${i.targetPlatforms.join(';')}"`,
      `"${i.driveLink}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_')}_asset_plan.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header Bar with IEEE CS Logo & Profile Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
          {/* IEEE CS Student Branch Logo */}
          <img
            src="/cs-logo-full.png"
            alt="IEEE Computer Society - Student Branch Chapter of SLTC"
            style={{ height: '52px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Current Active Account Profile Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setIsAuthOpen(true)}
          >
            <User size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>{currentUser.name}</span>
            <span className={`badge ${currentUser.role === 'Chairperson' ? 'badge-published' : currentUser.role === 'Co-Chairperson' ? 'badge-scheduled' : currentUser.role === 'PV-Team' ? 'badge-in-design' : 'badge-draft'}`}>
              {currentUser.role}
            </span>
          </button>
        </div>
      </div>

      {/* Workspace Switcher & Clean Project Creator */}
      <ProjectSelector
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={id => setCurrentProjectId(id)}
        onCreateProject={handleCreateProject}
        canEdit={canEditProject}
      />

      {/* KPI Cards & Main Actions */}
      <SummaryCards
        items={currentProjectAssets}
        projectName={activeProject.name}
        canEdit={canEditProject}
        onOpenSummaryModal={() => setIsSummaryOpen(true)}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onExportCSV={handleExportCSV}
        onImportCSV={() => {}}
      />

      {/* Main Asset Table */}
      <FlyerTable
        items={currentProjectAssets}
        projectName={activeProject.name}
        canEdit={canEditProject}
        canUpdateStatusOnly={canUpdateStatusOnly}
        onEditItem={item => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onDeleteItem={handleDeleteAsset}
        onStatusChange={handleStatusChange}
      />

      {/* Modals */}
      {isFormOpen && (
        <FlyerFormModal
          item={editingItem}
          projectId={currentProjectId}
          onSave={handleSaveAsset}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {isSummaryOpen && (
        <SummaryModal
          items={currentProjectAssets}
          project={activeProject}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          currentUser={currentUser}
          onSwitchUser={user => {
            setCurrentUser(user);
            setIsAuthOpen(false);
          }}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
