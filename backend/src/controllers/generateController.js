const generateService = require('../services/generateService');
const logger = require('../utils/logger');

exports.generateAPI = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const stats = await generateService.generateProjectMeta(projectId);
    logger.info(`Generated API for project ${projectId}. Total posts: ${stats.totalPosts}`);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
