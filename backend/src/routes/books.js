const express = require('express');
const router = express.Router({ mergeParams: true });
const c = require('../controllers/bookController');

router.get('/', c.listBooks);
router.post('/', c.createBook);

router.get('/:bookSlug', c.getBook);
router.delete('/:bookSlug', c.deleteBook);
router.get('/:bookSlug/map', c.getBookMap);

router.get('/:bookSlug/files', c.getFile);
router.post('/:bookSlug/files', c.saveFile);
router.delete('/:bookSlug/files', c.deleteFile);

router.post('/:bookSlug/folders', c.createFolder);
router.delete('/:bookSlug/folders', c.deleteFolder);

module.exports = router;
