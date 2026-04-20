const path = require('path');
const fsService = require('./fsService');
const logger = require('../utils/logger');

const DEFAULT_CONFIG = {
  pageSize: 10,
  sortOrder: 'desc',
  filePrefix: 'list_',
  contentPath: '/posts',
  metaPath: '/meta'
};

class ConfigService {
  /**
   * Create default config for a project
   */
  async createDefaultConfig(projectName) {
    const configPath = path.join(fsService.getProjectPath(projectName), 'config.json');
    await fsService.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }

  /**
   * Load project config. Fallback to default if not found.
   */
  async loadConfig(projectName) {
    const configPath = path.join(fsService.getProjectPath(projectName), 'config.json');
    
    if (!(await fsService.exists(configPath))) {
      logger.warn(`Config missing for project ${projectName}, creating default.`);
      return this.createDefaultConfig(projectName);
    }

    try {
      const content = await fsService.readFile(configPath);
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    } catch (err) {
      logger.error(`Failed to parse config for ${projectName}`, err);
      return DEFAULT_CONFIG; // Safe fallback
    }
  }

  /**
   * Update project config
   */
  async updateConfig(projectName, newConfigData) {
    const configPath = path.join(fsService.getProjectPath(projectName), 'config.json');
    const existingConfig = await this.loadConfig(projectName);
    
    // Merge existing config with new data
    const updatedConfig = { ...existingConfig, ...newConfigData };
    
    await fsService.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  }
}

module.exports = new ConfigService();
