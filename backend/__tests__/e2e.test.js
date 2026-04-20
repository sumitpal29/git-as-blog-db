const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const projectRoutes = require('../src/routes/projects');
const postRoutes = require('../src/routes/posts');
const generateRoutes = require('../src/routes/generate');

const fsService = require('../src/services/fsService');

const app = express();
app.use(express.json());

app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/posts', postRoutes);
app.use('/api/projects/:projectId/generate', require('../src/routes/generate'));

const TEST_PROJECTS_DIR = path.join(__dirname, 'test-projects-data');

describe('E2E Integration Tests', () => {
  let originalGetProjectPath;

  beforeAll(async () => {
    // Override where projects are stored
    originalGetProjectPath = fsService.getProjectPath;
    jest.spyOn(fsService, 'getProjectPath').mockImplementation((projectName) => {
      return path.join(TEST_PROJECTS_DIR, projectName);
    });

    // Create base test dir
    await fsService.ensureDir(TEST_PROJECTS_DIR);
  });

  afterAll(async () => {
    // Restore and cleanup
    jest.restoreAllMocks();
    await fs.rm(TEST_PROJECTS_DIR, { recursive: true, force: true });
  });

  it('1. Should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'e2e-project' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('e2e-project');
  });

  it('2. Should retrieve the project list', async () => {
    // Using spyOn we need to also mock listDirectories because by default it reads PROJECT_ROOT directly
    jest.spyOn(fsService, 'listDirectories').mockResolvedValueOnce(['e2e-project']);

    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('e2e-project');
  });

  it('3. Should add a new post (content)', async () => {
    const postPayload = {
      title: 'My First Integration Post',
      description: 'Testing the whole flow',
      slug: 'first-e2e-post',
      content: 'This is the main markdown body.',
      draft: false
    };

    const res = await request(app)
      .post('/api/projects/e2e-project/posts')
      .send(postPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('first-e2e-post');
    expect(res.body.data.content).toBe('This is the main markdown body.');
  });

  it('4. Should publish/generate the meta JSON', async () => {
    const res = await request(app)
      .post('/api/projects/e2e-project/generate');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // It should have generated 1 post
    expect(res.body.data.totalPosts).toBe(1);
    expect(res.body.data.totalPages).toBe(1);
    expect(res.body.data.pages).toContain('list_1.json');
  });

  it('5. Should have actually written the generated list_1.json to disk', async () => {
    const list1Path = path.join(TEST_PROJECTS_DIR, 'e2e-project', 'meta', 'list_1.json');
    const content = await fs.readFile(list1Path, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.totalPosts).toBe(1);
    expect(parsed.items[0].slug).toBe('first-e2e-post');
    expect(parsed.items[0].title).toBe('My First Integration Post');
    expect(parsed.items[0].draft).toBe(false);
  });
});
