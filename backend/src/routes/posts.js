const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access projectId from parent route
const postController = require('../controllers/postController');

router.get('/', postController.listPosts);
router.post('/', postController.createPost);

router.get('/:slug', postController.getPost);
router.put('/:slug', postController.updatePost);
router.delete('/:slug', postController.deletePost);

module.exports = router;
