# Static CMS

A lightweight, Git-backed, zero-database Headless CMS designed for developers.

**Static CMS** turns a public GitHub repository into a fully functional database and CMS. It provides a visual editor (Frontend), a smart local generator (Backend), and a lightweight browser/Node SDK (`blog-database-github-client`) to seamlessly fetch and cache your content directly from GitHub's raw CDN.

---

## 🎯 Who is this for?

This product is for **Frontend Developers, Indie Hackers, and Technical Writers** who want a headless CMS without the overhead of renting a database, managing a complex server, or dealing with expensive CMS subscriptions (like Contentful or Sanity).

**Use cases:**
- Personal portfolios and blogs
- Documentation sites and books
- Changelogs and release notes
- Lightweight marketing pages

## ⚡ What can it do?

| Feature | Description |
| --- | --- |
| **Write & edit posts** | Full markdown editor with live preview |
| **Manage books & chapters** | Organise long-form content into books with nested chapters and folders |
| **Upload & organise assets** | Upload images and files; attach them to posts or book pages |
| **Edit structured data** | Edit JSON data files directly in the CMS |
| **Multiple projects** | Manage separate projects (each maps to a folder in `/projects`) |
| **Generate & publish** | One-click metadata generation and Git push to GitHub |

## ⚡ How is it different from other products?

Unlike traditional CMS platforms, **Static CMS** has:

1. **Zero Database:** Your database is literally a folder (`/projects`) full of Markdown (`.md`) and JSON files.
2. **Git is the Source of Truth:** Everything is version-controlled. When you "publish", you are simply pushing Markdown to a public GitHub repo.
3. **Free & Infinite Scaling:** Because the SDK fetches data directly from `raw.githubusercontent.com`, your API is effectively edge-cached by GitHub for free. You never have to worry about database read/write limits or server downtime.
4. **Local-First Editor:** The CMS editor runs locally on your machine. You write, preview, and generate metadata locally, then push.

---

## 🏗️ Architecture (Monorepo)

The repository is structured as a single monorepo:

- 🎨 **`/frontend`** — A Vite + React application providing the visual interface to manage projects, edit markdown, manage books, and publish.
- ⚙️ **`/backend`** — An Express.js server that handles local file generation, front-matter parsing, asset uploads, and Git synchronisation.
- 📁 **`/projects`** — The root data folder. This is where all your posts, books, assets, config, and generated JSON metadata live.
- 📦 **`/packages/client`** — A zero-dependency JavaScript SDK (`blog-database-github-client`) to drop into your live website and fetch data easily.

---

![github as blog database](https://raw.githubusercontent.com/sumitpal29/sumit-pal-portfolio-database/main/sumit-portfolio-website/assets/github-as-cms.png)

---

## 🚀 Step-by-Step Developer Guide

### 1. Prerequisites
- Node.js (v18+)
- Git configured on your machine
- A public GitHub repository to host the data (e.g., `github.com/yourname/my-content`)

### 2. Installation
Clone the repo and install dependencies at the root level. Our root setup automatically installs everything for the sub-packages.

```bash
git clone https://github.com/yourname/static-cms.git
cd static-cms

# Install all dependencies
npm install
```

### 3. Running the CMS Locally
We use `concurrently` to run both the frontend and backend with a single command.

```bash
npm run dev
```

- **Frontend CMS Editor** will start on `http://localhost:5173`
- **Backend API Server** will start on `http://localhost:4000`

### 4. Core Workflow
Once the server is running, navigate to the local Frontend link.

1. **Create a Project:** In the UI, create a project (e.g., `personal_blog`). This creates a `/projects/personal_blog` folder.
2. **Add Content:** Write articles in the markdown editor, or create books with nested chapters. Files are saved to your local `/projects` directory.
3. **Upload Assets:** Use the Assets page to upload images and files for use in your content.
4. **Publish (Generate Meta):** When you click "Generate", the backend parses all markdown files and creates paginated JSON records (e.g., `list_1.json`, `index.json`) inside the `/projects/personal_blog/meta/` folder. Books generate a `map.json` and `books/index.json`.
5. **Push to GitHub:** Commit the `/projects` directory and push it to your `main` branch on GitHub.

---

## 💻 Consuming your Data (The SDK)

Now that your data is neatly pushed to GitHub, you can consume it on your actual live website (Next.js, React, Vanilla JS, etc.) using the built-in SDK.

### Why the SDK?
The SDK (`blog-database-github-client`) handles pagination, caching, URL building, and front-matter parsing entirely on the client, pulling directly from GitHub.

### Example Usage:

```javascript
import { createBlogClient } from 'blog-database-github-client';

const client = createBlogClient({
  repo: 'yourname/my-content', // Your Github repo
  branch: 'main',              // Your active branch
  project: 'personal_blog'     // The project folder name
});

async function renderBlog() {
  // Fetch paginated list of posts
  const page = await client.getPosts(1);
  console.log('Posts:', page.items);

  // Fetch a specific post
  const post = await client.getPost('my-first-post');
  console.log(`Title: ${post.frontmatter.title}`);
  console.log(`Content: ${post.content}`);

  // Client-side search
  const results = await client.search('react hooks');
  console.log('Search Results:', results);

  // List all books
  const books = await client.getBooks();
  console.log('Books:', books);

  // Fetch a book's chapter map
  const map = await client.getBookMap('my-book');

  // Fetch a specific book file/chapter
  const chapter = await client.getBookFile('my-book', 'concepts/overview.md');
  console.log(`Chapter: ${chapter.content}`);
}

renderBlog();
```

---

## 🧪 Running Tests

```bash
# Run backend tests
npm run test --prefix backend

# Run frontend tests
npm run test --prefix frontend

# Run SDK tests
npm run test --prefix packages/client
```
