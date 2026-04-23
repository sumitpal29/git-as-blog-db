import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FolderPlus, Folder, Trash2, Pencil, Check, X } from 'lucide-react';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [renamingProject, setRenamingProject] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.projects.list();
      if (res.success) setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, projectName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;
    try {
      const res = await api.projects.delete(projectName);
      if (res.success) {
        setProjects(projects.filter(p => p !== projectName));
      } else {
        alert(res.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    }
  };

  const startRename = (e, projectName) => {
    e.stopPropagation();
    setRenamingProject(projectName);
    setRenameValue(projectName);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setRenamingProject(null);
    setRenameValue('');
  };

  const confirmRename = async (e, oldName) => {
    e.stopPropagation();
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) { cancelRename(); return; }
    try {
      const res = await api.projects.rename(oldName, trimmed);
      if (res.success) {
        setProjects(projects.map(p => (p === oldName ? trimmed : p)));
        setRenamingProject(null);
      } else {
        alert(res.error || 'Failed to rename');
      }
    } catch (err) {
      alert('Failed to rename project');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const res = await api.projects.create(newProjectName);
      if (res.success) {
        navigate(`/project/${res.data.name}`);
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert('Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-20 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Blog CMS</h1>
          <p className="text-muted-foreground mt-2">Select or create a project to get started</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="New project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              maxLength={60}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 hover:bg-primary/90"
            >
              <FolderPlus className="w-4 h-4" />
              Create
            </button>
          </form>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Existing Projects</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects found.</p>
            ) : (
              <ul className="space-y-2">
                {projects.map(project => (
                  <li key={project} className="flex gap-2 items-center">
                    {renamingProject === project ? (
                      <div className="flex-1 flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                        <Folder className="w-5 h-5 text-muted-foreground shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmRename(e, project); if (e.key === 'Escape') cancelRename(); }}
                          maxLength={60}
                          className="flex-1 bg-transparent outline-none text-sm font-medium"
                          onClick={e => e.stopPropagation()}
                        />
                        <button onClick={e => confirmRename(e, project)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelRename} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/project/${project}`)}
                        className="flex-1 flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted transition-colors text-left"
                      >
                        <Folder className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{project}</span>
                      </button>
                    )}

                    {renamingProject !== project && (
                      <>
                        <button
                          onClick={(e) => startRename(e, project)}
                          className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md border bg-card transition-colors"
                          title="Rename Project"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, project)}
                          className="p-3 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md border bg-card transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
