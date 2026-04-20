const request = require('supertest');
const express = require('express');
const projectRoutes = require('../src/routes/projects');
const fsService = require('../src/services/fsService');

// Mock services
jest.mock('../src/services/fsService');
jest.mock('../src/services/configService');

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

describe('Project APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/projects should return list of projects', async () => {
    fsService.listDirectories.mockResolvedValue(['project1', 'project2']);
    
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(['project1', 'project2']);
  });

  it('POST /api/projects should create a new project', async () => {
    fsService.getProjectPath.mockReturnValue('/path/new-project');
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();
    
    const configService = require('../src/services/configService');
    configService.createDefaultConfig.mockResolvedValue({ pageSize: 10 });

    const res = await request(app).post('/api/projects').send({ name: 'new-project' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('new-project');
  });

  it('POST /api/projects should fail if no name provided', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Project name is required');
  });
});
