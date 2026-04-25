const request = require('supertest');
const express = require('express');
const bookRoutes = require('../src/routes/books');
const bookService = require('../src/services/bookService');

jest.mock('../src/services/bookService');

const app = express();
app.use(express.json());
// mergeParams needed when mounting under :projectId in real app; simulate with a wrapper
app.use('/api/projects/:projectId/books', bookRoutes);

const BOOK = { slug: 'my-book', name: 'my-book', description: '', type: 'book', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', items: [] };
const MAP = { slug: 'my-book', name: 'my-book', type: 'book', generatedAt: '', tree: { items: [] } };

describe('GET /api/projects/:projectId/books', () => {
  it('returns list of books', async () => {
    bookService.listBooks.mockResolvedValue([BOOK]);
    const res = await request(app).get('/api/projects/proj1/books');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/projects/:projectId/books', () => {
  it('creates a book and returns 201', async () => {
    bookService.createBook.mockResolvedValue(BOOK);
    const res = await request(app).post('/api/projects/proj1/books').send({ name: 'my-book' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('my-book');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/projects/proj1/books').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 on invalid name from service', async () => {
    bookService.createBook.mockRejectedValue(Object.assign(new Error('Name must be lowercase'), { statusCode: 400 }));
    const res = await request(app).post('/api/projects/proj1/books').send({ name: 'My Book' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 if book already exists', async () => {
    bookService.createBook.mockRejectedValue(Object.assign(new Error('already exists'), { statusCode: 400 }));
    const res = await request(app).post('/api/projects/proj1/books').send({ name: 'my-book' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/projects/:projectId/books/:bookSlug', () => {
  it('returns book index', async () => {
    bookService.getBook.mockResolvedValue(BOOK);
    const res = await request(app).get('/api/projects/proj1/books/my-book');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.slug).toBe('my-book');
  });

  it('returns 404 for missing book', async () => {
    bookService.getBook.mockRejectedValue(Object.assign(new Error('not found'), { statusCode: 404 }));
    const res = await request(app).get('/api/projects/proj1/books/missing');
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/projects/:projectId/books/:bookSlug', () => {
  it('deletes book and returns success', async () => {
    bookService.deleteBook.mockResolvedValue(true);
    const res = await request(app).delete('/api/projects/proj1/books/my-book');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/projects/:projectId/books/:bookSlug/map', () => {
  it('returns full book tree', async () => {
    bookService.getBookMap.mockResolvedValue(MAP);
    const res = await request(app).get('/api/projects/proj1/books/my-book/map');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'my-book', type: 'book' });
  });
});

describe('GET /api/projects/:projectId/books/:bookSlug/files', () => {
  it('returns file content', async () => {
    bookService.getFile.mockResolvedValue({ path: 'intro.md', content: '# Hello' });
    const res = await request(app).get('/api/projects/proj1/books/my-book/files?path=intro.md');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.content).toBe('# Hello');
  });

  it('returns 400 when path param is missing', async () => {
    const res = await request(app).get('/api/projects/proj1/books/my-book/files');
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for missing file', async () => {
    bookService.getFile.mockRejectedValue(Object.assign(new Error('not found'), { statusCode: 404 }));
    const res = await request(app).get('/api/projects/proj1/books/my-book/files?path=missing.md');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/projects/:projectId/books/:bookSlug/files', () => {
  it('saves a file and returns result', async () => {
    bookService.saveFile.mockResolvedValue({ path: 'intro.md', content: '# Hello' });
    const res = await request(app)
      .post('/api/projects/proj1/books/my-book/files')
      .send({ path: 'intro.md', content: '# Hello' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.path).toBe('intro.md');
  });

  it('returns 400 when path is missing', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/books/my-book/files')
      .send({ content: '# Hello' });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/projects/:projectId/books/:bookSlug/files', () => {
  it('deletes file', async () => {
    bookService.deleteFile.mockResolvedValue(true);
    const res = await request(app).delete('/api/projects/proj1/books/my-book/files?path=intro.md');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/projects/:projectId/books/:bookSlug/folders', () => {
  it('creates folder', async () => {
    bookService.createFolder.mockResolvedValue({ name: 'chapter-1', type: 'folder', items: [] });
    const res = await request(app)
      .post('/api/projects/proj1/books/my-book/folders')
      .send({ path: 'chapter-1' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('chapter-1');
  });

  it('returns 400 when path is missing', async () => {
    const res = await request(app)
      .post('/api/projects/proj1/books/my-book/folders')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/projects/:projectId/books/:bookSlug/folders', () => {
  it('deletes folder', async () => {
    bookService.deleteFolder.mockResolvedValue(true);
    const res = await request(app).delete('/api/projects/proj1/books/my-book/folders?path=chapter-1');
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 when path is missing', async () => {
    const res = await request(app).delete('/api/projects/proj1/books/my-book/folders');
    expect(res.statusCode).toBe(400);
  });
});
