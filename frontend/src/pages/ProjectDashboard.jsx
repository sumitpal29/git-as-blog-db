import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  FileText, Plus, Trash2, Edit, Eye, Folder, Database,
  ChevronRight, FileJson, Pencil, Check, X, BookOpen,
  AlertTriangle, Loader2, ImageIcon, ArrowUpAZ, ArrowDownAZ,
  CalendarArrowUp, CalendarArrowDown,
} from 'lucide-react';
import PostPreviewDrawer from '../components/PostPreviewDrawer';
import AssetsPage from './AssetsPage';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'posts';

  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const [dataFolders, setDataFolders] = useState([]);
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [postsExpanded, setPostsExpanded] = useState(false);
  const [folderFiles, setFolderFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState(null);
  const [quickView, setQuickView] = useState(null); // { title, content }

  // Books state
  const [books, setBooks] = useState([]);
  const [newBookName, setNewBookName] = useState('');
  const [newBookSlug, setNewBookSlug] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [bookSlugManual, setBookSlugManual] = useState(false);
  const [bookNameError, setBookNameError] = useState('');
  const [creatingBook, setCreatingBook] = useState(false);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(null);
  const [editingBook, setEditingBook] = useState(null); // { slug, name, description }

  // Rename state
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null); // { folder, filename }

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
    else if (activeTab === 'data') { loadDataFolders(); loadPosts(); }
    else if (activeTab === 'books') loadBooks();
    // 'assets' tab manages its own data loading inside AssetsPage
  }, [projectId, activeTab]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.books.list(projectId);
      if (res.success) setBooks(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateSlug = (text) =>
    (text || '').toLowerCase().replace(/[^a-z0-9\s_-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 60) || '';

  const handleBookNameChange = (val) => {
    setNewBookName(val);
    setBookNameError('');
    if (!bookSlugManual) setNewBookSlug(generateSlug(val));
  };

  const handleBookSlugChange = (val) => {
    setNewBookSlug(val);
    setBookSlugManual(true);
    setBookNameError('');
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    const name = newBookName.trim();
    const slug = newBookSlug.trim();
    if (!name) { setBookNameError('Book name is required'); return; }
    if (slug && !/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/.test(slug)) {
      setBookNameError('URL slug: lowercase letters, numbers, hyphens, underscores only — no spaces');
      return;
    }
    setCreatingBook(true);
    setBookNameError('');
    const res = await api.books.create(projectId, { name, slug: slug || undefined, description: newBookDesc.trim() });
    setCreatingBook(false);
    if (res.success) {
      setNewBookName('');
      setNewBookSlug('');
      setNewBookDesc('');
      setBookSlugManual(false);
      await loadBooks();
    } else {
      setBookNameError(res.error || 'Failed to create book');
    }
  };

  const handleDeleteBook = async () => {
    const slug = confirmDeleteBook;
    setConfirmDeleteBook(null);
    await api.books.delete(projectId, slug);
    setBooks(books.filter(b => b.slug !== slug));
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    const { slug, name, description } = editingBook;
    const res = await api.books.update(projectId, slug, { name, description });
    if (res.success) {
      setBooks(books.map(b => b.slug === slug ? { ...b, name: res.data.name, description: res.data.description } : b));
      setEditingBook(null);
    } else {
      alert(res.error || 'Failed to update book');
    }
  };

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

  const SORT_OPTS = [
    { value: 'date-desc', label: 'Newest', Icon: CalendarArrowDown },
    { value: 'date-asc',  label: 'Oldest', Icon: CalendarArrowUp },
    { value: 'name-asc',  label: 'A → Z',  Icon: ArrowUpAZ },
    { value: 'name-desc', label: 'Z → A',  Icon: ArrowDownAZ },
  ];

  const sortedPosts = [...posts].sort((a, b) => {
    const aTitle = (a.frontmatter.title || a.slug).toLowerCase();
    const bTitle = (b.frontmatter.title || b.slug).toLowerCase();
    const aDate = new Date(a.frontmatter.publishedAt || a.frontmatter.createdAt || 0);
    const bDate = new Date(b.frontmatter.publishedAt || b.frontmatter.createdAt || 0);
    if (sortBy === 'name-asc')  return aTitle.localeCompare(bTitle);
    if (sortBy === 'name-desc') return bTitle.localeCompare(aTitle);
    if (sortBy === 'date-asc')  return aDate - bDate;
    return bDate - aDate;
  });

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
          <button
            onClick={() => switchTab('books')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <BookOpen className="w-4 h-4" />Books
          </button>
          <button
            onClick={() => switchTab('assets')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'assets' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <ImageIcon className="w-4 h-4" />Assets
          </button>
        </div>

        {activeTab === 'posts' ? (
          <Link to={`/project/${projectId}/post/new`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />New Post
          </Link>
        ) : activeTab === 'data' ? (
          <Link to={`/project/${projectId}/data/new`} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" />New Data File
          </Link>
        ) : null}
      </div>

      {activeTab === 'assets' ? (
        <AssetsPage />
      ) : null}

      <div className={`bg-card border rounded-lg shadow-sm overflow-hidden min-h-[400px] ${activeTab === 'assets' ? 'hidden' : ''}`}>
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
            <>
              {/* Sort toolbar */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b bg-muted/20">
                <span className="text-xs text-muted-foreground mr-1">Sort:</span>
                {SORT_OPTS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      sortBy === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <ul className="divide-y">
                {sortedPosts.map((post) => {
                  const pubDate = post.frontmatter.publishedAt || post.frontmatter.createdAt;
                  return (
                    <li key={post.slug} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{post.frontmatter.title || post.slug}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{post.slug}</code>
                          {pubDate && (
                            <span className="text-xs">
                              {new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
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
                  );
                })}
              </ul>
            </>
          )
        ) : activeTab === 'books' ? (
          <div className="p-6 space-y-6">
            {/* Create book form */}
            <form onSubmit={handleCreateBook} className="bg-muted/30 border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">New Book</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Book Name</label>
                  <input
                    type="text"
                    placeholder="My Awesome Book"
                    value={newBookName}
                    onChange={e => handleBookNameChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">URL Slug <span className="text-muted-foreground/60">(auto-generated)</span></label>
                  <input
                    type="text"
                    placeholder="my-awesome-book"
                    value={newBookSlug}
                    onChange={e => handleBookSlugChange(e.target.value)}
                    maxLength={60}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Description <span className="text-muted-foreground/60">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="A short description"
                    value={newBookDesc}
                    onChange={e => setNewBookDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                  />
                </div>
              </div>
              {bookNameError && <p className="text-xs text-destructive">{bookNameError}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creatingBook}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creatingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Book
                </button>
              </div>
            </form>

            {/* Book list */}
            {books.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-lg font-medium">No books yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Create a book to organise documentation, guides, or any long-form content.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {books.map(book => (
                  <li key={book.slug} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors group">
                    <button
                      onClick={() => navigate(`/project/${projectId}/book/${book.slug}`)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <BookOpen className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold">{book.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs text-muted-foreground font-mono">{book.slug}</code>
                          {book.description && <span className="text-xs text-muted-foreground truncate">— {book.description}</span>}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setEditingBook({ slug: book.slug, name: book.name, description: book.description || '' })}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit book info"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteBook(book.slug)}
                        className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                        title="Delete book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Delete book confirmation */}
            {confirmDeleteBook && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                    <h3 className="font-semibold">Delete Book</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Delete "<strong>{confirmDeleteBook}</strong>" and all its pages? This cannot be undone.</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setConfirmDeleteBook(null)} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
                    <button onClick={handleDeleteBook} className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">Delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit book modal */}
            {editingBook && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Edit Book</h3>
                    <button onClick={() => setEditingBook(null)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleUpdateBook} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Book Name</label>
                      <input
                        autoFocus
                        type="text"
                        value={editingBook.name}
                        onChange={e => setEditingBook(b => ({ ...b, name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <input
                        type="text"
                        value={editingBook.description}
                        onChange={e => setEditingBook(b => ({ ...b, description: e.target.value }))}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">URL Slug</label>
                      <code className="block text-xs bg-muted px-2 py-1.5 rounded text-muted-foreground">{editingBook.slug}</code>
                      <p className="text-xs text-muted-foreground">URL slug cannot be changed after creation.</p>
                    </div>
                    <div className="flex gap-3 justify-end pt-1">
                      <button type="button" onClick={() => setEditingBook(null)} className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors">Cancel</button>
                      <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Posts folder — always shown in data tab */}
            <ul className="divide-y border rounded-lg mb-4 overflow-hidden">
              <li className="bg-card">
                <div className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <button
                    onClick={() => setPostsExpanded(v => !v)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <BookOpen className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="font-medium">posts</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">blog posts</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/project/${projectId}/post/new`}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      title="New Post"
                      onClick={e => e.stopPropagation()}
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                    <ChevronRight
                      onClick={() => setPostsExpanded(v => !v)}
                      className={`w-5 h-5 text-muted-foreground transition-transform cursor-pointer ${postsExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>
                {postsExpanded && (
                  <div className="bg-muted/30 border-t p-4">
                    {posts.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No posts yet</p>
                    ) : (
                      <ul className="space-y-2 pl-4 border-l-2 border-muted">
                        {posts.map(post => (
                          <li key={post.slug} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-sm font-medium truncate">{post.slug}.md</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => setPreviewPost(post)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/project/${projectId}/post/${post.slug}`}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                title="Edit Post"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            </ul>

            {/* Custom data folders */}
            {dataFolders.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center border rounded-lg">
                <Database className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No custom data</h3>
                <p className="text-muted-foreground mt-1 mb-4">Create some JSON config or data files.</p>
              </div>
            ) : (
              <ul className="divide-y border rounded-lg overflow-hidden">
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
          )}
        </>
        )}
      </div>

      {previewPost && <PostPreviewDrawer post={previewPost} onClose={() => setPreviewPost(null)} />}
      {quickView && <JsonQuickViewModal title={quickView.title} content={quickView.content} onClose={() => setQuickView(null)} />}
    </div>
  );
}
