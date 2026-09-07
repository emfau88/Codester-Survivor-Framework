import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const pagesBuild = mode === 'pages';
  const standaloneBuild = mode === 'standalone';
  const releaseBuild = mode === 'release';
  const gameOnlyBuild = standaloneBuild || releaseBuild;
  const outputDirectory = pagesBuild
    ? 'dist-pages'
    : standaloneBuild
      ? 'dist-standalone'
      : releaseBuild ? 'dist-release' : 'dist';

  return {
    base: pagesBuild ? '/RoosterRage/' : './',
    publicDir: gameOnlyBuild ? false : 'public',
    plugins: gameOnlyBuild ? [{
      name: 'strip-store-metadata-from-game-package',
      transformIndexHtml(html) {
        return html.replace(/\s*<meta property="og:image"[^>]*>/, '');
      }
    }] : [],
    resolve: {
      alias: {
        '@rooster-assets': path.resolve(
          projectRoot,
          command === 'build'
            ? 'src/systems/assets/roosterAssetUrls.release.js'
            : 'src/systems/assets/roosterAssetUrls.dev.js'
        )
      }
    },
    build: {
      outDir: outputDirectory,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'phaser',
                test: /node_modules[\\/]phaser/
              }
            ]
          }
        }
      }
    }
  };
});
