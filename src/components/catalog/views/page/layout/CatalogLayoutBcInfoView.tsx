import { FC } from 'react';
import { SanitizeHtml } from '../../../../../api';
import { CatalogLayoutProps } from './CatalogLayout.types';

// Info/landing layout: a big logo box (70% of the page height) on top and a
// smaller box below holding the page text in black. Logo = page headline
// image (getImage(0)), text = page text 1 (getText(0)). Set both from
// catalog admin (Gestione -> Modifica pagina).
export const CatalogLayoutBcInfoView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const logo = page?.localization?.getImage(0) || '';
    const text = page?.localization?.getText(0) || '';

    return (
        <div className="flex flex-col h-full gap-2">
            <div
                className="bg-white rounded border border-card-grid-item-border flex items-center justify-center overflow-hidden"
                style={ { height: '70%' } }>
                { logo
                    ? <img alt="" className="max-h-full max-w-full object-contain" src={ logo } />
                    : <span className="text-muted text-[11px]">Logo — imposta l'immagine headline da Gestione</span> }
            </div>
            <div className="flex-1 min-h-0 bg-white rounded border border-card-grid-item-border p-3 overflow-auto">
                <div
                    className="text-black text-[12px] leading-snug"
                    dangerouslySetInnerHTML={ { __html: SanitizeHtml(text) } } />
            </div>
        </div>
    );
};
