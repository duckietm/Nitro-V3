import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = join(process.cwd(), 'src/css/purse/PurseView.css');

describe('PurseView.css', () => {
    it('lets shortened currency tooltips escape the compact purse frame', () => {
        const css = readFileSync(cssPath, 'utf8');
        const purseBlock = css.match(/\.nitro-purse\s*\{[^}]*\}/)?.[0] ?? '';

        expect(purseBlock).toContain('overflow: visible;');
    });

    it('uses the AIR6 purse height without removing the extra action', () => {
        const css = readFileSync(cssPath, 'utf8');

        expect(css).toMatch(/\.nitro-purse\s*\{[^}]*height:\s*77px;[^}]*min-height:\s*77px;/s);
        expect(css).toMatch(/\.nitro-purse__body\s*\{[^}]*height:\s*69px;[^}]*min-height:\s*69px;/s);
        expect(css).toMatch(/\.nitro-purse\s*\{[^}]*border-radius:\s*8px;/s);
        expect(css).not.toContain('.nitro-purse::before');
        expect(css).not.toContain('ubuntu_bg_9.png');
        expect(css).toMatch(/\.nitro-purse__btn--icon\s*\{[^}]*height:\s*15px;/s);
        expect(css).toMatch(/\.nitro-purse__col--primary\s*\{[^}]*gap:\s*7px;/s);
        expect(css).toMatch(/\.nitro-purse__col--actions\s*\{[^}]*gap:\s*2px;/s);
        expect(css).toMatch(/\.nitro-purse__other\s+\.nitro-purse-seasonal-currency\s*\{[^}]*border-radius:\s*8px;/s);
    });
});
