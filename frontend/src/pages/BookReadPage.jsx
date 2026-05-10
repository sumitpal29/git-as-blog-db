import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Loader2, ChevronRight, FileText, Folder,
  ArrowLeft, ChevronLeft, ChevronRight as ChevronRightNav, Edit2,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Flatten tree into ordered list of file items (depth-first)
function flattenTree(items) {
  const result = [];
  for (const item of items || []) {
    if (item.type === 'file') {
      result.push(item);
    } else if (item.type === 'folder') {
      result.push(...flattenTree(item.items || []));
    }
  }
  return result;
}

function TocNode({ item, depth, activePath, onSelect }) {
  const [open, setOpen] = useState(true);
  const displayLabel = item.displayName || item.name;

  if (item.type === 'file') {
    const isActive = activePath === item.path;
    return (
      <button
        onClick={() => onSelect(item)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left transition-colors',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
        )}
      >
        <FileText className="w-3.5 h-3.5 shrink-0 text-blue-500" />
        <span className="truncate">{displayLabel}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md text-left hover:bg-muted/50 transition-colors"
      >
        <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} />
        <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
        <span className="font-medium truncate text-foreground">{displayLabel}</span>
      </button>
      {open && (item.items || []).map(child => (
        <TocNode key={child.path} item={child} depth={depth + 1} activePath={activePath} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default function BookReadPage() {
  const { projectId, bookSlug } = useParams();
  const navigate = useNavigate();

  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null); // file item
  const [pageContent, setPageContent] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [flatPages, setFlatPages] = useState([]);

  const loadMap = useCallback(async () => {
    setLoading(true);
    const res = await api.books.getMap(projectId, bookSlug);
    if (res.success) {
      setMap(res.data);
      const pages = flattenTree(res.data.tree?.items || []);
      setFlatPages(pages);
      if (pages.length > 0) loadPage(pages[0]);
    }
    setLoading(false);
  }, [projectId, bookSlug]);

  useEffect(() => { loadMap(); }, [loadMap]);

  const loadPage = useCallback(async (item) => {
    setActivePage(item);
    setPageContent(null);
    setPageLoading(true);
    const res = await api.books.getFile(projectId, bookSlug, item.path);
    if (res.success) setPageContent(res.data.content);
    setPageLoading(false);
  }, [projectId, bookSlug]);

  const activeIndex = flatPages.findIndex(p => p.path === activePage?.path);
  const prevPage = activeIndex > 0 ? flatPages[activeIndex - 1] : null;
  const nextPage = activeIndex < flatPages.length - 1 ? flatPages[activeIndex + 1] : null;

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
    </div>
  );

  if (!map) return (
    <div className="text-center text-muted-foreground py-20">Book not found.</div>
  );

  const displayName = activePage?.displayName || activePage?.name || '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/project/${projectId}/book/${bookSlug}`)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Back to editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <BookOpen className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-xl font-bold tracking-tight truncate">{map.name}</h1>
          {map.description && <span className="text-sm text-muted-foreground hidden sm:block truncate">— {map.description}</span>}
        </div>
        {activePage && (
          <Link
            to={`/project/${projectId}/book/${bookSlug}/edit?path=${encodeURIComponent(activePage.path)}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Page
          </Link>
        )}
      </div>

      {/* Two-column reading layout */}
      <div className="flex gap-0 border rounded-lg overflow-hidden bg-card min-h-[600px]">
        {/* TOC sidebar */}
        <div className="w-56 border-r flex-shrink-0 overflow-y-auto bg-muted/20">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contents</p>
          </div>
          <div className="p-2">
            {flatPages.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2">No pages yet.</p>
            ) : (
              (map.tree?.items || []).map(item => (
                <TocNode
                  key={item.path}
                  item={item}
                  depth={0}
                  activePath={activePage?.path}
                  onSelect={loadPage}
                />
              ))
            )}
          </div>
        </div>

        {/* Reading area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {pageLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="animate-spin text-muted-foreground w-5 h-5" />
            </div>
          ) : pageContent !== null ? (
            <div className="flex-1 flex flex-col">
              <div className="px-8 py-6 flex-1">
                <h2 className="text-2xl font-bold mb-6 pb-3 border-b">{displayName}</h2>
                {pageContent.trim() ? (
                  <div className="prose prose-sm max-w-2xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{pageContent}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">This page is empty.</p>
                )}
              </div>
              {/* Prev / Next nav */}
              <div className="flex items-center justify-between px-8 py-4 border-t gap-4">
                {prevPage ? (
                  <button
                    onClick={() => loadPage(prevPage)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="truncate max-w-[160px]">{prevPage.displayName || prevPage.name}</span>
                  </button>
                ) : <div />}
                <span className="text-xs text-muted-foreground shrink-0">
                  {activeIndex + 1} / {flatPages.length}
                </span>
                {nextPage ? (
                  <button
                    onClick={() => loadPage(nextPage)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span className="truncate max-w-[160px]">{nextPage.displayName || nextPage.name}</span>
                    <ChevronRightNav className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : <div />}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a page from the table of contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
