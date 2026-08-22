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

    it('keeps the SWF purse chrome without reintroducing the legacy background hack', () => {
        const css = readFileSync(cssPath, 'utf8');

        // The SWF restyle replaced the fixed AIR6 77px/69px frame with a flex body
        // that sizes to its content, so assert the column layout rather than heights.
        expect(css).toMatch(/\.nitro-purse__body\s*\{[^}]*display:\s*flex;/s);
        expect(css).toMatch(/\.nitro-purse__col--primary\s*\{[^}]*gap:\s*7px;/s);
        expect(css).toMatch(/\.nitro-purse__col--actions\s*\{[^}]*gap:\s*2px;/s);

        // Per-currency amount colours are keyed off .nitro-purse-button__amount,
        // which CurrencyView must keep emitting alongside .currency-text.
        expect(css).toContain('.nitro-purse .nitro-purse-button.currency--1 .nitro-purse-button__amount');

        expect(css).toContain('border-ubuntu-9.png');
        expect(css).toContain('width: 230px');
        expect(css).toContain('height: 77px');
        expect(css).not.toContain('.nitro-purse::before');
    });
});
