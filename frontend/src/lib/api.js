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
    }
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
