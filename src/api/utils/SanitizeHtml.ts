import DOMPurify from 'dompurify';

// Any link that opens a new browsing context gets a safe rel so it cannot
// reverse-tabnab the opener. Registered once at module load; applies to every
// SanitizeHtml() call (and overrides any attacker-supplied rel).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const element = node as Element;

    if (element.tagName === 'A' && element.getAttribute('target')) {
        element.setAttribute('rel', 'noopener noreferrer');
    }
});

export const SanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'span', 'div', 'p', 'a', 'strong', 'em', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'src', 'alt', 'rel'],
        ALLOW_DATA_ATTR: false
    });
};
