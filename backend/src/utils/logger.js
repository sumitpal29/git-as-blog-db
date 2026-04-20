const util = require('util');

const logger = {
  info: (msg, meta = '') => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? util.inspect(meta, { depth: null, colors: true }) : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? util.inspect(meta, { depth: null, colors: true }) : '');
  },
  error: (msg, err = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
    if (err) {
      console.error(err.stack || err);
    }
  }
};

module.exports = logger;
