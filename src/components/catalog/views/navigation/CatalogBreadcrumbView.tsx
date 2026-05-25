import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import { useCatalogActions, useCatalogUiState } from '../../../../hooks';

export const CatalogBreadcrumbView: FC<{}> = () =>
{
    const { activeNodes = [] } = useCatalogUiState();
    const { activateNode } = useCatalogActions();

    if(!activeNodes || activeNodes.length === 0)
    {
        return (
            <div className="nitro-catalog-classic-breadcrumb">
                <span>{ LocalizeText('catalog.title') }</span>
            </div>
        );
    }

    return (
        <div className="nitro-catalog-classic-breadcrumb">
            { activeNodes.map((node, index) => (
                <span key={ node.pageId } className="nitro-catalog-classic-breadcrumb-segment">
                    <span className="nitro-catalog-classic-breadcrumb-separator">&rsaquo;</span>
                    <span
                        className={ `truncate ${ index === activeNodes.length - 1 ? 'font-semibold' : 'cursor-pointer hover:underline' }` }
                        onClick={ index < activeNodes.length - 1 ? () => activateNode(node) : undefined }
                    >
                        { node.localization }
                    </span>
                </span>
            )) }
        </div>
    );
};
