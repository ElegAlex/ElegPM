module.exports = {
  packagerConfig: {
    name: 'Gestion de Projet',
    executableName: 'GestionProjet',
    asar: true,
    // Icon will be added later if available
    ignore: [
      /^\/\.webpack($|\/)/,
      /^\/out($|\/)/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux', 'darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/main.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload/index.ts',
                config: './webpack.preload.config.js',
              },
            },
          ],
        },
        packageSourceMaps: false,
      },
    },
  ],
};
