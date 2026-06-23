export type PrefixFontTier = 'basic' | 'premium';
export type PrefixFontOption = {
    id: string;
    label: string;
    family: string;
    tier: PrefixFontTier;
};
export const PRESET_PREFIX_FONTS: PrefixFontOption[] = [
    { id: '', label: 'Default', family: 'Ubuntu, sans-serif', tier: 'basic' },
    { id: 'pixel', label: 'Pixelify Sans', family: '"Pixelify Sans", cursive', tier: 'premium' },
    { id: 'cherry', label: 'Cherry Bomb One', family: '"Cherry Bomb One", cursive', tier: 'premium' },
    { id: 'vampiro', label: 'Vampiro One', family: '"Vampiro One", cursive', tier: 'premium' }
];

export const PRESET_PREFIX_EFFECTS: { id: string; label: string; icon: string; tier: 'basic' | 'premium' }[] = [
    { id: '', label: 'None', icon: '-', tier: 'basic' },
    { id: 'glow', label: 'Glow', icon: '*', tier: 'basic' },
    { id: 'shadow', label: 'Shadow', icon: 'S', tier: 'basic' },
    { id: 'italic', label: 'Italic', icon: 'I', tier: 'basic' },
    { id: 'outline', label: 'Outline', icon: 'O', tier: 'basic' },
    { id: 'underline', label: 'Underline', icon: 'U', tier: 'basic' },
    { id: 'pulse', label: 'Pulse', icon: 'P', tier: 'basic' },
    { id: 'bounce', label: 'Bounce', icon: 'B', tier: 'basic' },
    { id: 'wave', label: 'Wave', icon: 'W', tier: 'basic' },
    { id: 'shake', label: 'Shake', icon: '!', tier: 'basic' },
    { id: 'discord-neon', label: 'Discord Neon', icon: 'D', tier: 'premium' },
    { id: 'cartoon', label: 'Cartoon', icon: 'C', tier: 'premium' },
    { id: 'toon', label: 'Toon', icon: 'T', tier: 'premium' },
    { id: 'pop', label: 'Pop', icon: 'P+', tier: 'premium' },
    { id: 'bold-glow', label: 'Neon', icon: 'N', tier: 'premium' },
    { id: 'rainbow', label: 'Rainbow', icon: 'R', tier: 'premium' },
    { id: 'frost', label: 'Frost', icon: 'F', tier: 'premium' },
    { id: 'gold', label: 'Gold Shine', icon: 'G', tier: 'premium' },
    { id: 'glitch', label: 'Glitch', icon: 'X', tier: 'premium' },
    { id: 'fire', label: 'Fire', icon: 'H', tier: 'premium' },
    { id: 'matrix', label: 'Matrix', icon: 'M', tier: 'premium' },
    { id: 'sparkle', label: 'Sparkle', icon: '+', tier: 'premium' }
];

export const parsePrefixColors = (text: string, colorStr: string): string[] => {
    if (!colorStr || !text) return [];

    const colors = colorStr.split(',');
    return [...text].map((_, i) => colors[Math.min(i, colors.length - 1)]);
};
export const getPrefixFontStyle = (font: string): Record<string, string> => {
    const option = PRESET_PREFIX_FONTS.find((entry) => entry.id === font);

    if (!option || !option.id.length) return {};

    return { fontFamily: option.family };
};

export const getPrefixEffectStyle = (effect: string, color?: string): Record<string, string | number> => {
    const baseColor = color || '#FFFFFF';

    switch (effect) {
        case 'glow':
            return { textShadow: `0 0 6px ${baseColor}, 0 0 12px ${baseColor}80` };
        case 'shadow':
            return { textShadow: '2px 2px 4px rgba(0,0,0,0.7), 1px 1px 2px rgba(0,0,0,0.5)' };
        case 'italic':
            return { fontStyle: 'italic' };
        case 'outline':
            return {
                WebkitTextStroke: '0.5px rgba(0,0,0,0.6)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3)'
            };
        case 'underline':
            return {
                textDecoration: 'underline',
                textDecorationThickness: '2px',
                textUnderlineOffset: '2px'
            };
        case 'pulse':
            return { animation: 'prefix-pulse 1.5s ease-in-out infinite' };
        case 'bounce':
            return {
                animation: 'prefix-bounce 1.2s ease-in-out infinite',
                display: 'inline-block'
            };
        case 'wave':
            return {
                animation: 'prefix-wave 1.6s ease-in-out infinite',
                display: 'inline-block',
                transformOrigin: 'center bottom'
            };
        case 'shake':
            return {
                animation: 'prefix-shake 0.9s ease-in-out infinite',
                display: 'inline-block'
            };
        case 'discord-neon':
            return {
                textShadow: `0 0 5px ${baseColor}, 0 0 10px ${baseColor}, 0 0 18px ${baseColor}90`,
                fontWeight: 900,
                letterSpacing: '0.2px'
            };
        case 'cartoon':
            return {
                WebkitTextStroke: '1px rgba(0,0,0,0.75)',
                textShadow: '2px 2px 0 rgba(0,0,0,0.55)',
                fontWeight: 900
            };
        case 'toon':
            return {
                WebkitTextStroke: '0.8px rgba(0,0,0,0.65)',
                textShadow: '1px 2px 0 rgba(0,0,0,0.45)',
                fontWeight: 900,
                transform: 'skew(-4deg)'
            };
        case 'pop':
            return {
                textShadow: '0 2px 0 rgba(0,0,0,0.28), 0 4px 8px rgba(0,0,0,0.2)',
                fontWeight: 900,
                letterSpacing: '0.3px'
            };
        case 'bold-glow':
            return {
                textShadow: `0 0 4px ${baseColor}, 0 0 8px ${baseColor}, 0 0 16px ${baseColor}60`,
                fontWeight: 900
            };
        case 'rainbow':
            return {
                animation: 'prefix-rainbow 2.6s linear infinite',
                textShadow: '0 0 8px rgba(255,255,255,0.35)'
            };
        case 'frost':
            return {
                textShadow: '0 0 4px rgba(255,255,255,0.75), 0 0 10px rgba(125,211,252,0.45)',
                filter: 'drop-shadow(0 0 2px rgba(191,219,254,0.75))'
            };
        case 'gold':
            return {
                animation: 'prefix-gold 2s ease-in-out infinite',
                textShadow: '0 0 6px rgba(255,215,0,0.45), 0 0 14px rgba(255,193,7,0.35)'
            };
        case 'glitch':
            return {
                animation: 'prefix-glitch 0.8s steps(2, end) infinite',
                textShadow: '-1px 0 rgba(255,0,102,0.75), 1px 0 rgba(0,255,255,0.75)'
            };
        case 'fire':
            return {
                animation: 'prefix-fire 1.1s ease-in-out infinite',
                textShadow: '0 0 5px rgba(255,120,0,0.7), 0 -1px 8px rgba(255,200,0,0.55), 0 -2px 12px rgba(255,60,0,0.45)'
            };
        case 'matrix':
            return {
                animation: 'prefix-matrix 1.8s linear infinite',
                textShadow: '0 0 6px rgba(57,255,20,0.65), 0 0 12px rgba(57,255,20,0.35)'
            };
        case 'sparkle':
            return {
                animation: 'prefix-sparkle 1.4s ease-in-out infinite',
                textShadow: `0 0 4px ${baseColor}, 0 0 10px ${baseColor}80, 0 0 16px rgba(255,255,255,0.45)`
            };
        default:
            return {};
    }
};
