const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname });
module.exports = compat.fromConfig(require('./.eslintrc.json'));
