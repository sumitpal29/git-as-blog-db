import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Editor() {
  const { projectId, slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    heroImage: '',
    slug: '',
    draft: true,
  });
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isNew) {
      loadPost();
    }
  }, [isNew, slug, projectId]);

  const loadPost = async () => {
    try {
      const res = await api.posts.get(projectId, slug);
      if (res.success) {
        const { frontmatter, content: rawContent } = res.data;
        setFormData({
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          heroImage: frontmatter.heroImage || '',
          slug: res.data.slug,
          draft: frontmatter.draft !== undefined ? frontmatter.draft : true,
        });
        setContent(rawContent || '');
      } else {
        alert(res.error);
        navigate(`/project/${projectId}`);
      }
    } catch (err) {
      navigate(`/project/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        content,
        metadata: {
          title: formData.title,
          description: formData.description,
          heroImage: formData.heroImage,
          draft: formData.draft,
        }
      };
      
      if (isNew) {
        // Create new
        const res = await api.posts.create(projectId, { ...payload, ...payload.metadata });
        if (res.success) {
          navigate(`/project/${projectId}/post/${res.data.slug}`, { replace: true });
        } else {
          alert('Failed to create post: ' + res.error);
        }
      } else {
        // Update existing
        // Optional: allow slug change 
        if (formData.slug !== slug && formData.slug.trim()) {
           payload.metadata.slug = formData.slug;
        }
        const res = await api.posts.update(projectId, slug, payload);
        if (res.success) {
          if (res.data.slug !== slug) {
            navigate(`/project/${projectId}/post/${res.data.slug}`, { replace: true });
          }
        } else {
          alert('Failed to update post: ' + res.error);
        }
      }
    } catch (err) {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (loading) return <div className="p-10 text-center">Loading editor...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between sticky top-16 bg-background/95 backdrop-blur py-4 z-10 -mt-6 mb-6 border-b">
        <button 
          onClick={() => navigate(`/project/${projectId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posts
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
          >
            {previewMode ? <><EyeOff className="w-4 h-4"/> Edit</> : <><Eye className="w-4 h-4"/> Preview</>}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {!previewMode ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Metadata Section */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Post Title"
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40"
            />
            
            <input
              type="text"
              placeholder="Short Description..."
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              className="w-full text-xl text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/30"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Hero Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.heroImage}
                  onChange={(e) => setFormData(f => ({ ...f, heroImage: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Custom Slug (optional)</label>
                <input
                  type="text"
                  placeholder="auto-generated-from-title"
                  value={formData.slug}
                  onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
                  disabled={isNew}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="draft" 
                checked={formData.draft}
                onChange={(e) => setFormData(f => ({ ...f, draft: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="draft" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Keep as Draft (won't appear in generated JSON)
              </label>
            </div>
          </div>

          {/* Editor Section */}
          <div className="pt-8 border-t">
            <textarea
              placeholder="Write your markdown content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onInput={handleInput}
              className="w-full min-h-[500px] text-lg bg-transparent border-none focus:outline-none focus:ring-0 resize-none font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="prose prose-lg dark:prose-invert max-w-none animate-in fade-in duration-300">
          {formData.heroImage && (
            <img src={formData.heroImage} alt="Hero" className="w-full h-auto rounded-xl shadow-sm mb-8" />
          )}
          <h1>{formData.title || 'Untitled'}</h1>
          {formData.description && <p className="lead text-muted-foreground">{formData.description}</p>}
          <hr />
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '*No content yet...*'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
