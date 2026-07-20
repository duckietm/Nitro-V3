const MAX_COPY_LENGTH = 65536;

export const CopyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof text !== 'string' || !text.length || (text.length > MAX_COPY_LENGTH)) return false;

    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
        }
    }

    const previousFocus = document.activeElement;
    const textarea = document.createElement('textarea');

    try {
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.tabIndex = -1;
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        textarea.remove();

        if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }
};
