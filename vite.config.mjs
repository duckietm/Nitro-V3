import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import sirv from 'sirv';

const legacyRendererRoot = resolve(__dirname, '..', 'renderer');
const currentRendererRoot = resolve(__dirname, '..', 'Nitro_Render_V3');
const rendererRoot = existsSync(currentRendererRoot) ? currentRendererRoot : legacyRendererRoot;

// Game assets live outside the repo, in a sibling directory next to Nitro-V3.
// They are NOT placed under public/ on purpose: with ~177k files a symlink
// under public/ makes chokidar try to install a watcher on each one and the
// dev server takes minutes to start on Windows. Serving them with a
// dedicated sirv middleware (below) bypasses chokidar entirely.
const nitroFilesRoot = resolve(__dirname, '..', 'Nitro-Files');
const nitroAssetsRoot = resolve(nitroFilesRoot, 'nitro-assets');
const swfRoot = resolve(nitroFilesRoot, 'swf');

const nitroAssetsServer = () => ({
    name: 'nitro-assets-serve',
    configureServer(server)
    {
        if(existsSync(nitroAssetsRoot))
        {
            server.middlewares.use('/nitro-assets', sirv(nitroAssetsRoot, { dev: true, etag: true, maxAge: 0 }));
        }
        else
        {
            server.config.logger.warn(`[nitro-assets-serve] ${ nitroAssetsRoot } not found — /nitro-assets/* requests will 404.`);
        }

        if(existsSync(swfRoot))
        {
            server.middlewares.use('/swf', sirv(swfRoot, { dev: true, etag: true, maxAge: 0 }));
        }
        else
        {
            server.config.logger.warn(`[nitro-assets-serve] ${ swfRoot } not found — /swf/* requests will 404.`);
        }
    },
    configurePreviewServer(server)
    {
        if(existsSync(nitroAssetsRoot))
        {
            server.middlewares.use('/nitro-assets', sirv(nitroAssetsRoot, { dev: false, etag: true }));
        }
        if(existsSync(swfRoot))
        {
            server.middlewares.use('/swf', sirv(swfRoot, { dev: false, etag: true }));
        }
    }
});

if(!existsSync(rendererRoot))
{
    // Fail fast with a useful message instead of waiting for Rolldown to
    // report "Failed to resolve import @nitrots/nitro-renderer" deep
    // inside the bundle pass.
    throw new Error(
        '\n  Nitro renderer SDK not found.\n\n' +
        '  vite.config.mjs expects one of these directories to exist as a sibling of this repo:\n' +
        `    - ${ currentRendererRoot } (preferred)\n` +
        `    - ${ legacyRendererRoot } (legacy)\n\n` +
        '  Clone the Nitro_Render_V3 repo next to Nitro-V3 and rerun:\n' +
        '    git clone <renderer-repo> ../Nitro_Render_V3\n' +
        '    cd ../Nitro_Render_V3 && yarn install\n\n' +
        '  (See CLAUDE.md "Commands" section for the full setup walkthrough.)\n'
    );
}

const ReactCompilerConfig = {
    target: '19'
};

const resolveJsonMode = () =>
{
    const envOverride = process.env.NITRO_JSON_MODE;
    if(envOverride === 'legacy' || envOverride === 'json5' || envOverride === 'auto') return envOverride;

    const configFile = resolve(__dirname, '.nitro-build.json');
    if(existsSync(configFile))
    {
        try
        {
            const parsed = JSON.parse(readFileSync(configFile, 'utf8'));
            if(parsed?.jsonMode === 'legacy' || parsed?.jsonMode === 'json5' || parsed?.jsonMode === 'auto') return parsed.jsonMode;
        }
        catch {}
    }

    return 'auto';
};

const nitroJsonMode = resolveJsonMode();
process.stdout.write(`[vite] __NITRO_JSON_MODE__ = ${ nitroJsonMode }\n`);

export default defineConfig({
    base: process.env.VITE_BASE || './',
    plugins: [
        react({
            babel: {
                plugins: [
                    [ 'babel-plugin-react-compiler', ReactCompilerConfig ]
                ]
            }
        }),
        nitroAssetsServer()
    ],
    define: {
        __NITRO_JSON_MODE__: JSON.stringify(nitroJsonMode)
    },
    server: {
        fs: {
            allow: [
                resolve(__dirname),
                rendererRoot,
            ]
        },
        proxy: {
            '/api': {
                target: process.env.AUTH_PROXY_TARGET || 'http://localhost:2096',
                changeOrigin: true,
            }
        }
    },
    resolve: {
        tsconfigPaths: true,
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'node_modules'),
            // Force the umbrella to the source index.ts. Without this,
            // node-module resolution (via the symlink at
            // node_modules/@nitrots/nitro-renderer -> ../Nitro_Render_V3)
            // can land on the stale `dist/index.js` when one exists in
            // the renderer working tree — leaving the bundle with
            // pre-snapshot-pattern stubs and producing runtime errors
            // like "TypeError: (intermediate value)() is undefined"
            // when newer code calls getUserDataSnapshot() / .subscribe()
            // / NitroEventType.SESSION_DATA_UPDATED etc.
            '@nitrots/nitro-renderer': resolve(rendererRoot, 'index.ts'),
            '@nitrots/api': resolve(rendererRoot, 'packages/api/src/index.ts'),
            '@nitrots/assets': resolve(rendererRoot, 'packages/assets/src/index.ts'),
            '@nitrots/avatar': resolve(rendererRoot, 'packages/avatar/src/index.ts'),
            '@nitrots/camera': resolve(rendererRoot, 'packages/camera/src/index.ts'),
            '@nitrots/communication': resolve(rendererRoot, 'packages/communication/src/index.ts'),
            '@nitrots/configuration': resolve(rendererRoot, 'packages/configuration/src/index.ts'),
            '@nitrots/events': resolve(rendererRoot, 'packages/events/src/index.ts'),
            '@nitrots/localization': resolve(rendererRoot, 'packages/localization/src/index.ts'),
            '@nitrots/room': resolve(rendererRoot, 'packages/room/src/index.ts'),
            '@nitrots/session': resolve(rendererRoot, 'packages/session/src/index.ts'),
            '@nitrots/sound': resolve(rendererRoot, 'packages/sound/src/index.ts'),
            '@nitrots/utils/src': resolve(rendererRoot, 'packages/utils/src'),
            '@nitrots/utils': resolve(rendererRoot, 'packages/utils/src/index.ts'),
            'pixi.js': resolve(rendererRoot, 'node_modules/pixi.js'),
            'pixi-filters': resolve(rendererRoot, 'node_modules/pixi-filters'),
            'howler': resolve(rendererRoot, 'node_modules/howler'),
        }
    },
    build: {
        assetsInlineLimit: 102400,
        chunkSizeWarningLimit: 200000,
        manifest: true,
        rollupOptions: {
            output: {
                assetFileNames: 'src/assets/[name]-[hash].[ext]',
                manualChunks: id =>
                {
                    // Renderer source is consumed via filesystem alias
                    // (../Nitro_Render_V3/packages/*/src) so it is NOT
                    // under node_modules — needs its own branch before
                    // the node_modules check.
                    if(id.includes('Nitro_Render_V3') || id.includes(`${ rendererRoot }`)) return 'nitro-renderer';

                    if(id.includes('node_modules'))
                    {
                        if(id.includes('@nitrots/nitro-renderer') || id.includes('renderer3')) return 'nitro-renderer';

                        return 'vendor';
                    }
                }
            }
        }
    }
});
