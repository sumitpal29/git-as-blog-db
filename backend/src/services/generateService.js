const path = require('path');
const fsService = require('./fsService');
const configService = require('./configService');
const postService = require('./postService');

class GenerateService {
  async generateProjectMeta(projectName) {
    const config = await configService.loadConfig(projectName);
    const metaDir = path.join(fsService.getProjectPath(projectName), config.metaPath);

    // 1. Read all posts
    const slugs = await postService.getAllSlugs(projectName);
    const posts = [];
    for (const slug of slugs) {
      try {
        const post = await postService.getPost(projectName, slug);
        // 2. Filter drafts
        if (post.frontmatter.draft !== true) {
          posts.push({
            slug,
            ...post.frontmatter
          });
        }
      } catch (err) {
        // Log skip
      }
    }

    // 3. Sort
    // Sort logic - assume config.sortOrder is 'asc' or 'desc'. Sort by date (createdAt).
    posts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return config.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // 4. Clean meta directory
    const existingMetaFiles = await fsService.listFiles(metaDir);
    for (const file of existingMetaFiles) {
      if (file.endsWith('.json')) {
        await fsService.deleteFile(path.join(metaDir, file));
      }
    }

    // 5. Paginate and Generate list_*.json
    const pageSize = config.pageSize || 10;
    const prefix = config.filePrefix || 'list_';
    
    const pages = [];
    for (let i = 0; i < posts.length; i += pageSize) {
      const pageNumber = Math.floor(i / pageSize) + 1;
      const chunk = posts.slice(i, i + pageSize);
      const fileName = `${prefix}${pageNumber}.json`;
      const filePath = path.join(metaDir, fileName);
      
      const payload = {
        page: pageNumber,
        totalPosts: posts.length,
        items: chunk
      };
      
      await fsService.writeFile(filePath, JSON.stringify(payload, null, 2));
      pages.push(fileName);
    }

    // Generate index.json (master file)
    const indexPayload = {
      totalPosts: posts.length,
      totalPages: pages.length,
      pages,
      generatedAt: new Date().toISOString()
    };
    await fsService.writeFile(path.join(metaDir, 'index.json'), JSON.stringify(indexPayload, null, 2));

    return indexPayload;
  }
}

module.exports = new GenerateService();
