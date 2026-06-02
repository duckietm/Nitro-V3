import { useEffect, useMemo, useState } from 'react';
import { useBetween } from 'use-between';
import { ApplyThemePieces, ClearTheme, FetchThemeIndex, FetchThemeManifest, GetConfigurationValue, LocalStorageKeys, ThemeInfo, ThemeManifest } from '../../api';
import { useLocalStorage } from '../useLocalStorage';

// Per-user custom theme selection.
//  - activeThemeId: '' = default (no custom theme). Default for new users comes
//    from ui-config `theme.default` so the admin can set a hotel-wide default
//    (like catalog.classic.style), while each user can override from Settings.
//  - enabledPieces[themeId]: which graphic pieces of that theme are active
//    (checkboxes). If absent, defaults to ui-config `theme.default.pieces`
//    (when on the default theme) or ALL pieces.
const useThemesState = () =>
{
    const [ activeThemeId, setActiveThemeId ] = useLocalStorage<string>(LocalStorageKeys.THEME_ACTIVE, GetConfigurationValue<string>('theme.default', ''));
    const [ enabledPieces, setEnabledPieces ] = useLocalStorage<Record<string, string[]>>(LocalStorageKeys.THEME_PIECES, {});
    const [ themes, setThemes ] = useState<ThemeInfo[]>([]);
    const [ manifest, setManifest ] = useState<ThemeManifest>(null);
    const [ loaded, setLoaded ] = useState(false);

    // Load the theme index once.
    useEffect(() =>
    {
        let alive = true;

        FetchThemeIndex().then(list =>
        {
            if(alive) setThemes(list);
        }).finally(() =>
        {
            if(alive) setLoaded(true);
        });

        return () => { alive = false; };
    }, []);

    // Load the manifest whenever the active theme changes.
    useEffect(() =>
    {
        let alive = true;

        if(!activeThemeId)
        {
            setManifest(null);
            ClearTheme();
            return;
        }

        FetchThemeManifest(activeThemeId).then(m =>
        {
            if(!alive) return;

            setManifest(m);

            if(!m) ClearTheme(); // broken/missing manifest -> full fallback to default
        });

        return () => { alive = false; };
    }, [ activeThemeId ]);

    // Which pieces are enabled for the current theme.
    const activeEnabled = useMemo(() =>
    {
        if(!manifest) return [] as string[];

        const stored = enabledPieces[activeThemeId];

        if(stored) return stored;

        const fromConfig = GetConfigurationValue<string[]>('theme.default.pieces', null);

        // Default: config list (if this is the default theme) else every piece on.
        if(fromConfig && activeThemeId === GetConfigurationValue<string>('theme.default', '')) return fromConfig;

        return manifest.pieces.map(p => p.id);
    }, [ manifest, enabledPieces, activeThemeId ]);

    // Apply (inject/remove <link>s) whenever theme or enabled pieces change.
    useEffect(() =>
    {
        if(!activeThemeId || !manifest)
        {
            ClearTheme();
            return;
        }

        ApplyThemePieces(activeThemeId, manifest.pieces.filter(p => activeEnabled.includes(p.id)));
    }, [ activeThemeId, manifest, activeEnabled ]);

    const selectTheme = (id: string) => setActiveThemeId(id || '');

    const togglePiece = (pieceId: string) =>
    {
        if(!activeThemeId || !manifest) return;

        setEnabledPieces(prev =>
        {
            const current = prev[activeThemeId] ?? manifest.pieces.map(p => p.id);
            const next = current.includes(pieceId) ? current.filter(x => x !== pieceId) : [ ...current, pieceId ];

            return { ...prev, [activeThemeId]: next };
        });
    };

    return { themes, activeThemeId, manifest, activeEnabled, loaded, selectTheme, togglePiece };
};

export const useThemes = () => useBetween(useThemesState);
