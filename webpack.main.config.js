module.exports = {
  entry: './src/main/index.ts',
  target: 'electron-main',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@': require('path').resolve(__dirname, 'src'),
      '@main': require('path').resolve(__dirname, 'src/main'),
      '@renderer': require('path').resolve(__dirname, 'src/renderer'),
    },
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
