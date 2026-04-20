import { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { Folder, Github, Home, Settings, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export default function Layout() {
  const { projectId } = useParams();
  const location = useLocation();
  const [gitConfig, setGitConfig] = useState({ commitMessage: 'Update blog data' });
  const [genStatus, setGenStatus] = useState('idle'); // idle | loading | done | error
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    // Load git config from project config
    api.projects.getConfig(projectId).then(res => {
      if (res.success && res.data.git) {
        setGitConfig(cfg => ({ ...cfg, ...res.data.git }));
      }
    });
  }, [projectId]);

  const handleGenerate = async () => {
    setGenStatus('loading');
    try {
      const res = await api.actions.generate(projectId);
      setGenStatus(res.success ? 'done' : 'error');
    } catch {
      setGenStatus('error');
    }
    setTimeout(() => setGenStatus('idle'), 3000);
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    try {
      const res = await api.actions.sync(projectId, gitConfig.commitMessage || 'Update blog data');
      setSyncStatus(res.success ? 'done' : 'error');
    } catch {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const isSettings = location.pathname.endsWith('/settings');

  const statusLabel = (status, idleLabel) => {
    if (status === 'loading') return 'Working...';
    if (status === 'done') return 'Done ✓';
    if (status === 'error') return 'Failed ✗';
    return idleLabel;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <Home className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border"></div>
          <Link to={`/project/${projectId}`} className={cn("font-semibold text-lg flex items-center gap-2", isSettings && "text-muted-foreground")}>
            <Folder className="w-5 h-5" />
            {projectId}
          </Link>
          {isSettings && <span className="text-muted-foreground">/ Settings</span>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/project/${projectId}/settings`}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              isSettings ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
            title="Project Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            onClick={handleGenerate}
            disabled={genStatus === 'loading'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              genStatus === 'done' ? "bg-green-100 text-green-700" :
              genStatus === 'error' ? "bg-red-100 text-red-700" :
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Zap className="w-4 h-4" />
            {statusLabel(genStatus, 'Generate JSON')}
          </button>

          <button
            onClick={handleSync}
            disabled={syncStatus === 'loading'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              syncStatus === 'done' ? "bg-green-600 text-white" :
              syncStatus === 'error' ? "bg-red-600 text-white" :
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Github className="w-4 h-4" />
            {statusLabel(syncStatus, 'Sync Git')}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
