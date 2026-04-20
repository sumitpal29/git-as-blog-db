# Blog Database 📝

A lightweight, Git-backed, zero-database Headless CMS designed for developers.

**Blog Database** turns a public GitHub repository into a fully functional database and CMS. It provides a visual editor (Frontend), a smart local generator (Backend), and a lightweight browser/Node SDK (`@blog-database/client`) to seamlessly fetch and cache your content directly from GitHub's raw CDN.

---

## 🎯 Who is this for?

This product is for **Frontend Developers, Indie Hackers, and Technical Writers** who want a headless CMS without the overhead of renting a database, managing a complex server, or dealing with expensive CMS subscriptions (like Contentful or Sanity).

**Use cases:**
- Personal portfolios and blogs
- Documentation sites
- Changelogs and release notes
- Lightweight marketing pages

## ⚡ How is it different from other products?

Unlike traditional CMS platforms, **Blog Database** has:
1. **Zero Database:** Your database is literally a folder (`/projects`) full of Markdown (`.md`) and JSON files. 
2. **Git is the Source of Truth:** Everything is version-controlled. When you "publish", you are simply pushing Markdown to a public GitHub repo. 
3. **Free & Infinite Scaling:** Because the SDK fetches data directly from `raw.githubusercontent.com`, your API is effectively edge-cached by GitHub for free. You never have to worry about database read/write limits or server downtime.
4. **Local-First Editor:** The CMS editor runs locally on your machine. You write, preview, and generate metadata locally, then push.

---

## 🏗️ Architecture (Monorepo)

The repository is structured as a single monorepo:

- 🎨 **`/frontend`** — A Vite + React application providing the visual interface to manage projects, edit markdown, and publish.
- ⚙️ **`/backend`** — An Express.js server that handles local file generation, front-matter parsing, and Git synchronisation.
- 📁 **`/projects`** — The root data folder. This is where all your blog posts, config, and generated JSON metadata live.
- 📦 **`/packages/client`** — A zero-dependency JavaScript SDK (`@blog-database/client`) to drop into your live website and fetch data easily.

---

## 🚀 Step-by-Step Developer Guide

### 1. Prerequisites
- Node.js (v18+)
- Git configured on your machine
- A public GitHub repository to host the data (e.g., `github.com/yourname/blog_database`)

### 2. Installation
Clone the repo and install dependencies at the root level. Our root setup automatically installs everything for the sub-packages.

```bash
git clone https://github.com/yourname/blog_database.git
cd blog_database

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
2. **Add Content:** Write your articles in the markdown editor. These are saved to your local `/projects/personal_blog/posts/` directory.
3. **Publish (Generate Meta):** When you click "Generate", the backend parses all markdown files and creates paginated JSON records (e.g., `list_1.json`, `index.json`) inside the `/projects/personal_blog/meta/` folder.
4. **Push to GitHub:** Commit the `/projects` directory and push it to your `main` branch on GitHub.

---

## 💻 Consuming your Data (The SDK)

Now that your data is neatly pushed to GitHub, you can consume it on your actual live website (Next.js, React, Vanilla JS, etc.) using the built-in SDK. 

### Why the SDK?
The SDK (`@blog-database/client`) handles pagination, caching, URL building, and front-matter parsing entirely on the client, pulling directly from GitHub.

### Example Usage:

```javascript
import { createBlogClient } from '@blog-database/client';

const client = createBlogClient({
  repo: 'yourname/blog_database', // Your Github repo
  branch: 'main',                 // Your active branch
  project: 'personal_blog'        // The project folder name
});

async function renderBlog() {
  // 1. Fetch paginated list
  const page = await client.getPosts(1);
  console.log('Posts:', page.items);

  // 2. Fetch a specific post
  const post = await client.getPost('my-first-post');
  console.log(`Title: ${post.frontmatter.title}`);
  console.log(`Content: ${post.content}`);

  // 3. Client-side Search
  const results = await client.search('react hooks');
  console.log('Search Results:', results);
}

renderBlog();
```

---

## 🧪 Running Tests

The application has comprehensive automated test suites to ensure data integrity.

```bash
# Run all backend services and API flows
npm run test --prefix backend

# Run frontend tests
npm run test --prefix frontend
```
