/* config-overrides.js */

const { override, addWebpackAlias } = require('customize-cra');
const addLessLoader = require('customize-cra-less-loader');
const path = require('path');

module.exports = override(
  addLessLoader({
    lessLoaderOptions: {
      lessOptions: {
        javascriptEnabled: true,
      },
    },
  }),
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  })
);