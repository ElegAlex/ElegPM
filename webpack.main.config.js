module.exports = {
  entry: './src/main/index.ts',
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
};
