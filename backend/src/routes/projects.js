const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);

router.get('/:projectId/config', projectController.getProjectConfig);
router.put('/:projectId/config', projectController.updateProjectConfig);
router.put('/:projectId/rename', projectController.renameProject);
router.delete('/:projectId', projectController.deleteProject);

module.exports = router;
