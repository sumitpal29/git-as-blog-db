const express = require('express');
const router = express.Router({ mergeParams: true });
const gitController = require('../controllers/gitController');

router.post('/', gitController.syncGit);

module.exports = router;
