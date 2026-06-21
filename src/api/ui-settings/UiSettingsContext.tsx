import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_UI_SETTINGS, IUiSettings } from './IUiSettings';

/**
 * UI settings currently persist to localStorage only. The cross-device
 * server-side sync (UiSettingsLoadComposer / UiSettingsSaveComposer /
 * UiSettingsDataEvent) is a planned addition that requires both the
 * renderer composer classes and the Arcturus packet handlers — none of
 * which exist yet. Until those land, settings stay per-browser.
 */

const STORAGE_KEY = 'nitro.ui.settings';

interface IUiSettingsContext {
    settings: IUiSettings;
    isCustomActive: boolean;
    updateSettings: (partial: Partial<IUiSettings>) => void;
    resetSettings: () => void;
    getHeaderStyle: () => React.CSSProperties;
    getTabsStyle: () => React.CSSProperties;
    getAccentColor: () => string;
}

const UiSettingsContext = createContext<IUiSettingsContext>({
    settings: DEFAULT_UI_SETTINGS,
    isCustomActive: false,
    updateSettings: () => {},
    resetSettings: () => {},
    getHeaderStyle: () => ({}),
    getTabsStyle: () => ({}),
    getAccentColor: () => DEFAULT_UI_SETTINGS.headerColor
});

const darkenColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const loadSettings = (): IUiSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return { ...DEFAULT_UI_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {}

    return { ...DEFAULT_UI_SETTINGS };
};

const saveSettings = (settings: IUiSettings): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
};

const ALL_CSS_VARS = [
    '--ui-accent-color',
    '--ui-accent-dark',
    '--ui-ctx-bg',
    '--ui-ctx-header-bg',
    '--ui-ctx-item-bg1',
    '--ui-ctx-item-bg2',
    '--ui-btn-primary-bg',
    '--ui-btn-primary-border',
    '--ui-dark-bg',
    '--ui-dark-border'
];

export const UiSettingsProvider: FC<PropsWithChildren> = ({ children }) => {
    const [settings, setSettings] = useState<IUiSettings>(loadSettings);

    const updateSettings = useCallback((partial: Partial<IUiSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...partial };
            saveSettings(updated);

            return updated;
        });
    }, []);

    const resetSettings = useCallback(() => {
        setSettings({ ...DEFAULT_UI_SETTINGS });
        saveSettings(DEFAULT_UI_SETTINGS);
    }, []);

    const getHeaderStyle = useCallback((): React.CSSProperties => {
        if (settings.colorMode === 'color') {
            const alpha = (settings.headerAlpha ?? 100) / 100;
            const num = parseInt(settings.headerColor.replace('#', ''), 16);
            const r = (num >> 16) & 0xff;
            const g = (num >> 8) & 0xff;
            const b = num & 0xff;

            return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
        }

        if (settings.colorMode === 'image' && settings.headerImageUrl) {
            return {
                backgroundImage: `url(${settings.headerImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'repeat'
            };
        }

        return {};
    }, [settings]);

    const getTabsStyle = useCallback((): React.CSSProperties => {
        if (settings.colorMode === 'color') {
            return { backgroundColor: darkenColor(settings.headerColor, 30) };
        }

        if (settings.colorMode === 'image' && settings.headerImageUrl) {
            return {
                backgroundImage: `url(${settings.headerImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'repeat'
            };
        }

        return {};
    }, [settings]);

    const getAccentColor = useCallback((): string => {
        if (settings.colorMode === 'color') return settings.headerColor;

        return DEFAULT_UI_SETTINGS.headerColor;
    }, [settings]);

    const isCustomActive = settings.colorMode !== 'default';

    useEffect(() => {
        const root = document.documentElement;

        if (settings.colorMode === 'color') {
            const c = settings.headerColor;
            root.style.setProperty('--ui-accent-color', c);
            root.style.setProperty('--ui-accent-dark', darkenColor(c, 30));
            root.style.setProperty('--ui-ctx-bg', darkenColor(c, 50));
            root.style.setProperty('--ui-ctx-header-bg', darkenColor(c, 20));
            root.style.setProperty('--ui-ctx-item-bg1', darkenColor(c, 60));
            root.style.setProperty('--ui-ctx-item-bg2', darkenColor(c, 70));
            root.style.setProperty('--ui-btn-primary-bg', c);
            root.style.setProperty('--ui-btn-primary-border', darkenColor(c, 20));
            root.style.setProperty('--ui-dark-bg', darkenColor(c, 55));
            root.style.setProperty('--ui-dark-border', darkenColor(c, 60));
        } else {
            ALL_CSS_VARS.forEach((v) => root.style.removeProperty(v));
        }
    }, [settings]);

    return (
        <UiSettingsContext value={{ settings, isCustomActive, updateSettings, resetSettings, getHeaderStyle, getTabsStyle, getAccentColor }}>
            {children}
        </UiSettingsContext>
    );
};

export const useUiSettings = () => useContext(UiSettingsContext);
