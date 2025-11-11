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
    // Rebuild native modules for target platform
    afterCopy: [
      (buildPath, electronVersion, platform, arch, callback) => {
        const { exec } = require('child_process');
        exec('npm rebuild better-sqlite3 --build-from-source', {
          cwd: buildPath
        }, (error) => {
          if (error) console.error('Rebuild error:', error);
          callback();
        });
      }
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux', 'darwin'],
    },
    // Squirrel maker disabled on Linux (requires Wine/Mono)
    // {
    //   name: '@electron-forge/maker-squirrel',
    //   config: {
    //     name: 'GestionProjet',
    //     authors: 'Alexandre Légaré',
    //     description: 'Application de gestion de projet professionnelle',
    //   },
    // },
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
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
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
