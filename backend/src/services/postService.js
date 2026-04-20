const matter = require('gray-matter');
const path = require('path');
const fsService = require('./fsService');
const configService = require('./configService');
const { generateSlug } = require('../utils/slugify');

class PostService {
  async getPostPath(projectName, slug) {
    const config = await configService.loadConfig(projectName);
    return path.join(fsService.getProjectPath(projectName), config.contentPath, `${slug}.md`);
  }

  async getAllSlugs(projectName) {
    const config = await configService.loadConfig(projectName);
    const postsDir = path.join(fsService.getProjectPath(projectName), config.contentPath);
    const files = await fsService.listFiles(postsDir);
    return files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
  }

  async createPost(projectName, data) {
    const { title, content, ...metadata } = data;
    const slug = metadata.slug || generateSlug(title);
    
    const postPath = await this.getPostPath(projectName, slug);
    if (await fsService.exists(postPath)) {
      throw new Error(`Post with slug ${slug} already exists`);
    }

    const mData = {
      title,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata
    };

    const fileContent = matter.stringify(content || '', mData);
    await fsService.writeFile(postPath, fileContent);

    return { slug, frontmatter: mData, content: content || '' };
  }

  async getPost(projectName, slug) {
    const postPath = await this.getPostPath(projectName, slug);
    if (!(await fsService.exists(postPath))) {
      throw new Error(`Post ${slug} not found`);
    }

    const rawContent = await fsService.readFile(postPath);
    const { data: frontmatter, content } = matter(rawContent);
    return { slug, frontmatter, content };
  }

  async updatePost(projectName, slug, updateData) {
    const post = await this.getPost(projectName, slug);
    
    // Merge new metadata, update timestamp
    const updatedFrontmatter = {
      ...post.frontmatter,
      ...updateData.metadata,
      updatedAt: new Date().toISOString()
    };
    
    // If title changed and we want to change slug, we'd handle it here. 
    // For simplicity, we keep the original slug or if new slug is provided, we rename.
    const newSlug = updateData.metadata?.slug || slug;
    const newContent = updateData.content !== undefined ? updateData.content : post.content;

    const newPostPath = await this.getPostPath(projectName, newSlug);
    const fileContent = matter.stringify(newContent, updatedFrontmatter);
    
    const oldPostPath = await this.getPostPath(projectName, slug);
    
    // Write new file
    await fsService.writeFile(newPostPath, fileContent);
    
    // Delete old file if slug changed
    if (newSlug !== slug) {
      await fsService.deleteFile(oldPostPath);
    }

    return { slug: newSlug, frontmatter: updatedFrontmatter, content: newContent };
  }

  async deletePost(projectName, slug) {
    const postPath = await this.getPostPath(projectName, slug);
    if (await fsService.exists(postPath)) {
      await fsService.deleteFile(postPath);
      return true;
    }
    return false;
  }
}

module.exports = new PostService();
