const fsService = require('../services/fsService');
const path = require('path');
const logger = require('../utils/logger');

const EXCLUDED_FOLDERS = ['posts', 'meta'];

exports.listFolders = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const projectPath = fsService.getProjectPath(projectId);
    
    if (!(await fsService.exists(projectPath))) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const folders = await fsService.listDirectories(projectPath);
    const customFolders = folders.filter(f => !EXCLUDED_FOLDERS.includes(f));
    
    res.json({ success: true, data: customFolders });
  } catch (err) {
    next(err);
  }
};

exports.listFiles = async (req, res, next) => {
  try {
    const { projectId, folder } = req.params;
    const folderPath = path.join(fsService.getProjectPath(projectId), folder);
    
    if (!(await fsService.exists(folderPath))) {
      return res.json({ success: true, data: [] });
    }

    const files = await fsService.listFiles(folderPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    res.json({ success: true, data: jsonFiles });
  } catch (err) {
    next(err);
  }
};

exports.getFile = async (req, res, next) => {
  try {
    const { projectId, folder, filename } = req.params;
    const name = filename.endsWith('.json') ? filename : `${filename}.json`;
    const filePath = path.join(fsService.getProjectPath(projectId), folder, name);
    
    if (!(await fsService.exists(filePath))) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const content = await fsService.readFile(filePath);
    let jsonData;
    try {
      jsonData = JSON.parse(content);
    } catch {
      jsonData = content; // raw string fallback
    }
    
    res.json({ success: true, data: jsonData });
  } catch (err) {
    next(err);
  }
};

exports.saveFile = async (req, res, next) => {
  try {
    const { projectId, folder, filename } = req.params;
    const name = filename.endsWith('.json') ? filename : `${filename}.json`;
    const folderPath = path.join(fsService.getProjectPath(projectId), folder);
    const filePath = path.join(folderPath, name);
    
    await fsService.ensureDir(folderPath);
    
    // Expecting body to have { content: ... } or just body is the data
    const contentToSave = req.body.content !== undefined ? req.body.content : req.body;
    let contentString;
    if (typeof contentToSave === 'string') {
       try {
           // check if it's already a valid json string
           JSON.parse(contentToSave);
           contentString = contentToSave;
       } catch {
           contentString = JSON.stringify({ data: contentToSave }, null, 2);
       }
    } else {
       contentString = JSON.stringify(contentToSave, null, 2);
    }

    await fsService.writeFile(filePath, contentString);
    res.json({ success: true, message: 'Saved successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const { projectId, folder, filename } = req.params;
    const name = filename.endsWith('.json') ? filename : `${filename}.json`;
    const filePath = path.join(fsService.getProjectPath(projectId), folder, name);
    
    if (await fsService.exists(filePath)) {
      await fsService.deleteFile(filePath);
    }
    
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};
