const fsService = require('../services/fsService');
const configService = require('../services/configService');
const logger = require('../utils/logger');
const path = require('path');

exports.listProjects = async (req, res, next) => {
  try {
    const projectsRoot = fsService.getProjectPath('');
    const projects = await fsService.listDirectories(projectsRoot);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const projectName = name.trim();
    const projectPath = fsService.getProjectPath(projectName);

    if (await fsService.exists(projectPath)) {
      return res.status(400).json({ success: false, error: 'Project already exists' });
    }

    // Create folders
    await fsService.ensureDir(projectPath);
    await fsService.ensureDir(path.join(projectPath, 'posts'));
    await fsService.ensureDir(path.join(projectPath, 'meta'));

    // Create default config
    const config = await configService.createDefaultConfig(projectName);

    logger.info(`Created new project: ${projectName}`);
    res.status(201).json({ success: true, data: { name: projectName, config } });
  } catch (err) {
    next(err);
  }
};

exports.getProjectConfig = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectPath = fsService.getProjectPath(projectId);
    
    if (!(await fsService.exists(projectPath))) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const config = await configService.loadConfig(projectId);
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

exports.updateProjectConfig = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectPath = fsService.getProjectPath(projectId);

    if (!(await fsService.exists(projectPath))) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const updatedConfig = await configService.updateConfig(projectId, req.body);
    res.json({ success: true, data: updatedConfig });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectPath = fsService.getProjectPath(projectId);
    
    if (!(await fsService.exists(projectPath))) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const fs = require('fs').promises;
    await fs.rm(projectPath, { recursive: true, force: true });
    
    logger.info(`Deleted project: ${projectId}`);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
