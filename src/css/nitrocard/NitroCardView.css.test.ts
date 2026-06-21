import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = join(process.cwd(), 'src/css/nitrocard/NitroCardView.css');
const indexCssPath = join(process.cwd(), 'src/css/index.css');
const catalogViewPath = join(process.cwd(), 'src/components/catalog/CatalogView.tsx');
const catalogCssPath = join(process.cwd(), 'src/css/catalog/CatalogView.css');
const userProfileCssPath = join(process.cwd(), 'src/css/user-profile/UserProfileView.css');
const helpCssPath = join(process.cwd(), 'src/css/help/HelpView.css');
const indexTsxPath = join(process.cwd(), 'src/index.tsx');
const vaultViewPath = join(process.cwd(), 'src/components/vault/VaultView.tsx');
const legacyHabboSwfSkinPath = join(process.cwd(), 'src/css/habbo/HabboSwfSkin.css');

describe('NitroCardView.css', () => {
    it('targets the card classes rendered by shared card components', () => {
        const css = readFileSync(cssPath, 'utf8');

        expect(css).toContain('.nitro-card-shell');
        expect(css).toContain('.nitro-card-shell:not(.nitro-wired)');
        expect(css).toContain('.nitro-card-header-shell');
        expect(css).toContain('.nitro-card-content-shell');
        expect(css).toContain('.nitro-card-tabs-shell');
        expect(css).toContain('.nitro-card-tab-item');
    });

    it('keeps generic card shell ownership out of global index css', () => {
        const css = readFileSync(indexCssPath, 'utf8');

        expect(css).not.toContain('.nitro-card-shell:not(.nitro-wired)');
        expect(css).not.toContain('.nitro-card-tabs-shell');
        expect(css).not.toContain('.nitro-card-tab-item');
    });

    it('keeps standard card chrome out of feature-level window skins', () => {
        const catalogView = readFileSync(catalogViewPath, 'utf8');
        const catalogCss = readFileSync(catalogCssPath, 'utf8');
        const userProfileCss = readFileSync(userProfileCssPath, 'utf8');
        const helpCss = readFileSync(helpCssPath, 'utf8');
        const indexTsx = readFileSync(indexTsxPath, 'utf8');
        const vaultView = readFileSync(vaultViewPath, 'utf8');
        const legacySwfWindowClass = ['habbo', 'swf', 'window'].join('-');

        expect(catalogView).not.toContain(legacySwfWindowClass);
        expect(catalogView).not.toContain('buildersClubHeaderStyle');
        expect(indexTsx).not.toContain(['Habbo', 'Swf', 'Skin', 'css'].join('.'));
        expect(existsSync(legacyHabboSwfSkinPath)).toBe(false);
        expect(catalogCss).not.toMatch(/\.nitro-catalog-window\s+\.nitro-card-(?:header|header-shell|title|close-button)/);
        expect(catalogCss).not.toMatch(/\.nitro-catalog-tabs-shell\s+\.nitro-card-tab-item:hover/);
        expect(catalogCss).not.toMatch(/\.nitro-catalog-tabs-shell\s+\.nitro-card-tab-item-active/);
        expect(catalogCss).not.toMatch(/\.nitro-catalog-tabs-shell\s+\.nitro-card-tab-item\s*\{[^}]*\b(?:background|border|box-shadow|color|text-shadow)\s*:/s);
        expect(userProfileCss).not.toMatch(/\.nitro-extended-profile-window\s+\.nitro-card-(?:header-shell|title|close-button)/);
        expect(helpCss).not.toContain('.nitro-card.nitro-help');
        expect(vaultView).not.toContain('.nitro-card.nitro-vault');
    });
});
