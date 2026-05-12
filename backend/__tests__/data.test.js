const request = require('supertest');
const express = require('express');
const dataRoutes = require('../src/routes/data');
const fsService = require('../src/services/fsService');

jest.mock('../src/services/fsService');
jest.mock('../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const app = express();
app.use(express.json());
app.use('/api/projects/:projectId/data', dataRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

// ── listFolders ──────────────────────────────────────────────────────────────

describe('GET /api/projects/:projectId/data — listFolders', () => {
  it('returns only top-level custom folders', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(true);
    fsService.listDirectories.mockResolvedValue(['config', 'metadata', 'posts']);

    const res = await request(app).get('/api/projects/proj1/data');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // 'posts' is excluded
    expect(res.body.data).toEqual(['config', 'metadata']);
  });

  it('returns 404 when project does not exist', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/missing');
    fsService.exists.mockResolvedValue(false);

    const res = await request(app).get('/api/projects/missing/data');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns empty array when no custom folders exist', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(true);
    fsService.listDirectories.mockResolvedValue(['posts']);

    const res = await request(app).get('/api/projects/proj1/data');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ── listFiles ────────────────────────────────────────────────────────────────

describe('GET /api/projects/:projectId/data/:folder — listFiles', () => {
  it('returns { files, subfolders } for an existing folder', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(true);
    fsService.listFiles.mockResolvedValue(['settings.json', 'README.md']);
    fsService.listDirectories.mockResolvedValue(['theme', 'icons']);

    const res = await request(app).get('/api/projects/proj1/data/config');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.files).toEqual(['settings.json']); // README.md filtered out
    expect(res.body.data.subfolders).toEqual(['theme', 'icons']);
  });

  it('returns empty files and subfolders when folder does not exist', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(false);

    const res = await request(app).get('/api/projects/proj1/data/nonexistent');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ files: [], subfolders: [] });
  });

  it('filters out non-JSON files from the files list', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(true);
    fsService.listFiles.mockResolvedValue(['a.json', 'b.json', 'c.txt', '.gitkeep']);
    fsService.listDirectories.mockResolvedValue([]);

    const res = await request(app).get('/api/projects/proj1/data/config');

    expect(res.body.data.files).toEqual(['a.json', 'b.json']);
    expect(res.body.data.subfolders).toEqual([]);
  });
});

// ── createSubfolder ──────────────────────────────────────────────────────────

describe('POST /api/projects/:projectId/data/:folder/mkdir — createSubfolder', () => {
  it('creates a subfolder and returns 200 with the name', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();

    const res = await request(app)
      .post('/api/projects/proj1/data/config/mkdir')
      .send({ name: 'theme' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.name).toBe('theme');
    expect(fsService.ensureDir).toHaveBeenCalledWith(
      expect.stringContaining('config/theme')
    );
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/data/config/mkdir')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when name contains a slash', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/data/config/mkdir')
      .send({ name: 'a/b' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/slash/i);
  });

  it('returns 409 when the subfolder already exists', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/projects/proj1/data/config/mkdir')
      .send({ name: 'theme' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('trims whitespace from the subfolder name', async () => {
    fsService.getProjectPath.mockReturnValue('/projects/proj1');
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();

    const res = await request(app)
      .post('/api/projects/proj1/data/config/mkdir')
      .send({ name: '  icons  ' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('icons');
  });
});
