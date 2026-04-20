import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { FileText, Plus, Trash2, Edit, Eye, Folder, Database, ChevronRight, FileJson } from 'lucide-react';
import PostPreviewDrawer from '../components/PostPreviewDrawer';

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

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
    else if (activeTab === 'data') loadDataFolders();
  }, [projectId, activeTab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.posts.list(projectId);
      if (res.success) setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDataFolders = async () => {
    setLoading(true);
    try {
      const res = await api.data.listFolders(projectId);
      if (res.success) setDataFolders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandFolder = async (folder) => {
    if (expandedFolder === folder) {
      setExpandedFolder(null);
      return;
    }
    setExpandedFolder(folder);
    if (!folderFiles[folder]) {
      try {
        const res = await api.data.listFiles(projectId, folder);
        if (res.success) {
          setFolderFiles(prev => ({ ...prev, [folder]: res.data }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeletePost = async (slug) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.posts.delete(projectId, slug);
      setPosts(posts.filter(p => p.slug !== slug));
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleDeleteDataFile = async (folder, filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await api.data.delete(projectId, folder, filename);
      setFolderFiles(prev => ({
        ...prev,
        [folder]: prev[folder].filter(f => f !== filename)
      }));
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const switchTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => switchTab('posts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'posts' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <FileText className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={() => switchTab('data')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'}`}
          >
            <Database className="w-4 h-4" />
            Custom Data
          </button>
        </div>

        {activeTab === 'posts' ? (
          <Link
            to={`/project/${projectId}/post/new`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        ) : (
          <Link
            to={`/project/${projectId}/data/new`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Data File
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
                    <h3 className="text-lg font-semibold truncate">
                      {post.frontmatter.title || post.slug}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{post.slug}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewPost(post)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" title="Preview Post"><Eye className="w-4 h-4" /></button>
                    <Link to={`/project/${projectId}/post/${post.slug}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" title="Edit Post"><Edit className="w-4 h-4" /></Link>
                    <button onClick={() => handleDeletePost(post.slug)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md" title="Delete Post"><Trash2 className="w-4 h-4" /></button>
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
                  <button 
                    onClick={() => handleExpandFolder(folder)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-base">{folder}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedFolder === folder ? 'rotate-90' : ''}`} />
                  </button>
                  
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
                              <div className="flex items-center gap-2">
                                <FileJson className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium">{file}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link 
                                  to={`/project/${projectId}/data/new?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(file)}`}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                                title="Edit File">
                                  <Edit className="w-4 h-4" />
                                </Link>
                                <button 
                                  onClick={() => handleDeleteDataFile(folder, file)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-md"
                                title="Delete File">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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

      {previewPost && (
        <PostPreviewDrawer post={previewPost} onClose={() => setPreviewPost(null)} />
      )}
    </div>
  );
}
