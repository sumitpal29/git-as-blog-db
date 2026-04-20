const postService = require('../services/postService');

exports.listPosts = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const slugs = await postService.getAllSlugs(projectId);
    
    // We can fetch just the slugs, or read frontmatter for all
    // Let's read frontmatter for all to return a list
    const posts = await Promise.all(
      slugs.map(async slug => {
        try {
          const post = await postService.getPost(projectId, slug);
          return { slug, frontmatter: post.frontmatter };
        } catch (err) {
          return null; // Handle potential errors gracefully
        }
      })
    );

    res.json({ success: true, data: posts.filter(p => p !== null) });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const { projectId, slug } = req.params;
    const post = await postService.getPost(projectId, slug);
    res.json({ success: true, data: post });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    // req.body contains { title, content, ...metadata }
    const post = await postService.createPost(projectId, req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const { projectId, slug } = req.params;
    // req.body contains { content, metadata }
    const updatedPost = await postService.updatePost(projectId, slug, req.body);
    res.json({ success: true, data: updatedPost });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { projectId, slug } = req.params;
    const deleted = await postService.deletePost(projectId, slug);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};
