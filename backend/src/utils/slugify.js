const slugifyLib = require('slugify');

const generateSlug = (title) => {
  return slugifyLib(title, {
    replacement: '-',  // replace spaces with replacement character, defaults to `-`
    remove: /[*+~.()'"!:@]/g, // remove characters that match regex, defaults to `undefined`
    lower: true,      // convert to lower case, defaults to `false`
    strict: true,     // strip special characters except replacement, defaults to `false`
    trim: true         // trim leading and trailing replacement chars, defaults to `true`
  });
};

module.exports = { generateSlug };
