import react from '@vitejs/plugin-react';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const legacyRendererRoot = resolve(__dirname, '..', 'renderer');
const currentRendererRoot = resolve(__dirname, '..', 'Nitro_Render_V3');
const rendererRoot = existsSync(currentRendererRoot) ? currentRendererRoot : legacyRendererRoot;

export default defineConfig({
    plugins: [ react() ],
    server: {
        fs: {
            allow: [
                resolve(__dirname),
                rendererRoot,
            ]
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    },
    resolve: {
        tsconfigPaths: true,
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'node_modules'),
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
        rollupOptions: {
            output: {
                assetFileNames: 'src/assets/[name]-[hash].[ext]',
                manualChunks: id =>
                {
                    if(id.includes('node_modules'))
                    {
                        if(id.includes('@nitrots/nitro-renderer') || id.includes('renderer3') || id.includes('Nitro_Render_V3')) return 'nitro-renderer';

                        return 'vendor';
                    }
                }
            }
        }
    }
});
