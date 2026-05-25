/**
 * Accepts a URL (http/https, protocol-relative, or site-relative),
 * a data URL with an image mime type, or a raw base64 image payload.
 * Anything else (including data:text/html, javascript:, etc.) is rejected
 * to keep an admin-set DB value from becoming an XSS / phishing vector.
 */
export const resolveNewsImage = (raw: string | null | undefined): string =>
{
    const value = (raw ?? '').trim();
    if(!value) return '';
    if(/^https?:\/\//i.test(value)) return value;
    if(value.startsWith('//')) return window.location.protocol + value;
    if(value.startsWith('/'))
    {
        try
        {
            return new URL(value, window.location.origin).href;
        }
        catch
        {
            return window.location.origin + value;
        }
    }
    if(value.startsWith('data:'))
    {
        return /^data:image\/[a-z0-9.+-]+[,;]/i.test(value) ? value : '';
    }

    const stripped = value.replace(/\s+/g, '');
    if(!/^[A-Za-z0-9+/=]+$/.test(stripped)) return '';
    let mime = 'image/png';
    if(stripped.startsWith('/9j/')) mime = 'image/jpeg';
    else if(stripped.startsWith('R0lGOD')) mime = 'image/gif';
    else if(stripped.startsWith('UklGR')) mime = 'image/webp';
    else if(stripped.startsWith('PHN2Zy') || stripped.startsWith('PD94bWw')) mime = 'image/svg+xml';
    else if(stripped.startsWith('iVBORw0KGgo')) mime = 'image/png';
    return `data:${ mime };base64,${ stripped }`;
};

/**
 * Rejects anything that isn't an http(s) URL or a same-origin path so a
 * malicious DB value can't be a `javascript:` / `data:` / `file:` link.
 */
export const resolveNewsLink = (raw: string | null | undefined): string =>
{
    const value = (raw ?? '').trim();
    if(!value) return '';
    try
    {
        const url = new URL(value, window.location.href);
        const proto = url.protocol.toLowerCase();
        if(proto !== 'http:' && proto !== 'https:') return '';
        return url.href;
    }
    catch
    {
        return '';
    }
};
