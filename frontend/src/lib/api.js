const API_BASE = 'http://localhost:4000/api';

export const api = {
  projects: {
    list: async () => {
      const res = await fetch(`${API_BASE}/projects`);
      return res.json();
    },
    create: async (name) => {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return res.json();
    },
    getConfig: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/config`);
      return res.json();
    },
    updateConfig: async (projectId, config) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.json();
    },
    delete: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    rename: async (projectId, newName) => {
      const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });
      return res.json();
    }
  },
  posts: {
    list: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/posts`);
      return res.json();
    },
    get: async (projectId, slug) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/posts/${slug}`);
      return res.json();
    },
    create: async (projectId, postData) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      return res.json();
    },
    update: async (projectId, slug, postData) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      return res.json();
    },
    delete: async (projectId, slug) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/posts/${slug}`, {
        method: 'DELETE',
      });
      return res.json();
    }
  },
  data: {
    listFolders: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data`);
      return res.json();
    },
    listFiles: async (projectId, folder) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${folder}`);
      return res.json();
    },
    get: async (projectId, folder, filename) => {
      // url encode folder and filename in case they have spaces
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`);
      return res.json();
    },
    save: async (projectId, folder, filename, content) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    delete: async (projectId, folder, filename) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    renameFile: async (projectId, folder, filename, newFilename) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFilename }),
      });
      return res.json();
    },
    renameFolder: async (projectId, folder, newFolder) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/data/${encodeURIComponent(folder)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFolder }),
      });
      return res.json();
    }
  },
  books: {
    list: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books`);
      return res.json();
    },
    create: async (projectId, data) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    update: async (projectId, bookSlug, data) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    get: async (projectId, bookSlug) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}`);
      return res.json();
    },
    delete: async (projectId, bookSlug) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}`, { method: 'DELETE' });
      return res.json();
    },
    getMap: async (projectId, bookSlug) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/map`);
      return res.json();
    },
    getFile: async (projectId, bookSlug, filePath) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/files?path=${encodeURIComponent(filePath)}`);
      return res.json();
    },
    saveFile: async (projectId, bookSlug, filePath, content, displayName) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content, displayName }),
      });
      return res.json();
    },
    deleteFile: async (projectId, bookSlug, filePath) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/files?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      return res.json();
    },
    createFolder: async (projectId, bookSlug, folderPath, displayName) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath, displayName }),
      });
      return res.json();
    },
    renameFolder: async (projectId, bookSlug, folderPath, newName) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/folders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath, newName }),
      });
      return res.json();
    },
    deleteFolder: async (projectId, bookSlug, folderPath) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/folders?path=${encodeURIComponent(folderPath)}`, { method: 'DELETE' });
      return res.json();
    },
  },
  actions: {
    generate: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/generate`, { method: 'POST' });
      return res.json();
    },
    sync: async (projectId, message) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      return res.json();
    }
  },
  assets: {
    list: async (projectId) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/assets`);
      return res.json();
    },
    upload: async (projectId, file, { strategy, name } = {}) => {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (strategy) params.set('strategy', strategy);
      if (name) params.set('name', name);
      const qs = params.toString() ? `?${params}` : '';
      const res = await fetch(`${API_BASE}/projects/${projectId}/assets/upload${qs}`, {
        method: 'POST',
        body: form,
      });
      // Return raw response + json so caller can inspect status
      const data = await res.json();
      return { status: res.status, ...data };
    },
    delete: async (projectId, filename) => {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/assets/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );
      return res.json();
    },
  },
};
