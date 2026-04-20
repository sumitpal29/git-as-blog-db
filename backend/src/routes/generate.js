const express = require('express');
const router = express.Router({ mergeParams: true });
const generateController = require('../controllers/generateController');

router.post('/', generateController.generateAPI);

module.exports = router;
