import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save, Wand2, ChevronDown, Plus } from 'lucide-react';

const FILENAME_MAX = 60;
const FILENAME_SUFFIX = '.json';

export default function DataEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const editFolder = queryParams.get('folder');
  const editFilename = queryParams.get('filename');
  const isNew = !editFolder || !editFilename;

  // Folder state
  const [existingFolders, setExistingFolders] = useState([]);
  const [folderMode, setFolderMode] = useState(editFolder ? 'existing' : 'create'); // 'existing' | 'create'
  const [folder, setFolder] = useState(editFolder || '');
  const [newFolderName, setNewFolderName] = useState('');

  // Filename state
  const [filename, setFilename] = useState(
    editFilename ? editFilename.replace(/\.json$/i, '') : ''
  );

  // Content state
  const [content, setContent] = useState('{\n  \n}');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');

  // Load available folders (for dropdown)
  useEffect(() => {
    api.data.listFolders(projectId)
      .then(res => {
        if (res.success) {
          setExistingFolders(res.data);
          if (!editFolder && res.data.length > 0) {
            // default to first existing folder
            setFolder(res.data[0]);
            setFolderMode('existing');
          }
        }
      })
      .catch(console.error);
  }, [projectId, editFolder]);

  // Load existing file content if editing
  useEffect(() => {
    if (!isNew) loadData();
  }, [isNew]);

  const loadData = async () => {
    try {
      const res = await api.data.get(projectId, editFolder, editFilename);
      if (res.success) {
        setContent(JSON.stringify(res.data, null, 2));
      } else {
        alert(res.error || 'Failed to load data');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validateJson = (text) => {
    try {
      JSON.parse(text);
      setJsonError('');
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (val.trim()) validateJson(val);
    else setJsonError('');
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (e) {
      setJsonError(e.message);
      alert('Cannot beautify: invalid JSON.\n' + e.message);
    }
  };

  const resolvedFolder = folderMode === 'existing' ? folder : newFolderName.trim();
  const resolvedFilename = filename.trim()
    ? filename.trim().endsWith('.json') ? filename.trim() : `${filename.trim()}.json`
    : '';

  const handleSave = async () => {
    if (!resolvedFolder) {
      alert('Please select or enter a folder name.');
      return;
    }
    if (!filename.trim()) {
      alert('File name is required.');
      return;
    }
    if (filename.trim().length > FILENAME_MAX) {
      alert(`Filename must be ${FILENAME_MAX} characters or fewer.`);
      return;
    }
    if (!validateJson(content)) {
      alert('Invalid JSON. Please fix the formatting before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.data.save(
        projectId,
        resolvedFolder,
        resolvedFilename,
        JSON.parse(content)
      );
      if (res.success) {
        navigate(`/project/${projectId}?tab=data`);
      } else {
        alert(res.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading editor...</div>;

  const filenameLen = filename.trim().length;
  const filenameOverLimit = filenameLen > FILENAME_MAX;

  return (
    <div className="max-w-4xl mx-auto pb-20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between py-4 z-10 mb-6 border-b">
        <button
          onClick={() => navigate(`/project/${projectId}?tab=data`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBeautify}
            className="flex items-center gap-2 px-3 py-2 border text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Beautify / Format JSON"
          >
            <Wand2 className="w-4 h-4" />
            Beautify
          </button>
          <button
            onClick={handleSave}
            disabled={saving || filenameOverLimit || !!jsonError}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save JSON'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Folder field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Folder Name</label>
            {isNew ? (
              <div className="space-y-2">
                {/* Toggle buttons */}
                <div className="flex rounded-md border overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => setFolderMode('existing')}
                    disabled={existingFolders.length === 0}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-colors ${
                      folderMode === 'existing'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted text-muted-foreground disabled:opacity-40'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Choose
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderMode('create')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 transition-colors ${
                      folderMode === 'create'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>

                {folderMode === 'existing' ? (
                  <select
                    value={folder}
                    onChange={e => setFolder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    {existingFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. metadata"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                value={folder}
                disabled
                className="w-full px-3 py-2 border rounded-md disabled:bg-muted text-sm"
              />
            )}
          </div>

          {/* Filename field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">File Name</label>
              <span className={`text-xs ${filenameOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                {filenameLen}/{FILENAME_MAX}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. profile-config"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                disabled={!isNew}
                maxLength={FILENAME_MAX + 5} /* allow typing, just show the counter */
                className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 text-sm disabled:bg-muted ${
                  filenameOverLimit ? 'border-destructive focus:ring-destructive' : 'focus:ring-ring'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                .json
              </span>
            </div>
            {filenameOverLimit && (
              <p className="text-xs text-destructive">Filename exceeds {FILENAME_MAX} character limit.</p>
            )}
          </div>
        </div>

        {/* JSON Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">JSON Content</label>
            {jsonError && (
              <span className="text-xs text-destructive font-mono truncate max-w-xs" title={jsonError}>
                ⚠ {jsonError}
              </span>
            )}
          </div>
          <textarea
            value={content}
            onChange={handleContentChange}
            className={`w-full h-96 p-4 font-mono text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 transition-colors ${
              jsonError ? 'border-destructive/60 focus:ring-destructive/40' : 'focus:ring-primary'
            }`}
            placeholder={'{\n  \n}'}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
