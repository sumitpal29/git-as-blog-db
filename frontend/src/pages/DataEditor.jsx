import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function DataEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract folder and filename from URL search params if editing
  const queryParams = new URLSearchParams(location.search);
  const editFolder = queryParams.get('folder');
  const editFilename = queryParams.get('filename');
  const isNew = !editFolder || !editFilename;

  const [folder, setFolder] = useState(editFolder || '');
  const [filename, setFilename] = useState(editFilename || '');
  const [content, setContent] = useState('{\n  \n}');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadData();
    }
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

  const handleSave = async () => {
    if (!folder.trim() || !filename.trim()) {
      alert('Folder name and file name are required');
      return;
    }
    
    // validate JSON
    try {
      JSON.parse(content);
    } catch (err) {
      alert('Invalid JSON. Please fix formatting before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.data.save(projectId, folder.trim(), filename.trim(), JSON.parse(content));
      if (res.success) {
        navigate(`/project/${projectId}?tab=data`);
      } else {
        alert(res.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save data. Ensure no network errors.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading editor...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 p-6">
      <div className="flex items-center justify-between py-4 z-10 mb-6 border-b">
        <button 
          onClick={() => navigate(`/project/${projectId}?tab=data`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save JSON'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Folder Name</label>
            <input
              type="text"
              placeholder="e.g. config"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={!isNew}
              className="w-full px-3 py-2 border rounded-md disabled:bg-muted"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">File Name</label>
            <input
              type="text"
              placeholder="e.g. profile-config.json"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={!isNew}
              className="w-full px-3 py-2 border rounded-md disabled:bg-muted"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">JSON Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="{\n  \n}"
          />
        </div>
      </div>
    </div>
  );
}
