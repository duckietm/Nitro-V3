import { FC, useEffect } from 'react';
import { SanitizeHtml } from '../../../../../api';
import { CatalogLayoutProps } from './CatalogLayout.types';

// Info/landing layout: a logo box on top (image scaled to fit the available
// space, no crop) and a smaller box below with the page text in black.
// Logo = page headline image (getImage(0)), text = page text 1 (getText(0)),
// set from catalog admin (Gestione -> Modifica pagina). Hides the (empty)
// navigation sidebar so the content uses the full width.
export const CatalogLayoutBcInfoView: FC<CatalogLayoutProps> = (props) => {
    const { page = null, hideNavigation = null } = props;

    const logo = page?.localization?.getImage(0) || '';
    const text = page?.localization?.getText(0) || '';

    useEffect(() => {
        hideNavigation?.();
    }, [page, hideNavigation]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex-1 min-h-0 bg-white rounded border border-card-grid-item-border overflow-hidden flex items-center justify-center">
                {logo ? (
                    <img alt="" className="max-w-full max-h-full object-contain" src={logo} />
                ) : (
                    <span className="text-muted text-[11px]">Logo — imposta l'immagine headline da Gestione</span>
                )}
            </div>
            <div className="shrink-0 max-h-[32%] bg-white rounded border border-card-grid-item-border p-3 overflow-auto">
                <div className="text-black text-[12px] leading-snug" dangerouslySetInnerHTML={{ __html: SanitizeHtml(text) }} />
            </div>
        </div>
    );
};
