export const PRESET_PREFIX_EFFECTS: { id: string; label: string; icon: string }[] = [
    { id: '', label: 'None', icon: '—' },
    { id: 'glow', label: 'Glow', icon: '✨' },
    { id: 'shadow', label: 'Shadow', icon: '🌑' },
    { id: 'italic', label: 'Italic', icon: '𝑰' },
    { id: 'outline', label: 'Outline', icon: '🔲' },
    { id: 'pulse', label: 'Pulse', icon: '💫' },
    { id: 'bold-glow', label: 'Neon', icon: '💡' },
    { id: 'rainbow', label: 'Rainbow', icon: '🌈' },
    { id: 'shake', label: 'Shake', icon: '📳' },
    { id: 'wave', label: 'Wave', icon: '🌊' },
];

export const parsePrefixColors = (text: string, colorStr: string): string[] =>
{
    if(!colorStr || !text) return [];

    const colors = colorStr.split(',');
    return [ ...text ].map((_, i) => colors[Math.min(i, colors.length - 1)]);
};

export const getPrefixEffectStyle = (effect: string, color?: string): Record<string, string | number> =>
{
    const baseColor = color || '#FFFFFF';

    switch(effect)
    {
        case 'glow':
            return { textShadow: `0 0 6px ${ baseColor }, 0 0 12px ${ baseColor }80` };
        case 'shadow':
            return { textShadow: '2px 2px 4px rgba(0,0,0,0.7), 1px 1px 2px rgba(0,0,0,0.5)' };
        case 'italic':
            return { fontStyle: 'italic' };
        case 'outline':
            return {
                WebkitTextStroke: '0.5px rgba(0,0,0,0.6)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.3), 1px -1px 0 rgba(0,0,0,0.3), -1px 1px 0 rgba(0,0,0,0.3)'
            };
        case 'pulse':
            return { animation: 'prefix-pulse 1.5s ease-in-out infinite' };
        case 'bold-glow':
            return {
                textShadow: `0 0 4px ${ baseColor }, 0 0 8px ${ baseColor }, 0 0 16px ${ baseColor }60`,
                fontWeight: 900
            };
        case 'rainbow':
            return { animation: 'prefix-rainbow 3s linear infinite', display: 'inline-block' };
        case 'shake':
            return { animation: 'prefix-shake 0.4s ease-in-out infinite', display: 'inline-block' };
        case 'wave':
            return { animation: 'prefix-wave 1s ease-in-out infinite', display: 'inline-block' };
        default:
            return {};
    }
};

export const generateGradientColors = (startColor: string, endColor: string, steps: number): string[] =>
{
    if(steps <= 1) return [ startColor ];

    const parseHex = (hex: string) =>
    {
        const h = hex.replace('#', '');
        return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
    };

    const start = parseHex(startColor);
    const end = parseHex(endColor);

    return Array.from({ length: steps }, (_, i) =>
    {
        const t = i / (steps - 1);
        const r = Math.round(start.r + (end.r - start.r) * t);
        const g = Math.round(start.g + (end.g - start.g) * t);
        const b = Math.round(start.b + (end.b - start.b) * t);
        return `#${ r.toString(16).padStart(2, '0') }${ g.toString(16).padStart(2, '0') }${ b.toString(16).padStart(2, '0') }`;
    });
};

export const PREFIX_EFFECT_KEYFRAMES = `
@keyframes prefix-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
