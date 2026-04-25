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
    saveFile: async (projectId, bookSlug, filePath, content) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
      });
      return res.json();
    },
    deleteFile: async (projectId, bookSlug, filePath) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/files?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      return res.json();
    },
    createFolder: async (projectId, bookSlug, folderPath) => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/books/${bookSlug}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
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
  }
};
