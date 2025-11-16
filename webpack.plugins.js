const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    typescript: {
      diagnosticOptions: {
        semantic: true,
        syntactic: false,
      },
      // Ignore unused variable warnings for build
      configOverwrite: {
        compilerOptions: {
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    },
  }),
];
