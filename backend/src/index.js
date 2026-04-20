require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const projectRoutes = require('./routes/projects');
const postRoutes = require('./routes/posts');
const generateRoutes = require('./routes/generate');
const gitRoutes = require('./routes/git');
const dataRoutes = require('./routes/data');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/posts', postRoutes);
app.use('/api/projects/:projectId/data', dataRoutes);
app.use('/api/projects/:projectId/generate', generateRoutes);
app.use('/api/projects/:projectId/sync', gitRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
