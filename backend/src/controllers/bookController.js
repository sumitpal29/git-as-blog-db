const bookService = require('../services/bookService');

function handleErr(err, res, next) {
  if (err.statusCode) return res.status(err.statusCode).json({ success: false, error: err.message });
  next(err);
}

exports.listBooks = async (req, res, next) => {
  try {
    const books = await bookService.listBooks(req.params.projectId);
    res.json({ success: true, data: books });
  } catch (err) { handleErr(err, res, next); }
};

exports.createBook = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Book name is required' });
    const book = await bookService.createBook(req.params.projectId, { name, description });
    res.status(201).json({ success: true, data: book });
  } catch (err) { handleErr(err, res, next); }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await bookService.getBook(req.params.projectId, req.params.bookSlug);
    res.json({ success: true, data: book });
  } catch (err) { handleErr(err, res, next); }
};

exports.deleteBook = async (req, res, next) => {
  try {
    await bookService.deleteBook(req.params.projectId, req.params.bookSlug);
    res.json({ success: true, message: 'Book deleted' });
  } catch (err) { handleErr(err, res, next); }
};

exports.getBookMap = async (req, res, next) => {
  try {
    const map = await bookService.getBookMap(req.params.projectId, req.params.bookSlug);
    res.json({ success: true, data: map });
  } catch (err) { handleErr(err, res, next); }
};

exports.getFile = async (req, res, next) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ success: false, error: 'Query param "path" is required' });
    const file = await bookService.getFile(req.params.projectId, req.params.bookSlug, filePath);
    res.json({ success: true, data: file });
  } catch (err) { handleErr(err, res, next); }
};

exports.saveFile = async (req, res, next) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Body field "path" is required' });
    const file = await bookService.saveFile(req.params.projectId, req.params.bookSlug, filePath, content || '');
    res.json({ success: true, data: file });
  } catch (err) { handleErr(err, res, next); }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ success: false, error: 'Query param "path" is required' });
    await bookService.deleteFile(req.params.projectId, req.params.bookSlug, filePath);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) { handleErr(err, res, next); }
};

exports.createFolder = async (req, res, next) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ success: false, error: 'Body field "path" is required' });
    const folder = await bookService.createFolder(req.params.projectId, req.params.bookSlug, folderPath);
    res.status(201).json({ success: true, data: folder });
  } catch (err) { handleErr(err, res, next); }
};

exports.deleteFolder = async (req, res, next) => {
  try {
    const folderPath = req.query.path;
    if (!folderPath) return res.status(400).json({ success: false, error: 'Query param "path" is required' });
    await bookService.deleteFolder(req.params.projectId, req.params.bookSlug, folderPath);
    res.json({ success: true, message: 'Folder deleted' });
  } catch (err) { handleErr(err, res, next); }
};
