const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// Resolve relative to this file: services/ -> src/ -> backend/ -> projects/
const PROJECT_ROOT = path.join(__dirname, '../../../projects');

class FsService {
  /**
   * Ensure a directory exists.
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      logger.error(`Failed to create directory: ${dirPath}`, err);
      throw err;
    }
  }

  /**
   * Check if a path exists
   */
  async exists(targetPath) {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the absolute path to a project
   */
  getProjectPath(projectName) {
    return path.join(PROJECT_ROOT, projectName);
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      logger.error(`Failed to read file: ${filePath}`, err);
      throw err;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath, content) {
    try {
      // Ensure the parent directory exists
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (err) {
      logger.error(`Failed to write file: ${filePath}`, err);
      throw err;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    try {
      if (await this.exists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      logger.error(`Failed to delete file: ${filePath}`, err);
      throw err;
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(dirPath) {
    try {
      if (!(await this.exists(dirPath))) return [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
        .map(entry => entry.name);
    } catch (err) {
      logger.error(`Failed to list files in ${dirPath}`, err);
      throw err;
    }
  }
  
  /**
   * List all directories inside a path
   */
  async listDirectories(dirPath) {
    try {
      if (!(await this.exists(dirPath))) return [];
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name);
    } catch (err) {
      logger.error(`Failed to list directories in ${dirPath}`, err);
      throw err;
    }
  }
}

module.exports = new FsService();
