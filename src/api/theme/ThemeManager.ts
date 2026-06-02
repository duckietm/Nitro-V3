import { NitroLogger } from '@nitrots/nitro-renderer';
import { GetConfigurationValue } from '../nitro';

// ---------------------------------------------------------------------------
//  Custom theme ecosystem (graphics-only, runtime-loaded).
//
//  A "theme" is a folder on the server (NOT bundled in the build) made of:
//    <base>/index.json          -> { "themes": [ { id, name, author? } ] }
//    <base>/<id>/theme.json      -> { name, pieces: [ { id, name, file } ] }
//    <base>/<id>/<file>.css      -> one CSS "piece" (cards, chat, catalog, ...)
//
//  Each enabled piece is injected as a <link> in <head>. If a piece fails to
//  load (404 / network) the link removes itself, so the UI falls back to the
//  default look for that piece (per-piece fallback, never breaks the client).
//
//  The base url is configurable via ui-config ("theme.base.url") so themes can
//  live anywhere (and never need a client rebuild to add/change them).
// ---------------------------------------------------------------------------

export interface ThemeInfo
{
    id: string;
    name: string;
    author?: string;
}

export interface ThemePiece
{
    id: string;
    name: string;
    file: string;
}

export interface ThemeManifest
{
    name: string;
    pieces: ThemePiece[];
}

const LINK_ATTR = 'data-nitro-theme';

export const GetThemeBaseUrl = (): string =>
    GetConfigurationValue<string>('theme.base.url', 'custom-themes').replace(/\/+$/, '');

export const FetchThemeIndex = async (): Promise<ThemeInfo[]> =>
{
    try
    {
        const response = await fetch(`${ GetThemeBaseUrl() }/index.json`, { cache: 'no-cache' });

        if(!response.ok) return [];

        const data = await response.json();

        return Array.isArray(data?.themes) ? data.themes.filter((t: any) => t && t.id) : [];
    }
    catch(error)
    {
        NitroLogger.warn('[ThemeManager] index.json non caricabile, nessun tema custom', error);

        return [];
    }
};

export const FetchThemeManifest = async (themeId: string): Promise<ThemeManifest> =>
{
    if(!themeId) return null;

    try
    {
        const response = await fetch(`${ GetThemeBaseUrl() }/${ themeId }/theme.json`, { cache: 'no-cache' });

        if(!response.ok) return null;

        const data = await response.json();

        if(!data || !Array.isArray(data.pieces)) return null;

        return {
            name: data.name ?? themeId,
            pieces: data.pieces.filter((p: any) => p && p.id && p.file)
        };
    }
    catch(error)
    {
        NitroLogger.warn(`[ThemeManager] manifest non valido per tema "${ themeId }" -> fallback default`, error);

        return null;
    }
};

export const ClearTheme = (): void =>
{
    document.head.querySelectorAll(`link[${ LINK_ATTR }]`).forEach(node => node.remove());
};

export const ApplyThemePieces = (themeId: string, pieces: ThemePiece[]): void =>
{
    ClearTheme();

    if(!themeId || !pieces || !pieces.length) return;

    const base = GetThemeBaseUrl();

    for(const piece of pieces)
    {
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.setAttribute(LINK_ATTR, piece.id);
        link.href = `${ base }/${ themeId }/${ piece.file }`;

        // Per-piece fallback: a broken piece removes itself, leaving the default.
        link.onerror = () =>
        {
            NitroLogger.warn(`[ThemeManager] pezzo tema rotto "${ themeId }/${ piece.file }" -> fallback default`);
            link.remove();
        };

        document.head.appendChild(link);
    }
};
