import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, FileText, Folder, Plus, Trash2, Edit,
  BookOpen, Loader2, X, AlertTriangle, FolderPlus, FilePlus,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Modals ────────────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <h3 className="font-semibold">Are you sure?</h3>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Delete</button>
        </div>
      </div>
    </div>
  );
}

function NewItemModal({ title, placeholder, onConfirm, onCancel, hint }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) { setError('Name is required'); return; }
    if (!/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(v)) {
      setError('Lowercase letters, numbers, hyphens, underscores only — no spaces');
      return;
    }
    onConfirm(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <input
              autoFocus
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError(''); }}
              placeholder={placeholder}
              maxLength={60}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tree node ─────────────────────────────────────────────────────────────────

function TreeNode({ item, depth, activePath, onSelectFile, onDeleteFile, onDeleteFolder, onNewFile, onNewFolder }) {
  const [open, setOpen] = useState(depth === 0);

  if (item.type === 'file') {
    const isActive = activePath === item.path;
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-1 px-2 py-1.5 rounded-md cursor-pointer group text-sm',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
        )}
        style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        onClick={() => onSelectFile(item.path)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          <span className="truncate">{item.name}.md</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDeleteFile(item); }}
          className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // folder
  return (
    <div>
      <div
        className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-md cursor-pointer group hover:bg-muted/50 text-sm"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} />
          <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
          <span className="font-medium truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onNewFile(item.path); }}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
            title="New file here"
          >
            <FilePlus className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNewFolder(item.path); }}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
            title="New folder here"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDeleteFolder(item); }}
            className="p-1 rounded text-muted-foreground hover:text-destructive"
            title="Delete folder"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {open && (
        <div>
          {(item.items || []).map(child => (
            <TreeNode
              key={child.path}
              item={child}
              depth={depth + 1}
              activePath={activePath}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
            />
          ))}
          {(item.items || []).length === 0 && (
            <p className="text-xs text-muted-foreground italic px-3 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
              Empty folder
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BookViewer() {
  const { projectId, bookSlug } = useParams();
  const navigate = useNavigate();

  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Modal state
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'file'|'folder', item }
  const [newFileIn, setNewFileIn] = useState(null);    // folder path or '' for root
  const [newFolderIn, setNewFolderIn] = useState(null); // folder path or '' for root

  const loadMap = useCallback(async () => {
    setLoading(true);
    const res = await api.books.getMap(projectId, bookSlug);
    if (res.success) setMap(res.data);
    setLoading(false);
  }, [projectId, bookSlug]);

  useEffect(() => { loadMap(); }, [loadMap]);

  const handleSelectFile = async (filePath) => {
    setActivePath(filePath);
    setFileContent(null);
    setFileLoading(true);
    const res = await api.books.getFile(projectId, bookSlug, filePath);
    if (res.success) setFileContent(res.data.content);
    setFileLoading(false);
  };

  const handleDeleteConfirm = async () => {
    const { type, item } = confirmDelete;
    setConfirmDelete(null);
    if (type === 'file') {
      await api.books.deleteFile(projectId, bookSlug, item.path);
      if (activePath === item.path) { setActivePath(null); setFileContent(null); }
    } else {
      await api.books.deleteFolder(projectId, bookSlug, item.path);
    }
    await loadMap();
  };

  const handleCreateFile = async (name) => {
    const folderPrefix = newFileIn ? `${newFileIn}/` : '';
    const filePath = `${folderPrefix}${name}`;
    setNewFileIn(null);
    const res = await api.books.saveFile(projectId, bookSlug, filePath, '');
    if (res.success) {
      await loadMap();
      navigate(`/project/${projectId}/book/${bookSlug}/edit?path=${encodeURIComponent(res.data.path)}`);
    }
  };

  const handleCreateFolder = async (name) => {
    const folderPrefix = newFolderIn ? `${newFolderIn}/` : '';
    const folderPath = `${folderPrefix}${name}`;
    setNewFolderIn(null);
    await api.books.createFolder(projectId, bookSlug, folderPath);
    await loadMap();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
    </div>
  );

  if (!map) return (
    <div className="text-center text-muted-foreground py-20">Book not found.</div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{map.name}</h1>
            {map.description && <p className="text-sm text-muted-foreground">{map.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewFileIn('')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            <FilePlus className="w-4 h-4" /> New File
          </button>
          <button
            onClick={() => setNewFolderIn('')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex gap-4 border rounded-lg overflow-hidden bg-card min-h-[520px]">
        {/* Sidebar tree */}
        <div className="w-60 border-r flex-shrink-0 overflow-y-auto p-2">
          {(map.tree?.items || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-2">No files yet. Create one above.</p>
          ) : (
            (map.tree.items || []).map(item => (
              <TreeNode
                key={item.path}
                item={item}
                depth={0}
                activePath={activePath}
                onSelectFile={handleSelectFile}
                onDeleteFile={(item) => setConfirmDelete({ type: 'file', item })}
                onDeleteFolder={(item) => setConfirmDelete({ type: 'folder', item })}
                onNewFile={(parentPath) => setNewFileIn(parentPath)}
                onNewFolder={(parentPath) => setNewFolderIn(parentPath)}
              />
            ))
          )}
        </div>

        {/* Content panel */}
        <div className="flex-1 overflow-y-auto">
          {fileLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-muted-foreground w-5 h-5" />
            </div>
          ) : fileContent !== null ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{activePath}</code>
                <Link
                  to={`/project/${projectId}/book/${bookSlug}/edit?path=${encodeURIComponent(activePath)}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              {fileContent.trim() ? (
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">This file is empty. Click Edit to add content.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a file from the tree to preview it here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.item.name}"${confirmDelete.type === 'folder' ? ' and all its contents' : ''}? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {newFileIn !== null && (
        <NewItemModal
          title={`New File${newFileIn ? ` in ${newFileIn}` : ' at root'}`}
          placeholder="file-name"
          hint="Lowercase, hyphens, underscores only. .md is auto-appended."
          onConfirm={handleCreateFile}
          onCancel={() => setNewFileIn(null)}
        />
      )}
      {newFolderIn !== null && (
        <NewItemModal
          title={`New Folder${newFolderIn ? ` in ${newFolderIn}` : ' at root'}`}
          placeholder="folder-name"
          hint="Lowercase, hyphens, underscores only."
          onConfirm={handleCreateFolder}
          onCancel={() => setNewFolderIn(null)}
        />
      )}
    </div>
  );
}
