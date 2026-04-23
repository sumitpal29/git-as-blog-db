const express = require('express');
const router = express.Router({ mergeParams: true });
const dataController = require('../controllers/dataController');

router.get('/', dataController.listFolders);
// Static "rename" sub-paths MUST come before wildcard params
router.put('/:folder/rename', dataController.renameFolder);
router.put('/:folder/:filename/rename', dataController.renameFile);
// Wildcard param routes
router.get('/:folder', dataController.listFiles);
router.get('/:folder/:filename', dataController.getFile);
router.post('/:folder/:filename', dataController.saveFile);
router.put('/:folder/:filename', dataController.saveFile);
router.delete('/:folder/:filename', dataController.deleteFile);

module.exports = router;
