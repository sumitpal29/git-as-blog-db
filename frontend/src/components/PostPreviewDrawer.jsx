import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PostPreviewDrawer({ post, onClose }) {
  const { projectId } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the full post content when the drawer opens
  useState(() => {
    api.posts.get(projectId, post.slug).then(res => {
      if (res.success) {
        setContent(res.data.content);
      }
      setLoading(false);
    });
  }, [post.slug]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative flex flex-col w-full max-w-2xl bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{post.frontmatter.title || post.slug}</h2>
            {post.frontmatter.description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{post.frontmatter.description}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {post.frontmatter.heroImage && (
                <img src={post.frontmatter.heroImage} alt="Hero" className="w-full rounded-xl mb-6 shadow-sm" />
              )}
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*No content yet.*'}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30 text-xs text-muted-foreground">
          <span>Slug: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{post.slug}</code></span>
          {post.frontmatter.draft && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Draft</span>}
          <span>{new Date(post.frontmatter.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
