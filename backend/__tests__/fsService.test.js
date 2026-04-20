const fsService = require('../src/services/fsService');
const fs = require('fs').promises;
const path = require('path');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
  }
}));

describe('FsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should ensure directory exists', async () => {
    fs.mkdir.mockResolvedValue();
    await expect(fsService.ensureDir('/test/path')).resolves.not.toThrow();
    expect(fs.mkdir).toHaveBeenCalledWith('/test/path', { recursive: true });
  });

  it('should check if path exists', async () => {
    fs.access.mockResolvedValue();
    const result = await fsService.exists('/test/path');
    expect(result).toBe(true);
  });

  it('should return false if path does not exist', async () => {
    fs.access.mockRejectedValue(new Error('ENOENT'));
    const result = await fsService.exists('/test/path');
    expect(result).toBe(false);
  });

  it('should read file content', async () => {
    fs.readFile.mockResolvedValue('file content');
    const content = await fsService.readFile('/file.txt');
    expect(content).toBe('file content');
    expect(fs.readFile).toHaveBeenCalledWith('/file.txt', 'utf-8');
  });

  it('should write file content', async () => {
    // Mock exist/mkdir for ensureDir
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    
    await fsService.writeFile('/dir/file.txt', 'new content');
    expect(fs.mkdir).toHaveBeenCalledWith('/dir', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith('/dir/file.txt', 'new content', 'utf-8');
  });
});
