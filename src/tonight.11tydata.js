const p = require('../lib/pages.js');
module.exports = { eleventyComputed: { faqs: () => p.tonightFaq() } };
