const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsService = require('../services/fsService');

const router = express.Router({ mergeParams: true });

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'image/webp', 'image/svg+xml', 'image/avif',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function getAssetsDir(projectId) {
  return path.join(fsService.getProjectPath(projectId), 'assets');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Slugify the filename: "My Photo (1).PNG" → "my-photo-1.png"
function sanitizeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')        // trim leading/trailing dashes
    || 'image';
  return `${slug}${ext}`;
}

function suggestCopyName(filename, existingNames) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let n = 1;
  let candidate;
  do {
    candidate = `${base}-copy-${n}${ext}`;
    n++;
  } while (existingNames.has(candidate));
  return candidate;
}

// GET /api/projects/:projectId/assets
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  const assetsDir = getAssetsDir(projectId);
  try {
    await fsService.ensureDir(assetsDir);
    const entries = await fs.readdir(assetsDir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter(e => e.isFile() && !e.name.startsWith('.'))
        .map(async (e) => {
          const stat = await fs.stat(path.join(assetsDir, e.name));
          return {
            name: e.name,
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            createdAt: stat.birthtime,
          };
        })
    );
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:projectId/assets/upload
// Query: ?strategy=replace  |  ?strategy=copy&name=newname.png
router.post('/upload', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const { strategy, name: copyName } = req.query;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const assetsDir = getAssetsDir(projectId);
  await fsService.ensureDir(assetsDir);

  // Sanitize: slugify base name, lowercase extension
  const sanitizedName = sanitizeFilename(
    copyName && strategy === 'copy' ? copyName : req.file.originalname
  );

  const entries = await fs.readdir(assetsDir, { withFileTypes: true });
  const existingNames = new Set(entries.filter(e => e.isFile()).map(e => e.name));

  let finalName = sanitizedName;

  if (existingNames.has(sanitizedName)) {
    if (!strategy) {
      // Conflict — return info so frontend can show modal
      const existingStat = await fs.stat(path.join(assetsDir, sanitizedName));
      const suggested = suggestCopyName(sanitizedName, existingNames);
      return res.status(409).json({
        success: false,
        conflict: true,
        existing: {
          name: sanitizedName,
          size: existingStat.size,
          sizeFormatted: formatBytes(existingStat.size),
        },
        incoming: {
          size: req.file.size,
          sizeFormatted: formatBytes(req.file.size),
        },
        suggestedCopyName: suggested,
      });
    }
    if (strategy === 'copy') {
      // sanitize whatever name the user typed, fall back to auto-suggestion
      finalName = copyName
        ? sanitizeFilename(copyName)
        : suggestCopyName(sanitizedName, existingNames);
    }
    // strategy === 'replace' → keep finalName = sanitizedName (overwrites)
  }

  const destPath = path.join(assetsDir, finalName);
  await fs.writeFile(destPath, req.file.buffer);
  const stat = await fs.stat(destPath);

  res.json({
    success: true,
    data: {
      name: finalName,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      createdAt: stat.birthtime,
    },
  });
});

// DELETE /api/projects/:projectId/assets/:filename
router.delete('/:filename', async (req, res) => {
  const { projectId, filename } = req.params;
  const filePath = path.join(getAssetsDir(projectId), filename);
  try {
    if (!(await fsService.exists(filePath))) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
