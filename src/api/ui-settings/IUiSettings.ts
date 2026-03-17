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
