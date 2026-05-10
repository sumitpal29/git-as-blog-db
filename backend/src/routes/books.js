const express = require('express');
const router = express.Router({ mergeParams: true });
const c = require('../controllers/bookController');

router.get('/', c.listBooks);
router.post('/', c.createBook);

router.get('/:bookSlug', c.getBook);
router.patch('/:bookSlug', c.updateBook);
router.delete('/:bookSlug', c.deleteBook);
router.get('/:bookSlug/map', c.getBookMap);

router.get('/:bookSlug/files', c.getFile);
router.post('/:bookSlug/files', c.saveFile);
router.patch('/:bookSlug/files', c.renamePage);
router.post('/:bookSlug/files/move', c.moveFile);
router.delete('/:bookSlug/files', c.deleteFile);

router.post('/:bookSlug/folders', c.createFolder);
router.patch('/:bookSlug/folders', c.renameFolder);
router.delete('/:bookSlug/folders', c.deleteFolder);

module.exports = router;
