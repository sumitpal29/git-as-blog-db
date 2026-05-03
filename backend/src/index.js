require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const projectRoutes = require('./routes/projects');
const postRoutes = require('./routes/posts');
const generateRoutes = require('./routes/generate');
const gitRoutes = require('./routes/git');
const dataRoutes = require('./routes/data');
const bookRoutes = require('./routes/books');
const assetRoutes = require('./routes/assets');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded project assets as static files
// e.g. GET /projects-static/my-project/assets/photo.png
const PROJECTS_DIR = path.join(__dirname, '../../projects');
app.use('/projects-static', express.static(PROJECTS_DIR));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/posts', postRoutes);
app.use('/api/projects/:projectId/data', dataRoutes);
app.use('/api/projects/:projectId/generate', generateRoutes);
app.use('/api/projects/:projectId/sync', gitRoutes);
app.use('/api/projects/:projectId/books', bookRoutes);
app.use('/api/projects/:projectId/assets', assetRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
