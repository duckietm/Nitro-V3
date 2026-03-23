export interface IUiSettings
{
    colorMode: 'color' | 'image' | 'default';
    headerColor: string;
    headerImageUrl: string;
    headerAlpha: number;
}

export const DEFAULT_UI_SETTINGS: IUiSettings = {
    colorMode: 'default',
    headerColor: '#1E7295',
    headerImageUrl: '',
    headerAlpha: 100
};

export const PRESET_COLORS: string[] = [
    '#000000', '#444444', '#888888', '#CCCCCC', '#660000', '#CC3333', '#FF6666', '#CC6600',
    '#FF3333', '#FF6633', '#FF9933', '#FFCC00', '#FFFF00', '#66FF00', '#00CC00', '#009900',
    '#00FFCC', '#33CCFF', '#3366FF', '#0000CC', '#6633CC', '#9933FF', '#CC33FF', '#FF66CC',
    '#FF99CC', '#1E7295', '#185D79', '#2DABC2', '#2B91A7', '#283F5D'
];

export interface IThemePreset
{
    name: string;
    color: string;
    alpha: number;
}

export const THEME_PRESETS: IThemePreset[] = [
    { name: 'default', color: '#1E7295', alpha: 100 },
    { name: 'ocean', color: '#0077B6', alpha: 100 },
    { name: 'forest', color: '#2D6A4F', alpha: 100 },
    { name: 'sunset', color: '#E76F51', alpha: 100 },
    { name: 'royal', color: '#7B2CBF', alpha: 100 },
    { name: 'midnight', color: '#1B1B2F', alpha: 100 },
    { name: 'cherry', color: '#C1121F', alpha: 100 },
    { name: 'gold', color: '#B8860B', alpha: 100 },
    { name: 'slate', color: '#475569', alpha: 100 },
    { name: 'candy', color: '#FF69B4', alpha: 100 },
    { name: 'emerald', color: '#059669', alpha: 100 },
    { name: 'volcano', color: '#DC2626', alpha: 90 },
];
