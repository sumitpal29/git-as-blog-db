import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '../lib/api';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import DuplicateImageDialog from '../components/DuplicateImageDialog';
import {
  ImageIcon, Upload, Trash2, Copy, Check, Info,
  AlertTriangle, Loader2, Images, Eye, X, ZoomIn,
} from 'lucide-react';

const BACKEND = 'http://localhost:4000';
const ACCEPTED = { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'] };

function thumbnailUrl(projectId, filename) {
  return `${BACKEND}/projects-static/${projectId}/assets/${encodeURIComponent(filename)}`;
}

function parseGithubRawUrl(remoteUrl, branch, projectId, filename) {
  if (!remoteUrl) return null;
  const sshMatch = remoteUrl.match(/git@github\.com[:/](.+?)(?:\.git)?$/);
  const httpsMatch = remoteUrl.match(/github\.com\/(.+?)(?:\.git)?$/);
  const repoPath = (sshMatch || httpsMatch)?.[1];
  if (!repoPath) return null;
  return `https://raw.githubusercontent.com/${repoPath}/${branch}/${projectId}/assets/${encodeURIComponent(filename)}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy URL"
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function ImagePreviewModal({ image, projectId, githubUrl, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const src = thumbnailUrl(projectId, image.name);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 180ms ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col gap-3 max-w-5xl w-full"
        style={{ animation: 'zoomIn 200ms ease' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <ZoomIn className="w-4 h-4 text-white/70 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{image.name}</span>
            <Badge variant="secondary" className="text-xs shrink-0">{image.sizeFormatted}</Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            {githubUrl && <CopyButton text={githubUrl} />}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center">
          {!loaded && (
            <div className="absolute flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}
          <img
            src={src}
            alt={image.name}
            onLoad={() => setLoaded(true)}
            className="max-h-[80vh] max-w-full rounded-xl shadow-2xl object-contain"
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 300ms ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ImageRow({ projectId, image, githubUrl, onDelete, onPreview }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const thumb = thumbnailUrl(projectId, image.name);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(image.name);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <li className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors group">
      <div className="w-14 h-14 rounded-md border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
        <img
          src={thumb}
          alt={image.name}
          className="w-full h-full object-cover"
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden w-full h-full items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={image.name}>{image.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-xs">{image.sizeFormatted}</Badge>
          {githubUrl && (
            <span className="text-xs text-muted-foreground truncate font-mono hidden sm:block max-w-xs">
              {githubUrl}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onPreview(image)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Preview image"
        >
          <Eye className="w-4 h-4" />
        </button>
        {githubUrl && <CopyButton text={githubUrl} />}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
            title="Delete image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-md text-xs border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function AssetsPage() {
  const { projectId } = useParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [queueStatus, setQueueStatus] = useState(null); // { done, total }
  const [errors, setErrors] = useState([]); // per-file error messages

  // Image preview
  const [previewImage, setPreviewImage] = useState(null);

  // Conflict dialog
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflict, setConflict] = useState(null);
  // Promise resolver — pauses the queue loop until user resolves/skips
  const resolveConflictRef = useRef(null);

  const [gitConfig, setGitConfig] = useState(null);

  useEffect(() => {
    loadImages();
    loadConfig();
  }, [projectId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await api.assets.list(projectId);
      if (res.success) setImages(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadConfig = async () => {
    try {
      const res = await api.projects.getConfig(projectId);
      if (res.success) setGitConfig(res.data?.git ?? null);
    } catch { /* ignore */ }
  };

  // Upload a single file with given options, returns API result
  const uploadOne = useCallback(async (file, options = {}) => {
    setUploadProgress(5);
    const tick = setInterval(
      () => setUploadProgress(p => Math.min(p + 18, 88)),
      250
    );
    try {
      const result = await api.assets.upload(projectId, file, options);
      clearInterval(tick);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 400);
      return result;
    } catch (err) {
      clearInterval(tick);
      setUploadProgress(0);
      return { success: false, error: err.message || 'Upload failed' };
    }
  }, [projectId]);

  // Process an array of files sequentially, pausing on conflicts
  const processFiles = useCallback(async (files) => {
    const total = files.length;
    setUploading(true);
    setErrors([]);
    setQueueStatus({ done: 0, total });

    for (let i = 0; i < files.length; i++) {
      setQueueStatus({ done: i, total });

      let options = {};
      let done = false;

      while (!done) {
        const result = await uploadOne(files[i], options);

        if (result.status === 409 && result.conflict) {
          // Pause the loop: show dialog, wait for promise to resolve
          setConflict(result);
          setConflictOpen(true);

          const resolution = await new Promise(resolve => {
            resolveConflictRef.current = resolve;
          });

          if (resolution === null) {
            // User chose to skip this file
            done = true;
          } else {
            // User chose replace or copy — retry with strategy
            options = resolution;
          }
        } else {
          if (result.success) {
            setImages(prev => [result.data, ...prev]);
          } else if (result.error) {
            setErrors(prev => [...prev, `${files[i].name}: ${result.error}`]);
          }
          done = true;
        }
      }
    }

    setQueueStatus({ done: total, total });
    setUploading(false);
    setTimeout(() => setQueueStatus(null), 1200);
  }, [uploadOne]);

  const onDrop = useCallback((accepted, rejected) => {
    const rejectedErrors = rejected.map(r =>
      `${r.file.name}: only image files are accepted`
    );
    if (rejectedErrors.length) setErrors(rejectedErrors);
    if (accepted.length > 0) processFiles(accepted);
  }, [processFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
    disabled: uploading,
  });

  const handleConflictResolve = ({ strategy, name }) => {
    setConflictOpen(false);
    setConflict(null);
    resolveConflictRef.current?.({ strategy, name });
    resolveConflictRef.current = null;
  };

  const handleConflictSkip = () => {
    setConflictOpen(false);
    setConflict(null);
    resolveConflictRef.current?.(null);
    resolveConflictRef.current = null;
  };

  const handleDelete = async (filename) => {
    await api.assets.delete(projectId, filename);
    setImages(prev => prev.filter(img => img.name !== filename));
  };

  const getGithubUrl = (filename) =>
    parseGithubRawUrl(gitConfig?.remoteUrl, gitConfig?.branch ?? 'main', projectId, filename);

  const queueLabel = queueStatus
    ? queueStatus.total === 1
      ? 'Uploading…'
      : `Uploading ${queueStatus.done + 1} of ${queueStatus.total}…`
    : isDragActive
      ? 'Drop your images here'
      : 'Drag & drop images';

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <Alert variant="info">
        <Info className="w-4 h-4" />
        <AlertDescription>
          Only image files are accepted — JPG, PNG, GIF, WebP, SVG, AVIF (max 20 MB each).
          Filenames are auto-slugified. Images sync to GitHub on your next push.
        </AlertDescription>
      </Alert>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={[
          'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200',
          uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
        ].join(' ')}
      >
        <input {...getInputProps()} />

        <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
          {uploading
            ? <Loader2 className="w-8 h-8 text-primary animate-spin" />
            : <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          }
        </div>

        <div>
          <p className={`text-base font-semibold transition-colors ${isDragActive || uploading ? 'text-primary' : 'text-foreground'}`}>
            {queueLabel}
          </p>
          {!uploading && (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">JPG · PNG · GIF · WebP · SVG · AVIF · multiple files OK</p>
            </>
          )}
        </div>

        {uploadProgress > 0 && (
          <div className="w-full max-w-xs space-y-1">
            <Progress value={uploadProgress} />
            {queueStatus && queueStatus.total > 1 && (
              <p className="text-xs text-center text-muted-foreground">
                {queueStatus.done + 1} / {queueStatus.total} files
              </p>
            )}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <ul className="space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Image list */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Uploaded Images</span>
            {!loading && (
              <Badge variant="secondary" className="text-xs">{images.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={loadImages} disabled={loading || uploading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">No images yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your first image using the dropzone above.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {images.map(img => (
              <ImageRow
                key={img.name}
                projectId={projectId}
                image={img}
                githubUrl={getGithubUrl(img.name)}
                onDelete={handleDelete}
                onPreview={setPreviewImage}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <ImagePreviewModal
          image={previewImage}
          projectId={projectId}
          githubUrl={getGithubUrl(previewImage.name)}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Conflict dialog */}
      <DuplicateImageDialog
        open={conflictOpen}
        onOpenChange={(open) => { if (!open) handleConflictSkip(); }}
        conflict={conflict}
        onResolve={handleConflictResolve}
        onSkip={handleConflictSkip}
      />
    </div>
  );
}
