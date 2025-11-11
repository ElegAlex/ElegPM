module.exports = {
  packagerConfig: {
    name: 'GestionProjet',
    executableName: 'gestion-projet',
    asar: true,
    icon: './assets/icon', // Will look for icon.ico on Windows, icon.icns on macOS, icon.png on Linux
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'GestionProjet',
        setupIcon: './assets/icon.ico',
        loadingGif: './assets/loading.gif',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
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
      },
    },
  ],
};
