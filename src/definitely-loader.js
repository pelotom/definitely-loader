require('definitely'); // so it's not seen as extraneous
module.exports = function(source) {
    this.cacheable();
    return `${source}; module.exports = require('definitely').default(module.exports, { whitelist: ["__esModule"] });`;
}