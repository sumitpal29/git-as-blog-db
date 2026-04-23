import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
  FileText, Plus, Trash2, Edit, Eye, Folder, Database,
  ChevronRight, FileJson, Pencil, Check, X
} from 'lucide-react';
import PostPreviewDrawer from '../components/PostPreviewDrawer';

function JsonQuickViewModal({ title, content, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-sm truncate">{title}</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-4 font-mono text-xs text-left bg-muted/30 rounded-b-xl">
          {content}
        </pre>
      </div>
    </div>
  );
}

function InlineRename({ value, onConfirm, onCancel, maxLength = 60 }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-1 flex-1">
      <input
        autoFocus
        type="text"
        value={val}
        maxLength={maxLength}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(val); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 bg-transparent border-b border-primary outline-none text-sm font-medium px-1"
        onClick={e => e.stopPropagation()}
      />
      <button onClick={() => onConfirm(val)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'posts';

  const [posts, setPosts] = useState([]);
  const [dataFolders, setDataFolders] = useState([]);
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [folderFiles, setFolderFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState(null);
  const [quickView, setQuickView] = useState(null); // { title, content }

  // Rename state
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null); // { folder, filename }

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
    else if (activeTab === 'data') loadDataFolders();
  }, [projectId, activeTab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.posts.list(projectId);
      if (res.success) setPosts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDataFolders = async () => {
    setLoading(true);
    try {
      const res = await api.data.listFolders(projectId);
      if (res.success) setDataFolders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExpandFolder = async (folder) => {
    if (expandedFolder === folder) { setExpandedFolder(null); return; }
    setExpandedFolder(folder);
    if (!folderFiles[folder]) {
      try {
        const res = await api.data.listFiles(projectId, folder);
        if (res.success) setFolderFiles(prev => ({ ...prev, [folder]: res.data }));
      } catch (err) { console.error(err); }
    }
  };

  const handleDeletePost = async (slug) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.posts.delete(projectId, slug);
      setPosts(posts.filter(p => p.slug !== slug));
    } catch (err) { alert('Failed to delete post'); }
  };

  const handleDeleteDataFile = async (folder, filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      await api.data.delete(projectId, folder, filename);
      setFolderFiles(prev => ({ ...prev, [folder]: prev[folder].filter(f => f !== filename) }));
    } catch (err) { alert('Failed to delete file'); }
  };

  const handleRenameFolder = async (oldFolder, newFolder) => {
    const trimmed = newFolder.trim();
    if (!trimmed || trimmed === oldFolder) { setRenamingFolder(null); return; }
    try {
      const res = await api.data.renameFolder(projectId, oldFolder, trimmed);
      if (res.success) {
        setDataFolders(prev => prev.map(f => (f === oldFolder ? trimmed : f)));
        setFolderFiles(prev => {
          const updated = { ...prev };
          if (updated[oldFolder]) { updated[trimmed] = updated[oldFolder]; delete updated[oldFolder]; }
          return updated;
        });
        if (expandedFolder === oldFolder) setExpandedFolder(trimmed);
      } else { alert(res.error || 'Failed to rename folder'); }
    } catch (err) { alert('Failed to rename folder'); }
    setRenamingFolder(null);
  };

  const handleRenameFile = async (folder, oldFilename, newFilename) => {
    const trimmed = newFilename.trim();
    if (!trimmed || trimmed === oldFilename) { setRenamingFile(null); return; }
    try {
      const res = await api.data.renameFile(projectId, folder, oldFilename, trimmed);
      if (res.success) {
        const final = res.newFilename || trimmed;
        setFolderFiles(prev => ({
          ...prev,
          [folder]: prev[folder].map(f => (f === oldFilename ? final : f))
        }));
      } else { alert(res.error || 'Failed to rename file'); }
    } catch (err) { alert('Failed to rename file'); }
    setRenamingFile(null);
  };

  const handleQuickView = async (folder, filename) => {
    try {
      const res = await api.data.get(projectId, folder, filename);
      if (res.success) {
        setQuickView({ title: `${folder}/${filename}`, content: JSON.stringify(res.data, null, 2) });
      }
    } catch (err) { alert('Failed to load file'); }
  };

  const switchTab = (tab) => setSearchParams({ tab });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => switchTab('posts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'posts' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <FileText className="w-4 h-4" />Posts
          </button>
          <button
            onClick={() => switchTab('data')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <Database className="w-4 h-4" />Custom Data
          </button>
        </div>

        {activeTab === 'posts' ? (
          <Link to={`/project/${projectId}/post/new`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />New Post
          </Link>
        ) : (
          <Link to={`/project/${projectId}/data/new`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />New Data File
          </Link>
        )}
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No posts yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">Create your first blog post to get started.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {posts.map((post) => (
                <li key={post.slug} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{post.frontmatter.title || post.slug}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{post.slug}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewPost(post)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" title="Preview Post">
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link to={`/project/${projectId}/post/${post.slug}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" title="Edit Post">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDeletePost(post.slug)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md" title="Delete Post">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          dataFolders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Database className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No custom data</h3>
              <p className="text-muted-foreground mt-1 mb-4">Create some JSON config or data files.</p>
            </div>
          ) : (
            <ul className="divide-y border">
              {dataFolders.map((folder) => (
                <li key={folder} className="bg-card">
                  {/* Folder row */}
                  <div className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                    <button
                      onClick={() => handleExpandFolder(folder)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <Folder className="w-5 h-5 text-blue-500 shrink-0" />
                      {renamingFolder === folder ? (
                        <InlineRename
                          value={folder}
                          onConfirm={(val) => handleRenameFolder(folder, val)}
                          onCancel={() => setRenamingFolder(null)}
                        />
                      ) : (
                        <span className="font-medium text-base">{folder}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      {renamingFolder !== folder && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename Folder"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight
                        onClick={() => handleExpandFolder(folder)}
                        className={`w-5 h-5 text-muted-foreground transition-transform cursor-pointer ${expandedFolder === folder ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded files */}
                  {expandedFolder === folder && (
                    <div className="bg-muted/30 border-t p-4">
                      {!folderFiles[folder] ? (
                        <p className="text-sm text-muted-foreground">Loading files...</p>
                      ) : folderFiles[folder].length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Empty folder</p>
                      ) : (
                        <ul className="space-y-2 pl-4 border-l-2 border-muted">
                          {folderFiles[folder].map(file => (
                            <li key={file} className="flex flex-row items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors group">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileJson className="w-4 h-4 text-emerald-500 shrink-0" />
                                {renamingFile?.folder === folder && renamingFile?.filename === file ? (
                                  <InlineRename
                                    value={file}
                                    maxLength={64}
                                    onConfirm={(val) => handleRenameFile(folder, file, val)}
                                    onCancel={() => setRenamingFile(null)}
                                  />
                                ) : (
                                  <span className="text-sm font-medium truncate">{file}</span>
                                )}
                              </div>
                              {!(renamingFile?.folder === folder && renamingFile?.filename === file) && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => handleQuickView(folder, file)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                    title="Quick View JSON"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setRenamingFile({ folder, filename: file })}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                    title="Rename File"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <Link
                                    to={`/project/${projectId}/data/new?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(file)}`}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                    title="Edit File"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteDataFile(folder, file)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md"
                                    title="Delete File"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {previewPost && <PostPreviewDrawer post={previewPost} onClose={() => setPreviewPost(null)} />}
      {quickView && <JsonQuickViewModal title={quickView.title} content={quickView.content} onClose={() => setQuickView(null)} />}
    </div>
  );
}
