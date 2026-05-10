const path = require('path');

// Mock fsService before requiring bookService
jest.mock('../src/services/fsService', () => ({
  getProjectPath: jest.fn(() => '/projects/test-project'),
  exists: jest.fn(),
  ensureDir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  listDirectories: jest.fn(),
  listFiles: jest.fn(),
}));

// Mock fs.rm
jest.mock('fs', () => ({
  promises: {
    rm: jest.fn(),
  },
}));

const fsService = require('../src/services/fsService');
const bookService = require('../src/services/bookService');

const BOOK_PATH = '/projects/test-project/books/my-book';
const makeIndex = (overrides = {}) => ({
  name: 'my-book',
  slug: 'my-book',
  description: '',
  type: 'book',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  items: [],
  ...overrides,
});

describe('BookService — name validation', () => {
  const { validateName } = bookService; // Not exported; test indirectly via createBook

  it('rejects empty name', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.createBook('p', { name: '' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects name with spaces', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.createBook('p', { name: 'my book' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects uppercase', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.createBook('p', { name: 'MyBook' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects special characters', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.createBook('p', { name: 'book!' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects name longer than 60 chars', async () => {
    fsService.exists.mockResolvedValue(false);
    const long = 'a'.repeat(61);
    await expect(bookService.createBook('p', { name: long })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts valid slug: lowercase-hyphenated', async () => {
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();
    fsService.writeFile.mockResolvedValue();
    await expect(bookService.createBook('p', { name: 'my-book' })).resolves.toMatchObject({ slug: 'my-book' });
  });

  it('accepts valid slug with underscores', async () => {
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();
    fsService.writeFile.mockResolvedValue();
    await expect(bookService.createBook('p', { name: 'api_v2' })).resolves.toMatchObject({ slug: 'api_v2' });
  });
});

describe('BookService — createBook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates book directory and index.json', async () => {
    fsService.exists.mockResolvedValue(false);
    fsService.ensureDir.mockResolvedValue();
    fsService.writeFile.mockResolvedValue();

    const result = await bookService.createBook('test-project', { name: 'my-book', description: 'A test book' });

    expect(fsService.ensureDir).toHaveBeenCalledWith(expect.stringContaining('my-book'));
    expect(fsService.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('index.json'),
      expect.stringContaining('"slug": "my-book"')
    );
    expect(result).toMatchObject({ slug: 'my-book', type: 'book', description: 'A test book' });
  });

  it('throws 400 if book already exists', async () => {
    fsService.exists.mockResolvedValue(true);
    await expect(bookService.createBook('test-project', { name: 'my-book' }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('already exists') });
  });
});

describe('BookService — listBooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns list of books from directory slugs', async () => {
    fsService.listDirectories.mockResolvedValue(['book-a', 'book-b']);
    fsService.exists.mockResolvedValue(true);
    fsService.readFile
      .mockResolvedValueOnce(JSON.stringify(makeIndex({ name: 'book-a', slug: 'book-a' })))
      .mockResolvedValueOnce(JSON.stringify(makeIndex({ name: 'book-b', slug: 'book-b' })));

    const result = await bookService.listBooks('test-project');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ slug: 'book-a' });
  });

  it('returns empty array when books directory is empty', async () => {
    fsService.listDirectories.mockResolvedValue([]);
    const result = await bookService.listBooks('test-project');
    expect(result).toEqual([]);
  });
});

describe('BookService — getBook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns index data for existing book', async () => {
    fsService.exists.mockResolvedValue(true);
    fsService.readFile.mockResolvedValue(JSON.stringify(makeIndex()));

    const result = await bookService.getBook('test-project', 'my-book');
    expect(result).toMatchObject({ slug: 'my-book', type: 'book' });
  });

  it('throws 404 for missing book', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.getBook('test-project', 'missing'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('BookService — getBookMap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns tree with nested items', async () => {
    const rootIndex = makeIndex({
      items: [
        { type: 'folder', name: 'chapter-1', path: 'chapter-1', description: '' },
        { type: 'file', name: 'intro', path: 'intro.md', description: '' },
      ],
    });
    const chapterIndex = {
      name: 'chapter-1', type: 'folder', createdAt: '', updatedAt: '',
      items: [{ type: 'file', name: 'setup', path: 'chapter-1/setup.md', description: '' }],
    };

    fsService.exists
      .mockResolvedValueOnce(true)  // root index.json exists
      .mockResolvedValueOnce(true); // chapter index.json exists
    fsService.readFile
      .mockResolvedValueOnce(JSON.stringify(rootIndex))
      .mockResolvedValueOnce(JSON.stringify(rootIndex))   // buildTree reads root
      .mockResolvedValueOnce(JSON.stringify(chapterIndex)); // buildTree reads chapter

    const map = await bookService.getBookMap('test-project', 'my-book');
    expect(map).toMatchObject({ slug: 'my-book', type: 'book' });
    expect(map.tree.items).toHaveLength(2);
  });
});

describe('BookService — createFolder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates folder and updates parent index', async () => {
    // First exists() = the new folder (false = doesn't exist yet)
    // Second exists() = parent's index.json (true = exists so syncFolderIndex can read it)
    fsService.exists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    fsService.ensureDir.mockResolvedValue();
    fsService.writeFile.mockResolvedValue();
    fsService.readFile.mockResolvedValue(JSON.stringify(makeIndex()));

    const result = await bookService.createFolder('test-project', 'my-book', 'chapter-1');
    expect(result).toMatchObject({ name: 'chapter-1', type: 'folder' });
    expect(fsService.ensureDir).toHaveBeenCalled();
    expect(fsService.writeFile).toHaveBeenCalledTimes(2); // folder index.json + parent index.json
  });

  it('rejects invalid folder name', async () => {
    await expect(bookService.createFolder('p', 'b', 'Chapter One'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects path traversal attempt', async () => {
    await expect(bookService.createFolder('p', 'b', '../escape'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 if folder already exists', async () => {
    fsService.exists.mockResolvedValue(true);
    await expect(bookService.createFolder('p', 'b', 'chapter-1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('BookService — saveFile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a new .md file and updates parent index', async () => {
    fsService.exists.mockResolvedValue(false);
    fsService.writeFile.mockResolvedValue();
    fsService.readFile.mockResolvedValue(JSON.stringify(makeIndex()));

    const result = await bookService.saveFile('test-project', 'my-book', 'intro.md', '# Hello');
    expect(result).toMatchObject({ path: 'intro.md', content: '# Hello' });
    expect(fsService.writeFile).toHaveBeenCalledWith(expect.stringContaining('intro.md'), '# Hello');
  });

  it('auto-appends .md extension', async () => {
    fsService.exists.mockResolvedValue(false);
    fsService.writeFile.mockResolvedValue();
    fsService.readFile.mockResolvedValue(JSON.stringify(makeIndex()));

    const result = await bookService.saveFile('test-project', 'my-book', 'overview', '# Overview');
    expect(result.path).toBe('overview.md');
  });

  it('updates existing file without re-adding to index', async () => {
    fsService.exists.mockResolvedValue(true); // file exists
    fsService.writeFile.mockResolvedValue();

    await bookService.saveFile('test-project', 'my-book', 'intro.md', '# Updated');
    // writeFile called once (content only), not twice (no index sync)
    expect(fsService.writeFile).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid file name', async () => {
    await expect(bookService.saveFile('p', 'b', 'My File.md', ''))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects path traversal', async () => {
    await expect(bookService.saveFile('p', 'b', '../escape.md', ''))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('BookService — deleteFile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes file and updates parent index', async () => {
    fsService.exists.mockResolvedValue(true);
    fsService.deleteFile.mockResolvedValue();
    fsService.readFile.mockResolvedValue(
      JSON.stringify(makeIndex({ items: [{ type: 'file', name: 'intro', path: 'intro.md' }] }))
    );
    fsService.writeFile.mockResolvedValue();

    await bookService.deleteFile('test-project', 'my-book', 'intro.md');
    expect(fsService.deleteFile).toHaveBeenCalledWith(expect.stringContaining('intro.md'));
  });

  it('throws 404 if file does not exist', async () => {
    fsService.exists.mockResolvedValue(false);
    await expect(bookService.deleteFile('p', 'b', 'missing.md'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
