const path = require('path');
const fs = require('fs').promises;
const fsService = require('./fsService');

// Slug rules: lowercase alphanumeric, hyphens, underscores. No leading/trailing -_
const NAME_REGEX = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

function validateName(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) return 'Name is required';
  if (name.length > 60) return 'Name must be 60 characters or less';
  if (!NAME_REGEX.test(name)) {
    return 'Name must be lowercase letters, numbers, hyphens, or underscores only — no spaces or special characters';
  }
  return null;
}

function validateFileStem(name) {
  const stem = name.endsWith('.md') ? name.slice(0, -3) : name;
  return validateName(stem);
}

function validatePath(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length === 0) return 'Path is required';
  if (parts.includes('..')) return 'Path cannot contain ".."';
  return null;
}

class BookService {
  getBooksDir(projectName) {
    return path.join(fsService.getProjectPath(projectName), 'books');
  }

  getBookPath(projectName, bookSlug) {
    return path.join(this.getBooksDir(projectName), bookSlug);
  }

  async readIndex(folderAbsPath) {
    const indexPath = path.join(folderAbsPath, 'index.json');
    if (!(await fsService.exists(indexPath))) return null;
    const raw = await fsService.readFile(indexPath);
    return JSON.parse(raw);
  }

  async writeIndex(folderAbsPath, data) {
    const indexPath = path.join(folderAbsPath, 'index.json');
    await fsService.writeFile(indexPath, JSON.stringify(data, null, 2));
  }

  // Add or remove an item from a folder's index.json items array
  async syncFolderIndex(folderAbsPath, action, item) {
    const index = await this.readIndex(folderAbsPath);
    if (!index) return;
    if (action === 'add') {
      if (!index.items.some(i => i.path === item.path)) {
        index.items.push(item);
      }
    } else if (action === 'remove') {
      index.items = index.items.filter(i => i.path !== item.path);
    }
    index.updatedAt = new Date().toISOString();
    await this.writeIndex(folderAbsPath, index);
  }

  async listBooks(projectName) {
    const booksDir = this.getBooksDir(projectName);
    const slugs = await fsService.listDirectories(booksDir);
    const books = [];
    for (const slug of slugs) {
      const index = await this.readIndex(path.join(booksDir, slug));
      if (index) {
        books.push({ slug, name: index.name, description: index.description, createdAt: index.createdAt });
      }
    }
    return books;
  }

  async createBook(projectName, { name, description = '' }) {
    const nameErr = validateName(name);
    if (nameErr) throw Object.assign(new Error(nameErr), { statusCode: 400 });

    const bookPath = this.getBookPath(projectName, name);
    if (await fsService.exists(bookPath)) {
      throw Object.assign(new Error(`Book "${name}" already exists`), { statusCode: 400 });
    }

    await fsService.ensureDir(bookPath);
    const now = new Date().toISOString();
    const indexData = { name, slug: name, description, type: 'book', createdAt: now, updatedAt: now, items: [] };
    await this.writeIndex(bookPath, indexData);
    return indexData;
  }

  async getBook(projectName, bookSlug) {
    const index = await this.readIndex(this.getBookPath(projectName, bookSlug));
    if (!index) throw Object.assign(new Error(`Book "${bookSlug}" not found`), { statusCode: 404 });
    return index;
  }

  async deleteBook(projectName, bookSlug) {
    const bookPath = this.getBookPath(projectName, bookSlug);
    if (!(await fsService.exists(bookPath))) {
      throw Object.assign(new Error(`Book "${bookSlug}" not found`), { statusCode: 404 });
    }
    await fs.rm(bookPath, { recursive: true, force: true });
    return true;
  }

  // Recursively build the tree for a folder
  async buildTree(folderAbsPath) {
    const index = await this.readIndex(folderAbsPath);
    if (!index) return null;
    const items = [];
    for (const item of (index.items || [])) {
      if (item.type === 'folder') {
        const childPath = path.join(folderAbsPath, item.name);
        const childTree = await this.buildTree(childPath);
        items.push({ ...item, items: childTree ? childTree.items : [] });
      } else {
        items.push({ ...item });
      }
    }
    return { ...index, items };
  }

  async getBookMap(projectName, bookSlug) {
    const bookPath = this.getBookPath(projectName, bookSlug);
    const index = await this.readIndex(bookPath);
    if (!index) throw Object.assign(new Error(`Book "${bookSlug}" not found`), { statusCode: 404 });
    const tree = await this.buildTree(bookPath);
    return {
      slug: bookSlug,
      name: index.name,
      description: index.description,
      type: 'book',
      generatedAt: new Date().toISOString(),
      tree,
    };
  }

  async createFolder(projectName, bookSlug, folderPath) {
    const pathErr = validatePath(folderPath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = folderPath.split('/').filter(Boolean);
    for (const part of parts) {
      const err = validateName(part);
      if (err) throw Object.assign(new Error(`Invalid folder name "${part}": ${err}`), { statusCode: 400 });
    }

    const bookPath = this.getBookPath(projectName, bookSlug);
    const newFolderAbs = path.join(bookPath, ...parts);

    if (await fsService.exists(newFolderAbs)) {
      throw Object.assign(new Error(`Folder "${folderPath}" already exists`), { statusCode: 400 });
    }

    await fsService.ensureDir(newFolderAbs);
    const now = new Date().toISOString();
    const folderName = parts[parts.length - 1];
    const folderIndex = { name: folderName, type: 'folder', createdAt: now, updatedAt: now, items: [] };
    await this.writeIndex(newFolderAbs, folderIndex);

    // Update the parent folder's index.json
    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    await this.syncFolderIndex(parentAbs, 'add', {
      type: 'folder',
      name: folderName,
      path: parts.join('/'),
      description: '',
    });

    return folderIndex;
  }

  async deleteFolder(projectName, bookSlug, folderPath) {
    const pathErr = validatePath(folderPath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = folderPath.split('/').filter(Boolean);
    const bookPath = this.getBookPath(projectName, bookSlug);
    const targetAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(targetAbs))) {
      throw Object.assign(new Error(`Folder "${folderPath}" not found`), { statusCode: 404 });
    }

    await fs.rm(targetAbs, { recursive: true, force: true });

    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    await this.syncFolderIndex(parentAbs, 'remove', { path: parts.join('/') });
    return true;
  }

  async saveFile(projectName, bookSlug, filePath, content = '') {
    const pathErr = validatePath(filePath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = filePath.split('/').filter(Boolean);
    const rawName = parts[parts.length - 1];
    const normalizedName = rawName.endsWith('.md') ? rawName : `${rawName}.md`;
    parts[parts.length - 1] = normalizedName;

    const stemErr = validateFileStem(normalizedName);
    if (stemErr) throw Object.assign(new Error(stemErr), { statusCode: 400 });

    const bookPath = this.getBookPath(projectName, bookSlug);
    const fileAbs = path.join(bookPath, ...parts);
    const isNew = !(await fsService.exists(fileAbs));

    await fsService.writeFile(fileAbs, content);

    if (isNew) {
      const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
      const stem = normalizedName.replace('.md', '');
      await this.syncFolderIndex(parentAbs, 'add', {
        type: 'file',
        name: stem,
        path: parts.join('/'),
        description: '',
      });
    }

    return { path: parts.join('/'), content };
  }

  async getFile(projectName, bookSlug, filePath) {
    const pathErr = validatePath(filePath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = filePath.split('/').filter(Boolean);
    const bookPath = this.getBookPath(projectName, bookSlug);
    const fileAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(fileAbs))) {
      throw Object.assign(new Error(`File "${filePath}" not found`), { statusCode: 404 });
    }

    const content = await fsService.readFile(fileAbs);
    return { path: filePath, content };
  }

  async deleteFile(projectName, bookSlug, filePath) {
    const pathErr = validatePath(filePath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = filePath.split('/').filter(Boolean);
    const bookPath = this.getBookPath(projectName, bookSlug);
    const fileAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(fileAbs))) {
      throw Object.assign(new Error(`File "${filePath}" not found`), { statusCode: 404 });
    }

    await fsService.deleteFile(fileAbs);

    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    await this.syncFolderIndex(parentAbs, 'remove', { path: parts.join('/') });
    return true;
  }
}

module.exports = new BookService();
