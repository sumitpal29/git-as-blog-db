const simpleGit = require('simple-git');
const fsService = require('./fsService');
const configService = require('./configService');
const logger = require('../utils/logger');

class GitService {
  async initRepo(projectName) {
    const projectPath = fsService.getProjectPath(projectName);
    const git = simpleGit(projectPath);
    
    // Instead of git.checkIsRepo(), explicitly check for a local .git folder.
    // Otherwise, checkIsRepo() traverses upwards, finds the parent monorepo, 
    // and returns true without initializing a nested repo.
    const isLocalRepo = await fsService.exists(require('path').join(projectPath, '.git'));
    
    if (!isLocalRepo) {
      await git.init();
      logger.info(`Initialized git repository in ${projectPath}`);
    }
    return git;
  }

  async commitAndPush(projectName, message) {
    try {
      const config = await configService.loadConfig(projectName);
      const gitCfg = config.git || {};

      // Use commit message from payload → git config → default
      const commitMsg = message || gitCfg.commitMessage || 'Update blog data';
      const targetBranch = gitCfg.branch || 'main';
      const remoteUrl = gitCfg.remoteUrl || '';

      const git = await this.initRepo(projectName);

      // If a remote URL is configured in settings, add/update it
      if (remoteUrl) {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        if (!origin) {
          await git.addRemote('origin', remoteUrl);
          logger.info(`Added remote origin: ${remoteUrl}`);
        } else if (origin.refs.push !== remoteUrl) {
          await git.removeRemote('origin');
          await git.addRemote('origin', remoteUrl);
          logger.info(`Updated remote origin to: ${remoteUrl}`);
        }
      }

      // Stage all
      await git.add('.');

      // Check if clean
      const status = await git.status();
      if (status.isClean()) {
        return { success: true, message: 'No changes to commit' };
      }

      // Commit
      const commitResult = await git.commit(commitMsg);
      logger.info(`Committed: ${commitResult.commit}`);

      // Push
      const currentRemotes = await git.getRemotes();
      if (currentRemotes.length > 0) {
        await git.push('origin', targetBranch, { '--set-upstream': null });
        logger.info(`Pushed to origin/${targetBranch}`);
        return { success: true, message: `Committed & pushed to origin/${targetBranch}` };
      }

      return { success: true, message: 'Changes committed locally (no remote configured)' };
    } catch (err) {
      logger.error(`Git sync failed for ${projectName}`, err);
      throw new Error(`Git sync failed: ${err.message}`);
    }
  }
}

module.exports = new GitService();
