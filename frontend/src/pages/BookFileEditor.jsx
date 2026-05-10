import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Save, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BookFileEditor() {
  const { projectId, bookSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filePath = searchParams.get('path') || '';

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!filePath) return;
    api.books.getFile(projectId, bookSlug, filePath).then(res => {
      if (res.success) setContent(res.data.content);
      setLoading(false);
    });
  }, [projectId, bookSlug, filePath]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || preview) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 400)}px`;
  }, [content, preview]);

  const handleSave = async () => {
    setSaving(true);
    const res = await api.books.saveFile(projectId, bookSlug, filePath, content);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const next = content.slice(0, selectionStart) + '  ' + content.slice(selectionEnd);
      setContent(next);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
    </div>
  );

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/project/${projectId}/book/${bookSlug}`)}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            title="Back to book"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-mono">{bookSlug} /</p>
            <p className="text-sm font-semibold font-mono">{filePath}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {preview ? (
          <div className="p-8 prose min-h-[400px]">
            {content.trim()
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              : <p className="text-muted-foreground italic">Nothing to preview yet.</p>
            }
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing in Markdown..."
            className="w-full p-6 font-mono text-sm leading-relaxed bg-card focus:outline-none resize-none min-h-[400px] text-foreground"
            spellCheck={false}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: <kbd className="bg-muted px-1 py-0.5 rounded text-xs">⌘S</kbd> to save · <kbd className="bg-muted px-1 py-0.5 rounded text-xs">Tab</kbd> inserts 2 spaces
      </p>
    </div>
  );
}
