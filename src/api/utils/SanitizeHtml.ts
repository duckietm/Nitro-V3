import DOMPurify from 'dompurify';

export const SanitizeHtml = (html: string): string =>
{
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [ 'b', 'i', 'u', 'br', 'span', 'div', 'p', 'a', 'strong', 'em', 'img' ],
        ALLOWED_ATTR: [ 'href', 'target', 'class', 'style', 'src', 'alt' ],
        ALLOW_DATA_ATTR: false
    });
};
