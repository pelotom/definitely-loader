import { stringifyRequest } from 'loader-utils'

module.exports = function(source) {
    this.cacheable()
    const definitely = stringifyRequest(this, `!!${require.resolve('definitely')}`)
    return `
      ${source};
      var definitely = require(${definitely}).default;
      module.exports = definitely(module.exports, { whitelist: ["__esModule"] });
    `
}
