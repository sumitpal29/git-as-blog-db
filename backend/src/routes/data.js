const express = require('express');
const router = express.Router({ mergeParams: true });
const dataController = require('../controllers/dataController');

router.get('/', dataController.listFolders);
router.get('/:folder', dataController.listFiles);
router.get('/:folder/:filename', dataController.getFile);
router.post('/:folder/:filename', dataController.saveFile);
router.put('/:folder/:filename', dataController.saveFile);
router.delete('/:folder/:filename', dataController.deleteFile);

module.exports = router;
