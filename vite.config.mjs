import react from '@vitejs/plugin-react';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const rendererCandidates = [
    resolve(__dirname, '..', 'Nitro_Render_V3'),
    resolve(__dirname, '..', 'renderer3')
];

const renderer3 = rendererCandidates.find(path => existsSync(path)) ?? rendererCandidates[0];

export default defineConfig({
    plugins: [ react(), tsconfigPaths() ],
    server: {
        fs: {
            allow: [
                resolve(__dirname),       // nitro3 itself
                renderer3,                // renderer3 source + packages
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
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'node_modules'),
            // Renderer3 root → resolve through its src/index.ts
            '@nitrots/nitro-renderer': resolve(renderer3, 'src/index.ts'),
            // Renderer3 workspace packages → point to their src/index.ts
            '@nitrots/api': resolve(renderer3, 'packages/api/src/index.ts'),
            '@nitrots/assets': resolve(renderer3, 'packages/assets/src/index.ts'),
            '@nitrots/avatar': resolve(renderer3, 'packages/avatar/src/index.ts'),
            '@nitrots/camera': resolve(renderer3, 'packages/camera/src/index.ts'),
            '@nitrots/communication': resolve(renderer3, 'packages/communication/src/index.ts'),
            '@nitrots/configuration': resolve(renderer3, 'packages/configuration/src/index.ts'),
            '@nitrots/events': resolve(renderer3, 'packages/events/src/index.ts'),
            '@nitrots/localization': resolve(renderer3, 'packages/localization/src/index.ts'),
            '@nitrots/room': resolve(renderer3, 'packages/room/src/index.ts'),
            '@nitrots/session': resolve(renderer3, 'packages/session/src/index.ts'),
            '@nitrots/sound': resolve(renderer3, 'packages/sound/src/index.ts'),
            '@nitrots/utils/src': resolve(renderer3, 'packages/utils/src'),
            '@nitrots/utils': resolve(renderer3, 'packages/utils/src/index.ts'),
            // Resolve renderer peer dependencies from the renderer workspace
            'pixi.js': resolve(renderer3, 'node_modules/pixi.js'),
            'pixi-filters': resolve(renderer3, 'node_modules/pixi-filters'),
            'howler': resolve(renderer3, 'node_modules/howler'),
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
})
