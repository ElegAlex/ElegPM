const plugins = require('./webpack.plugins');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

const rules = [
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.css$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      { loader: 'postcss-loader' },
    ],
  },
  {
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  },
];

module.exports = {
  target: 'electron-renderer',
  externalsPresets: { node: false },
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new NodePolyfillPlugin({
      excludeAliases: ['console']
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.mjs'],
    alias: {
      '@': require('path').resolve(__dirname, 'src'),
      '@main': require('path').resolve(__dirname, 'src/main'),
      '@renderer': require('path').resolve(__dirname, 'src/renderer'),
    },
    fallback: {
      'fs': false,
      'path': require.resolve('path-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'stream': require.resolve('stream-browserify'),
      'buffer': require.resolve('buffer/'),
      'process': require.resolve('process/browser'),
      'vm': false,
      'module': false,
    },
  },
};
