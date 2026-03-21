import { FC } from 'react';
import { FaChevronRight, FaHome } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';

export const CatalogBreadcrumbView: FC<{}> = () =>
{
    const { activeNodes = [], activateNode } = useCatalog();

    if(!activeNodes || activeNodes.length === 0)
    {
        return (
            <div className="flex items-center gap-1.5 text-xs text-catalog-text-muted">
                <FaHome className="text-[10px]" />
                <span>{ LocalizeText('catalog.title') }</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 text-[11px] text-catalog-text-muted overflow-hidden min-w-0">
            <FaHome
                className="text-[10px] cursor-pointer hover:text-catalog-accent transition-colors shrink-0"
                onClick={ () => activateNode(activeNodes[0]) }
            />
            { activeNodes.map((node, i) => (
                <span key={ node.pageId } className="flex items-center gap-1 min-w-0">
                    <FaChevronRight className="text-[7px] opacity-30 shrink-0" />
                    <span
                        className={ `truncate ${ i === activeNodes.length - 1 ? 'text-catalog-text font-semibold' : 'cursor-pointer hover:text-catalog-accent transition-colors' }` }
                        onClick={ i < activeNodes.length - 1 ? () => activateNode(node) : undefined }
                    >
                        { node.localization }
                    </span>
                </span>
            )) }
        </div>
    );
};
