import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, FileText, Folder, Plus, Trash2, Edit,
  BookOpen, Loader2, X, AlertTriangle, FolderPlus, FilePlus,
  ArrowLeft, Pencil, BookMarked, Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSlug(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 60) || '';
}

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

// Modal for creating a new page — free display name with auto-generated slug
function NewPageModal({ title, parentPath, onConfirm, onCancel }) {
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val) => {
    setDisplayName(val);
    setError('');
    if (!slugManual) setSlug(generateSlug(val));
  };

  const handleSlugChange = (val) => {
    setSlug(val);
    setSlugManual(true);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Page name is required'); return; }
    const s = slug.trim();
    if (!s) { setError('URL slug is required'); return; }
    if (!/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(s)) {
      setError('URL slug: lowercase letters, numbers, hyphens, underscores only');
      return;
    }
    onConfirm({ displayName: displayName.trim(), slug: s });
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
            <label className="text-xs font-medium text-muted-foreground">Page Name</label>
            <input
              autoFocus
              type="text"
              value={displayName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Introduction to Chapter 1"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">URL Slug <span className="text-muted-foreground/60">(auto-generated)</span></label>
            <input
              type="text"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="introduction-to-chapter-1"
              maxLength={60}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card font-mono"
            />
            {parentPath && <p className="text-xs text-muted-foreground">in: {parentPath}/</p>}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for creating a new folder
function NewFolderModal({ title, parentPath, onConfirm, onCancel }) {
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const s = slug.trim();
    if (!s) { setError('Folder name is required'); return; }
    if (!/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(s)) {
      setError('Lowercase letters, numbers, hyphens, underscores only — no spaces');
      return;
    }
    onConfirm(s);
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
            <label className="text-xs font-medium text-muted-foreground">Folder Name</label>
            <input
              autoFocus
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setError(''); }}
              placeholder="chapter-1"
              maxLength={60}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card font-mono"
            />
            <p className="text-xs text-muted-foreground">Lowercase, hyphens, underscores only.{parentPath ? ` in: ${parentPath}/` : ''}</p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline folder rename widget
function FolderRenameInput({ currentName, onConfirm, onCancel }) {
  const [val, setVal] = useState(currentName);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const v = val.trim();
    if (!v || v === currentName) { onCancel(); return; }
    if (!/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(v)) {
      setError('Lowercase, hyphens, underscores only');
      return;
    }
    onConfirm(v);
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <div className="flex-1 space-y-0.5">
        <input
          autoFocus
          type="text"
          value={val}
          maxLength={60}
          onChange={e => { setVal(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onCancel(); }}
          className="w-full bg-transparent border-b border-primary outline-none text-sm font-medium px-1 font-mono"
        />
        {error && <p className="text-xs text-destructive px-1">{error}</p>}
      </div>
      <button onClick={handleSubmit} className="p-1 text-green-600 hover:bg-green-50 rounded shrink-0"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="p-1 text-muted-foreground hover:bg-muted rounded shrink-0"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ── Tree node ─────────────────────────────────────────────────────────────────

function TreeNode({ item, depth, activePath, onSelectFile, onDeleteFile, onDeleteFolder, onNewPage, onNewFolder, onRenameFolder }) {
  const [open, setOpen] = useState(depth === 0);
  const [renaming, setRenaming] = useState(false);

  const displayLabel = item.displayName || item.name;

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
          <span className="truncate">{displayLabel}</span>
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
        onClick={() => !renaming && setOpen(v => !v)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} />
          <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
          {renaming ? (
            <FolderRenameInput
              currentName={item.name}
              onConfirm={(newName) => { setRenaming(false); onRenameFolder(item, newName); }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <span className="font-medium truncate">{displayLabel}</span>
          )}
        </div>
        {!renaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onNewPage(item.path); }}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
              title="New page here"
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
              onClick={e => { e.stopPropagation(); setRenaming(true); }}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
              title="Rename folder"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeleteFolder(item); }}
              className="p-1 rounded text-muted-foreground hover:text-destructive"
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
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
              onNewPage={onNewPage}
              onNewFolder={onNewFolder}
              onRenameFolder={onRenameFolder}
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

// ── Edit Book Modal ────────────────────────────────────────────────────────────

function EditBookModal({ book, onSave, onCancel }) {
  const [name, setName] = useState(book.name || '');
  const [description, setDescription] = useState(book.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit Book Info</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Book Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
          </div>
        </form>
      </div>
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
  const [newPageIn, setNewPageIn] = useState(null);      // folder path or '' for root
  const [newFolderIn, setNewFolderIn] = useState(null);  // folder path or '' for root
  const [editingBook, setEditingBook] = useState(false);

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

  const handleCreatePage = async ({ displayName, slug }) => {
    const folderPrefix = newPageIn ? `${newPageIn}/` : '';
    const filePath = `${folderPrefix}${slug}`;
    setNewPageIn(null);
    const res = await api.books.saveFile(projectId, bookSlug, filePath, '', displayName);
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

  const handleRenameFolder = async (item, newName) => {
    const res = await api.books.renameFolder(projectId, bookSlug, item.path, newName);
    if (res.success) {
      // If active file was under this folder, clear it
      if (activePath && activePath.startsWith(item.path + '/')) {
        setActivePath(null);
        setFileContent(null);
      }
      await loadMap();
    } else {
      alert(res.error || 'Failed to rename folder');
    }
  };

  const handleSaveBookEdit = async ({ name, description }) => {
    const res = await api.books.update(projectId, bookSlug, { name, description });
    if (res.success) {
      setMap(m => ({ ...m, name: res.data.name, description: res.data.description }));
    }
    setEditingBook(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
    </div>
  );

  if (!map) return (
    <div className="text-center text-muted-foreground py-20">Book not found.</div>
  );

  const activeDisplayName = activePath
    ? (() => {
        const flat = (items) => items.flatMap(i => i.type === 'folder' ? flat(i.items || []) : [i]);
        const found = flat(map.tree?.items || []).find(i => i.path === activePath);
        return found?.displayName || found?.name || activePath;
      })()
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/project/${projectId}?tab=books`)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Back to books"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <BookOpen className="w-6 h-6 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate">{map.name}</h1>
              <button
                onClick={() => setEditingBook(true)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title="Edit book info"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            {map.description && <p className="text-sm text-muted-foreground truncate">{map.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/project/${projectId}/book/${bookSlug}/read`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
            title="Read book"
          >
            <BookMarked className="w-4 h-4" /> Read
          </Link>
          <button
            onClick={() => setNewPageIn('')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            <FilePlus className="w-4 h-4" /> New Page
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
        <div className="w-64 border-r flex-shrink-0 overflow-y-auto p-2">
          {(map.tree?.items || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-2">No pages yet. Create one above.</p>
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
                onNewPage={(parentPath) => setNewPageIn(parentPath)}
                onNewFolder={(parentPath) => setNewFolderIn(parentPath)}
                onRenameFolder={handleRenameFolder}
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
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{activeDisplayName}</p>
                  <code className="text-xs text-muted-foreground font-mono">{activePath}</code>
                </div>
                <Link
                  to={`/project/${projectId}/book/${bookSlug}/edit?path=${encodeURIComponent(activePath)}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              {fileContent.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">This page is empty. Click Edit to add content.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a page from the tree to preview it here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.item.displayName || confirmDelete.item.name}"${confirmDelete.type === 'folder' ? ' and all its contents' : ''}? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {newPageIn !== null && (
        <NewPageModal
          title={`New Page${newPageIn ? ` in ${newPageIn}` : ' at root'}`}
          parentPath={newPageIn || null}
          onConfirm={handleCreatePage}
          onCancel={() => setNewPageIn(null)}
        />
      )}
      {newFolderIn !== null && (
        <NewFolderModal
          title={`New Folder${newFolderIn ? ` in ${newFolderIn}` : ' at root'}`}
          parentPath={newFolderIn || null}
          onConfirm={handleCreateFolder}
          onCancel={() => setNewFolderIn(null)}
        />
      )}
      {editingBook && map && (
        <EditBookModal
          book={{ name: map.name, description: map.description }}
          onSave={handleSaveBookEdit}
          onCancel={() => setEditingBook(false)}
        />
      )}
    </div>
  );
}
