import { resolveAvatarGender } from './resolveAvatarGender';

const DEFAULT_AVATAR_FIGURES: Record<string, string> = {
    M: 'hd-180-1.ch-210-66.lg-270-82.sh-290-80',
    F: 'hd-600-1.ch-630-66.lg-695-82.sh-725-80'
};

export const resolveAvatarFigure = (figure: string | null | undefined, gender?: string | number | null) => {
    const normalizedFigure = (figure || '').trim();

    if (normalizedFigure.length && normalizedFigure.includes('hd-')) return normalizedFigure;

    return DEFAULT_AVATAR_FIGURES[resolveAvatarGender(gender)] || DEFAULT_AVATAR_FIGURES.M;
};
