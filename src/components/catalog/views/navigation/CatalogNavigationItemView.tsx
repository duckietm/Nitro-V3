import { FC, useCallback, useRef, useState } from 'react';
import { FaArrowsAlt, FaCaretDown, FaCaretUp, FaPlus, FaStar, FaTrash } from 'react-icons/fa';
import { ICatalogNode, LocalizeText } from '../../../../api';
import { useCatalog, useCatalogFavorites } from '../../../../hooks';
import { useCatalogAdmin } from '../../CatalogAdminContext';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const adminMode = catalogAdmin?.adminMode ?? false;
    const { isFavoritePage, toggleFavoritePage } = useCatalogFavorites();
    const isFav = node ? isFavoritePage(node.pageId) : false;
    const [ isDragOver, setIsDragOver ] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    const handleDragStart = useCallback((e: React.DragEvent) =>
    {
        if(!adminMode) return;

        e.dataTransfer.setData('text/plain', JSON.stringify({ pageId: node.pageId, parentId: node.parent?.pageId ?? -1 }));
        e.dataTransfer.effectAllowed = 'move';
    }, [ adminMode, node ]);

    const handleDragOver = useCallback((e: React.DragEvent) =>
    {
        if(!adminMode) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    }, [ adminMode ]);

    const handleDragLeave = useCallback(() =>
    {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) =>
    {
        if(!adminMode) return;

        e.preventDefault();
        setIsDragOver(false);

        try
        {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));

            if(data.pageId && data.pageId !== node.pageId)
            {
                // Drop onto a branch = reparent under this node
                // Drop onto a leaf = reorder as sibling
                const targetParentId = node.isBranch ? node.pageId : (node.parent?.pageId ?? -1);
                const targetIndex = node.isBranch ? 0 : (node.parent?.children?.indexOf(node) ?? 0);

                catalogAdmin?.reorderPage(data.pageId, targetParentId, targetIndex);
            }
        }
        catch(err)
        {
            // Invalid drag data
        }
    }, [ adminMode, node, catalogAdmin ]);

    return (
        <div className={ child ? 'pl-1.5 ml-1.5 border-l-2 border-card-grid-item-border' : '' }>
            <div
                ref={ dragRef }
                className={ `group/nav flex items-center gap-1.5 px-1.5 py-[3px] mx-0.5 rounded cursor-pointer transition-all duration-100 text-[11px] ${ node.isActive ? 'bg-card-grid-item-active border border-card-grid-item-border-active shadow-inner1px font-bold' : 'border border-transparent hover:bg-card-grid-item-active' } ${ isDragOver ? 'ring-2 ring-primary ring-offset-1 bg-primary/10' : '' }` }
                draggable={ adminMode }
                onClick={ () => activateNode(node) }
                onDragLeave={ adminMode ? handleDragLeave : undefined }
                onDragOver={ adminMode ? handleDragOver : undefined }
                onDragStart={ adminMode ? handleDragStart : undefined }
                onDrop={ adminMode ? handleDrop : undefined }
            >
                { adminMode &&
                    <FaArrowsAlt className="text-[7px] text-muted cursor-grab shrink-0 opacity-0 group-hover/nav:opacity-60" /> }
                <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                    <CatalogIconView icon={ node.iconId } />
                </div>
                <span className="flex-1 truncate" title={ adminMode ? `Page ID: ${ node.pageId }` : undefined }>{ node.localization }</span>
                { adminMode &&
                    <div className="flex items-center gap-1 opacity-0 group-hover/nav:opacity-100 transition-opacity">
                        <FaPlus
                            className="text-[8px] text-success hover:text-green-800"
                            title={ LocalizeText('catalog.admin.create.subpage') }
                            onClick={ e =>
                            {
                                e.stopPropagation();
                                catalogAdmin.createPage({
                                    caption: 'New Page',
                                    pageLayout: 'default_3x3',
                                    minRank: 1,
                                    visible: '1',
                                    enabled: '1',
                                    orderNum: 0,
                                    parentId: node.pageId,
                                });
                            } }
                        />
                        <FaTrash
                            className="text-[8px] text-danger hover:text-red-700"
                            title={ LocalizeText('catalog.admin.delete.page') }
                            onClick={ e =>
                            {
                                e.stopPropagation();
                                if(confirm(LocalizeText('catalog.admin.delete.page.confirm', [ 'name' ], [ node.localization ])))
                                {
                                    catalogAdmin.deletePage(node.pageId);
                                }
                            } }
                        />
                    </div> }
                { !adminMode && node.pageId > 0 &&
                    <FaStar
                        className={ `text-[8px] transition-all duration-100 cursor-pointer shrink-0 ${ isFav ? 'text-warning opacity-100' : 'text-muted opacity-0 group-hover/nav:opacity-100 hover:text-warning' }` }
                        onClick={ e => { e.stopPropagation(); toggleFavoritePage(node.pageId); } }
                    /> }
                { node.isBranch &&
                    <span className="text-[9px] text-muted shrink-0">
                        { node.isOpen ? <FaCaretUp /> : <FaCaretDown /> }
                    </span> }
            </div>
            { node.isOpen && node.isBranch &&
                <CatalogNavigationSetView child={ true } node={ node } /> }
        </div>
    );
};
