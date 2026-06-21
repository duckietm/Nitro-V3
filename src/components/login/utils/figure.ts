export type GenderKey = 'M' | 'F';

export const PART_ROWS: string[] = ['hr', 'hd', 'ch', 'lg', 'sh'];

export const FALLBACK_DEFAULTS: Record<GenderKey, Record<string, { partId: number; colors: number[] }>> = {
    M: {
        hr: { partId: 180, colors: [45] },
        hd: { partId: 180, colors: [1] },
        ch: { partId: 215, colors: [66] },
        lg: { partId: 270, colors: [82] },
        sh: { partId: 290, colors: [80] }
    },
    F: {
        hr: { partId: 515, colors: [45] },
        hd: { partId: 600, colors: [1] },
        ch: { partId: 660, colors: [100] },
        lg: { partId: 716, colors: [82] },
        sh: { partId: 725, colors: [61] }
    }
};

export const FALLBACK_HEX: Record<number, string> = {
    1: '#ffcb98',
    8: '#f4ac54',
    14: '#f5da88',
    19: '#b87560',
    20: '#9c543f',
    45: '#e8c498',
    61: '#f1ece3',
    66: '#96743d',
    80: '#4f4d4d',
    82: '#7f4f30',
    92: '#ececec',
    100: '#c7ddff',
    106: '#c6e6bd',
    110: '#91a7c8',
    143: '#ffffff'
};

export interface FigureColor {
    id: number;
    hexCode: string;
    club: number;
    selectable: boolean;
}
export interface FigurePalette {
    id: number;
    colors: FigureColor[];
}
export interface FigureSet {
    id: number;
    gender: 'M' | 'F' | 'U';
    club: number;
    selectable: boolean;
}
export interface FigureSetType {
    type: string;
    paletteId: number;
    sets: FigureSet[];
}
export interface FigureData {
    palettes: FigurePalette[];
    setTypes: FigureSetType[];
}

export interface PartSelection {
    partId: number;
    colors: number[];
}
export type FigureSelection = Record<string, PartSelection>;

export const buildFigureString = (selection: FigureSelection): string => {
    const seen = new Set<string>();
    const parts: string[] = [];
    const push = (setType: string) => {
        if (seen.has(setType)) return;
        seen.add(setType);
        const sel = selection[setType];
        if (!sel || sel.partId < 0) return;
        const tail = sel.colors && sel.colors.length ? `-${sel.colors.join('-')}` : '';
        parts.push(`${setType}-${sel.partId}${tail}`);
    };
    for (const setType of PART_ROWS) push(setType);
    for (const setType of Object.keys(selection)) push(setType);
    return parts.join('.');
};

export const buildImagingUrl = (template: string, figure: string, gender: GenderKey): string =>
    template
        .replace(/\{figure\}/g, encodeURIComponent(figure))
        .replace(/\{gender\}/g, gender)
        .replace(/\{direction\}/g, '2');

const HEAD_ONLY_PARTS = new Set(['hr', 'hd']);

export const buildPartPreviewUrl = (template: string, setType: string, selection: FigureSelection, gender: GenderKey): string => {
    const defaults = FALLBACK_DEFAULTS[gender];
    const partSel = selection[setType] ?? defaults[setType];
    const tail = partSel.colors && partSel.colors.length ? `-${partSel.colors.join('-')}` : '';
    const isHeadOnly = HEAD_ONLY_PARTS.has(setType);

    let parts: string[];
    if (isHeadOnly) {
        const hd = defaults.hd;
        const pieces = new Map<string, string>();
        pieces.set('hd', `hd-${hd.partId}-${hd.colors.join('-')}`);
        pieces.set(setType, `${setType}-${partSel.partId}${tail}`);
        parts = Array.from(pieces.values());
    } else {
        const hd = defaults.hd;
        parts = [`hd-${hd.partId}-${hd.colors.join('-')}`, `${setType}-${partSel.partId}${tail}`];
    }

    const figure = parts.join('.');
    let url = template
        .replace(/\{figure\}/g, encodeURIComponent(figure))
        .replace(/\{gender\}/g, gender)
        .replace(/\{direction\}/g, '2');

    url = url.replace(/size=l/, 'size=s').replace(/size=m/, 'size=s');
    if (!/size=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'size=s';
    if (isHeadOnly && !/headonly=/.test(url)) url += '&headonly=1';

    return url;
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
