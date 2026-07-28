import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminPage } from './pages/AdminPage';
import { PublicViewPage } from './pages/PublicViewPage';
import {
  subscribeUserProjects,
  subscribeProjectAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  logoutUser,
} from './services/firebaseService';
import type { ProjectWorkspace, AssetPlanItem } from './types';
import { SummaryCards } from './components/SummaryCards';
import { FlyerTable } from './components/FlyerTable';
import { FlyerFormModal } from './components/FlyerFormModal';
import { SummaryModal } from './components/SummaryModal';
import { ProjectSelector } from './components/ProjectSelector';
import { LogOut, Shield, User as UserIcon } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main Dashboard View
const Dashboard: React.FC = () => {
  const { appUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [assetItems, setAssetItems] = useState<AssetPlanItem[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetPlanItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Subscribe to Projects where user has access
  useEffect(() => {
    if (!appUser) return;
    const unsub = subscribeUserProjects(appUser.uid, isAdmin, (projs) => {
      setProjects(projs);
      if (projs.length > 0 && !currentProjectId) {
        setCurrentProjectId(projs[0].id);
      }
    });
    return () => unsub();
  }, [appUser, isAdmin]);

  // Subscribe to Assets for active project
  useEffect(() => {
    if (!currentProjectId) {
      setAssetItems([]);
      return;
    }
    const unsub = subscribeProjectAssets(currentProjectId, setAssetItems);
    return () => unsub();
  }, [currentProjectId]);

  const activeProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // RBAC Permission checks for active project
  const isChairOrCoChair = activeProject && (
    activeProject.chairpersonUid === appUser?.uid ||
    activeProject.coChairUids.includes(appUser?.uid || '')
  );
  const canEditProject = isAdmin || isChairOrCoChair;
  const canUpdateStatusOnly = !canEditProject && activeProject?.pvLeadUid === appUser?.uid;

  const handleSaveAsset = async (item: AssetPlanItem) => {
    if (editingItem) {
      await updateAsset(item.id, item);
    } else {
      await createAsset(item);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Are you sure you want to delete this planned asset?')) {
      await deleteAsset(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssetPlanItem['status']) => {
    await updateAsset(id, { status: newStatus });
  };

  const handleExportCSV = () => {
    if (!activeProject) return;
    const headers = ['ID', 'Asset Category', 'Title', 'Type', 'Release Date', 'Release Time', 'Status', 'PV Designer', 'Writer', 'Platforms', 'Drive Link'];
    const rows = assetItems.map(i => [
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
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/cs-logo-full.png"
            alt="IEEE Computer Society - SLTC"
            style={{ height: '48px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <button className="btn btn-gold" onClick={() => navigate('/admin')} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              <Shield size={16} /> Admin Panel
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <UserIcon size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{appUser?.name}</span>
            <span className="badge badge-published" style={{ fontSize: '0.7rem' }}>{appUser?.position}</span>
          </div>

          <button className="btn btn-outline" onClick={logoutUser} style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#f87171' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Projects Dropdown & Access Control */}
      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', margin: '40px 0' }}>
          <img src="/cs-icon.png" alt="IEEE CS" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Assigned Projects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
            You have not been assigned to any project workspace yet. Ask an IEEE CS Main Committee Admin or Project Chairperson to assign you.
          </p>
        </div>
      ) : (
        <>
          <ProjectSelector
            projects={projects}
            currentProjectId={currentProjectId}
            onSelectProject={id => setCurrentProjectId(id)}
            onCreateProject={() => {}}
            canEdit={canEditProject}
          />

          <SummaryCards
            items={assetItems}
            projectName={activeProject?.name || ''}
            canEdit={canEditProject}
            onOpenSummaryModal={() => setIsSummaryOpen(true)}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            onExportCSV={handleExportCSV}
          />

          <FlyerTable
            items={assetItems}
            projectName={activeProject?.name || ''}
            canEdit={canEditProject}
            canUpdateStatusOnly={canUpdateStatusOnly}
            onEditItem={item => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onDeleteItem={handleDeleteAsset}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

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

      {isSummaryOpen && activeProject && (
        <SummaryModal
          items={assetItems}
          project={activeProject}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/view/:shareCode" element={<PublicViewPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
