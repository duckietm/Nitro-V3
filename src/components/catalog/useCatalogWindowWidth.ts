import { type CSSProperties, type RefObject, useLayoutEffect, useMemo, useState } from 'react';

const CATALOG_WINDOW_BASE_WIDTH = 570;
const CATALOG_WINDOW_HEIGHT = 635;
const CATALOG_WINDOW_MAX_WIDTH = 1040;
// Bordi finestra (2+2) + padding contenuto card + margine ultimo tab + margine di
// sicurezza per evitare che l'ultima categoria venga clippata dall'overflow:hidden.
const CATALOG_FRAME_PADDING = 28;

/** Sum tab widths (margins INCLUDED) — never use shell.scrollWidth (infinite growth loop). */
const measureCatalogTabStripWidth = (shell: HTMLElement) => {
    const tabs = shell.querySelectorAll<HTMLElement>('.nitro-card-tab-item');
    let tabsWidth = 0;

    tabs.forEach((tab) => {
        const style = window.getComputedStyle(tab);
        const marginX = Number.parseFloat(style.marginLeft || '0') + Number.parseFloat(style.marginRight || '0');

        // offsetWidth esclude i margini: vanno sommati o l'ultima tab viene tagliata.
        tabsWidth += tab.offsetWidth + marginX;
    });

    const shellStyle = window.getComputedStyle(shell);
    const paddingX = Number.parseFloat(shellStyle.paddingLeft) + Number.parseFloat(shellStyle.paddingRight);

    return Math.ceil(tabsWidth + paddingX);
};

export const useCatalogWindowWidth = (
    tabsShellRef: RefObject<HTMLElement | null>,
    enabled: boolean,
    ...remeasureDeps: unknown[]
) => {
    const [stripWidth, setStripWidth] = useState(CATALOG_WINDOW_BASE_WIDTH);

    useLayoutEffect(() => {
        if (!enabled) return;

        const shell = tabsShellRef.current;
        if (!shell) return;

        const measure = () => {
            const needed = measureCatalogTabStripWidth(shell);
            const next = Math.min(
                CATALOG_WINDOW_MAX_WIDTH,
                Math.max(CATALOG_WINDOW_BASE_WIDTH, needed + CATALOG_FRAME_PADDING)
            );

            setStripWidth((current) => (current === next ? current : next));
        };

        measure();
        // Ri-misura dopo che font/icone delle tab hanno preso la larghezza finale
        // (al primo layout le tab possono risultare piu' strette del reale).
        const rafId = requestAnimationFrame(measure);

        const tabObserver = new ResizeObserver(measure);

        const observeTabs = () => {
            shell.querySelectorAll<HTMLElement>('.nitro-card-tab-item').forEach((tab) => {
                tabObserver.observe(tab);
            });
        };

        observeTabs();

        const listObserver = new MutationObserver(() => {
            tabObserver.disconnect();
            observeTabs();
            measure();
        });

        listObserver.observe(shell, { childList: true, subtree: false });
        window.addEventListener('resize', measure);

        return () => {
            cancelAnimationFrame(rafId);
            tabObserver.disconnect();
            listObserver.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [enabled, tabsShellRef, ...remeasureDeps]);

    return useMemo(() => {
        const width = stripWidth;

        return {
            '--nitro-catalog-window-width': `${width}px`,
            '--nitro-catalog-window-height': `${CATALOG_WINDOW_HEIGHT}px`,
            width: `${width}px`,
            minWidth: `${width}px`,
            maxWidth: `${width}px`
        } as CSSProperties;
    }, [stripWidth]);
};

export const parseCatalogTabLabel = (label: string) => {
    const trimmed = (label || '').trim();
    const match = trimmed.match(/^(.*?)(?:\s*\((\d+)\))\s*$/);

    if (!match) {
        return { name: trimmed, count: null as number | null };
    }

    const name = match[1].trim();
    const count = Number.parseInt(match[2], 10);

    return {
        name: name || trimmed,
        count: Number.isFinite(count) ? count : null
    };
};
