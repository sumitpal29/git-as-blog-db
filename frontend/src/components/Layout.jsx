import { useState } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { Folder, Home, Settings, Zap, Palette } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useTheme, THEMES } from '../lib/theme.jsx';

export default function Layout() {
  const { projectId } = useParams();
  const location = useLocation();
  const [genStatus, setGenStatus] = useState('idle'); // idle | loading | done | error
  const [themeOpen, setThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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

  const isSettings = location.pathname.endsWith('/settings');

  const statusLabel = (status, idleLabel) => {
    if (status === 'loading') return 'Working...';
    if (status === 'done') return 'Done ✓';
    if (status === 'error') return 'Failed ✗';
    return idleLabel;
  };

  const themeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);

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
          {/* Theme switcher */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen(o => !o)}
              className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              title="Switch theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg py-1 z-20 min-w-[130px]">
                {THEMES.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setThemeOpen(false); }}
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                      theme === t ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {theme === t ? '✓ ' : '  '}{themeLabel(t)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isSettings && (
            <>
              <Link
                to={`/project/${projectId}/settings`}
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
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
            </>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
