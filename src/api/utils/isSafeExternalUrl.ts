/**
 * Returns true only for plain web URLs (http/https). Used to gate URLs that
 * originate from user-controlled content before they are opened — never let a
 * `javascript:`, `data:`, `vbscript:`, `file:` … scheme reach `window.open`,
 * which would run in the opener's origin.
 */
export const isSafeExternalUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;

    try {
        const protocol = new URL(url.trim()).protocol;

        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
};
