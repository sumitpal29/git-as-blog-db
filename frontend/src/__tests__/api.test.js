import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../lib/api';

// Polyfill fetch for tests
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('projects.list() should call the correct endpoint', async () => {
    const mockReponse = { success: true, data: ['project1', 'project2'] };
    fetch.mockResolvedValueOnce({
      json: async () => mockReponse,
    });

    const res = await api.projects.list();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/projects');
    expect(res).toEqual(mockReponse);
  });

  it('projects.create() should format body correctly', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { name: 'test-project' } }),
    });

    await api.projects.create('test-project');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-project' }),
    });
  });
});
