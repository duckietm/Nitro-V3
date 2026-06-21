export const resolveAvatarGender = (value: string | number | null | undefined) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toUpperCase();

        if (normalized === 'F') return 'F';
        if (normalized === 'M') return 'M';
        if (normalized === 'FEMALE') return 'F';
        if (normalized === 'MALE') return 'M';
    }

    if (typeof value === 'number') {
        if (value === 2) return 'F';
        if (value === 1) return 'M';
    }

    return 'M';
};
