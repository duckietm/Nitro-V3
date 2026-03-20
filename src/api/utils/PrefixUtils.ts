export const PRESET_PREFIX_EFFECTS: { id: string; label: string; icon: string }[] = [
    { id: '', label: 'None', icon: '—' },
    { id: 'glow', label: 'Glow', icon: '✨' },
    { id: 'shadow', label: 'Shadow', icon: '🌑' },
    { id: 'italic', label: 'Italic', icon: '𝑰' },
    { id: 'outline', label: 'Outline', icon: '🔲' },
    { id: 'pulse', label: 'Pulse', icon: '💫' },
    { id: 'bold-glow', label: 'Neon', icon: '💡' },
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
        default:
            return {};
    }
};

export const PREFIX_EFFECT_KEYFRAMES = `
@keyframes prefix-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;
