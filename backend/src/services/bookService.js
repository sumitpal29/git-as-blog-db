const path = require('path');
const fs = require('fs').promises;
const fsService = require('./fsService');

const SLUG_REGEX = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

function generateSlug(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 60) || 'untitled';
}

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) return 'Slug is required';
  if (slug.length > 60) return 'Slug must be 60 characters or less';
  if (!SLUG_REGEX.test(slug)) {
    return 'Slug must be lowercase letters, numbers, hyphens, or underscores only — no spaces';
  }
  return null;
}

function validateFileStem(name) {
  const stem = name.endsWith('.md') ? name.slice(0, -3) : name;
  return validateSlug(stem);
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

  async createBook(projectName, { name, slug, description = '' }) {
    if (!name || !name.trim()) throw Object.assign(new Error('Book name is required'), { statusCode: 400 });

    // Auto-generate slug from name if not provided
    const bookSlug = slug ? slug.trim() : generateSlug(name);
    const slugErr = validateSlug(bookSlug);
    if (slugErr) throw Object.assign(new Error(slugErr), { statusCode: 400 });

    const bookPath = this.getBookPath(projectName, bookSlug);
    if (await fsService.exists(bookPath)) {
      throw Object.assign(new Error(`Book with slug "${bookSlug}" already exists`), { statusCode: 400 });
    }

    await fsService.ensureDir(bookPath);
    const now = new Date().toISOString();
    const indexData = { name: name.trim(), slug: bookSlug, description, type: 'book', createdAt: now, updatedAt: now, items: [] };
    await this.writeIndex(bookPath, indexData);
    return indexData;
  }

  async updateBook(projectName, bookSlug, { name, description }) {
    const bookPath = this.getBookPath(projectName, bookSlug);
    const index = await this.readIndex(bookPath);
    if (!index) throw Object.assign(new Error(`Book "${bookSlug}" not found`), { statusCode: 404 });

    if (name !== undefined) index.name = name.trim() || index.name;
    if (description !== undefined) index.description = description;
    index.updatedAt = new Date().toISOString();
    await this.writeIndex(bookPath, index);
    return index;
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

  async createFolder(projectName, bookSlug, folderPath, displayName) {
    const pathErr = validatePath(folderPath);
    if (pathErr) throw Object.assign(new Error(pathErr), { statusCode: 400 });

    const parts = folderPath.split('/').filter(Boolean);
    for (const part of parts) {
      const err = validateSlug(part);
      if (err) throw Object.assign(new Error(`Invalid folder slug "${part}": ${err}`), { statusCode: 400 });
    }

    const bookPath = this.getBookPath(projectName, bookSlug);
    const newFolderAbs = path.join(bookPath, ...parts);

    if (await fsService.exists(newFolderAbs)) {
      throw Object.assign(new Error(`Folder "${folderPath}" already exists`), { statusCode: 400 });
    }

    await fsService.ensureDir(newFolderAbs);
    const now = new Date().toISOString();
    const folderName = parts[parts.length - 1];
    const folderIndex = { name: folderName, displayName: displayName || folderName, type: 'folder', createdAt: now, updatedAt: now, items: [] };
    await this.writeIndex(newFolderAbs, folderIndex);

    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    await this.syncFolderIndex(parentAbs, 'add', {
      type: 'folder',
      name: folderName,
      displayName: displayName || folderName,
      path: parts.join('/'),
      description: '',
    });

    return folderIndex;
  }

  async renameFolder(projectName, bookSlug, folderPath, newFolderName) {
    const slugErr = validateSlug(newFolderName);
    if (slugErr) throw Object.assign(new Error(slugErr), { statusCode: 400 });

    const parts = folderPath.split('/').filter(Boolean);
    const bookPath = this.getBookPath(projectName, bookSlug);
    const oldAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(oldAbs))) {
      throw Object.assign(new Error(`Folder "${folderPath}" not found`), { statusCode: 404 });
    }

    const newParts = [...parts.slice(0, -1), newFolderName];
    const newFolderPath = newParts.join('/');
    const newAbs = path.join(bookPath, ...newParts);

    if (await fsService.exists(newAbs)) {
      throw Object.assign(new Error(`Folder "${newFolderPath}" already exists`), { statusCode: 400 });
    }

    await fs.rename(oldAbs, newAbs);

    // Update the folder's own index.json name
    const folderIndex = await this.readIndex(newAbs);
    if (folderIndex) {
      folderIndex.name = newFolderName;
      folderIndex.updatedAt = new Date().toISOString();
      await this.writeIndex(newAbs, folderIndex);
    }

    // Update parent's reference to this folder
    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    const parentIndex = await this.readIndex(parentAbs);
    if (parentIndex) {
      parentIndex.items = parentIndex.items.map(item =>
        item.path === folderPath
          ? { ...item, name: newFolderName, path: newFolderPath }
          : item
      );
      parentIndex.updatedAt = new Date().toISOString();
      await this.writeIndex(parentAbs, parentIndex);
    }

    // Fix all child paths that reference the old folder path
    await this.fixAllPaths(newAbs, folderPath, newFolderPath);

    return { oldPath: folderPath, newPath: newFolderPath };
  }

  // Recursively update all item paths in index.json files under folderAbsPath,
  // replacing oldPrefix with newPrefix in each item's path field.
  async fixAllPaths(folderAbsPath, oldPrefix, newPrefix) {
    const index = await this.readIndex(folderAbsPath);
    if (!index) return;

    index.items = index.items.map(item => ({
      ...item,
      path: item.path === oldPrefix
        ? newPrefix
        : item.path.startsWith(oldPrefix + '/')
          ? newPrefix + item.path.slice(oldPrefix.length)
          : item.path,
    }));
    index.updatedAt = new Date().toISOString();
    await this.writeIndex(folderAbsPath, index);

    for (const item of (index.items || [])) {
      if (item.type === 'folder') {
        const subAbs = path.join(folderAbsPath, item.name);
        await this.fixAllPaths(subAbs, oldPrefix, newPrefix);
      }
    }
  }

  async renamePage(projectName, bookSlug, filePath, { displayName, newSlug }) {
    const parts = filePath.split('/').filter(Boolean);
    const bookPath = this.getBookPath(projectName, bookSlug);
    const fileAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(fileAbs))) {
      throw Object.assign(new Error(`File "${filePath}" not found`), { statusCode: 404 });
    }

    const parentAbs = parts.length === 1 ? bookPath : path.join(bookPath, ...parts.slice(0, -1));
    const parentIndex = await this.readIndex(parentAbs);
    if (!parentIndex) throw Object.assign(new Error('Parent folder not found'), { statusCode: 404 });

    const currentStem = parts[parts.length - 1].replace('.md', '');
    const targetStem = newSlug ? newSlug.trim() : currentStem;

    if (newSlug && newSlug.trim() !== currentStem) {
      const slugErr = validateSlug(targetStem);
      if (slugErr) throw Object.assign(new Error(slugErr), { statusCode: 400 });

      const newFileName = `${targetStem}.md`;
      const newParts = [...parts.slice(0, -1), newFileName];
      const newFilePath = newParts.join('/');
      const newFileAbs = path.join(bookPath, ...newParts);

      if (await fsService.exists(newFileAbs)) {
        throw Object.assign(new Error(`A page with slug "${targetStem}" already exists`), { statusCode: 400 });
      }

      await fs.rename(fileAbs, newFileAbs);

      parentIndex.items = parentIndex.items.map(item =>
        item.path === filePath
          ? { ...item, name: targetStem, path: newFilePath, displayName: displayName !== undefined ? displayName : (item.displayName || item.name) }
          : item
      );
      parentIndex.updatedAt = new Date().toISOString();
      await this.writeIndex(parentAbs, parentIndex);

      return { oldPath: filePath, newPath: newFilePath };
    }

    // Only updating displayName, no file rename
    if (displayName !== undefined) {
      parentIndex.items = parentIndex.items.map(item =>
        item.path === filePath ? { ...item, displayName } : item
      );
      parentIndex.updatedAt = new Date().toISOString();
      await this.writeIndex(parentAbs, parentIndex);
    }

    return { oldPath: filePath, newPath: filePath };
  }

  async moveFile(projectName, bookSlug, filePath, targetFolderPath) {
    const parts = filePath.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    const bookPath = this.getBookPath(projectName, bookSlug);
    const fileAbs = path.join(bookPath, ...parts);

    if (!(await fsService.exists(fileAbs))) {
      throw Object.assign(new Error(`File "${filePath}" not found`), { statusCode: 404 });
    }

    const targetParts = targetFolderPath ? targetFolderPath.split('/').filter(Boolean) : [];
    const targetFolderAbs = targetParts.length > 0 ? path.join(bookPath, ...targetParts) : bookPath;

    if (targetParts.length > 0 && !(await fsService.exists(targetFolderAbs))) {
      throw Object.assign(new Error(`Target folder "${targetFolderPath}" not found`), { statusCode: 404 });
    }

    const newFileParts = [...targetParts, fileName];
    const newFilePath = newFileParts.join('/');

    if (newFilePath === filePath) return { path: filePath };

    const newFileAbs = path.join(bookPath, ...newFileParts);
    if (await fsService.exists(newFileAbs)) {
      throw Object.assign(new Error(`A page named "${fileName}" already exists in the target folder`), { statusCode: 400 });
    }

    // Grab the file item metadata before removing it
    const oldParentParts = parts.slice(0, -1);
    const oldParentAbs = oldParentParts.length > 0 ? path.join(bookPath, ...oldParentParts) : bookPath;
    const oldParentIndex = await this.readIndex(oldParentAbs);
    const fileItem = oldParentIndex?.items.find(i => i.path === filePath);

    await fs.rename(fileAbs, newFileAbs);

    await this.syncFolderIndex(oldParentAbs, 'remove', { path: filePath });
    await this.syncFolderIndex(targetFolderAbs, 'add', {
      type: 'file',
      name: fileItem?.name || fileName.replace('.md', ''),
      displayName: fileItem?.displayName || fileItem?.name || fileName.replace('.md', ''),
      path: newFilePath,
      description: fileItem?.description || '',
    });

    return { oldPath: filePath, newPath: newFilePath };
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

  async saveFile(projectName, bookSlug, filePath, content = '', displayName) {
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
        displayName: displayName || stem,
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
module.exports.generateSlug = generateSlug;
