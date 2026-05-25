import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Test runner config — kept separate from vite.config.mjs because the
 * dev/build config wires up the renderer SDK via filesystem aliases that
 * point at sibling working trees (`../renderer`, `../Nitro_Render_V3`).
 *
 * Tests live next to their subject under `src/` (`foo.ts` + `foo.test.ts`).
 * The renderer SDK is aliased to a hand-written stub at
 * `src/nitro-renderer.mock.ts` so jsdom doesn't try to evaluate Pixi +
 * the full message parser/composer registry at import time.
 */
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: false,
        include: [ 'src/**/*.test.ts', 'src/**/*.test.tsx' ],
        setupFiles: [ './src/test-setup.ts' ],
        css: false
    },
    resolve: {
        alias: {
            '@nitrots/nitro-renderer': resolve(__dirname, 'src/nitro-renderer.mock.ts'),
            '@': resolve(__dirname, 'src')
        }
    }
});
