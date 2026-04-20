const gitService = require('../services/gitService');

exports.syncGit = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    
    const result = await gitService.commitAndPush(projectId, message);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};
