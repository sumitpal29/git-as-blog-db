import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Save, Loader2, Settings2, Database } from 'lucide-react';

export default function ProjectSettings() {
  const { projectId } = useParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [projectId]);

  const loadConfig = async () => {
    const res = await api.projects.getConfig(projectId);
    if (res.success) setConfig(res.data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await api.projects.updateConfig(projectId, config);
    if (res.success) {
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="animate-spin text-muted-foreground w-6 h-6" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure project generation behaviour</p>
      </div>

      {/* Generation Settings */}
      <section className="bg-card border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">JSON Generation</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Page Size</label>
              <input
                type="number"
                min={1}
                value={config.pageSize}
                onChange={e => setConfig(c => ({ ...c, pageSize: parseInt(e.target.value) || 10 }))}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
              <p className="text-xs text-muted-foreground">Posts per JSON page file</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sort Order</label>
              <select
                value={config.sortOrder}
                onChange={e => setConfig(c => ({ ...c, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              >
                <option value="desc">Newest First (desc)</option>
                <option value="asc">Oldest First (asc)</option>
              </select>
              <p className="text-xs text-muted-foreground">Sorting order for posts by date</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">File Prefix</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={config.filePrefix}
                onChange={e => setConfig(c => ({ ...c, filePrefix: e.target.value }))}
                placeholder="list_"
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
              <span className="text-muted-foreground text-sm whitespace-nowrap">1.json, 2.json...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Resulting files: <code className="bg-muted px-1 rounded">{config.filePrefix}1.json</code>, <code className="bg-muted px-1 rounded">{config.filePrefix}2.json</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Content Path</label>
              <input
                type="text"
                value={config.contentPath}
                onChange={e => setConfig(c => ({ ...c, contentPath: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Meta Path</label>
              <input
                type="text"
                value={config.metaPath}
                onChange={e => setConfig(c => ({ ...c, metaPath: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
