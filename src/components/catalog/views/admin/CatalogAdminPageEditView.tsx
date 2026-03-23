import { FC, useEffect, useState } from 'react';
import { FaSave, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useCatalog } from '../../../../hooks';
import { IPageEditData, useCatalogAdmin } from '../../CatalogAdminContext';

const LAYOUT_OPTIONS = [
    'default_3x3', 'frontpage4', 'pets', 'pets2', 'pets3',
    'spaces_new', 'soundmachine', 'trophies', 'roomads',
    'guild_frontpage', 'guild_forum', 'guild_custom_furni',
    'vip_buy', 'marketplace', 'marketplace_own_items',
    'recycler', 'recycler_info', 'recycler_prizes',
    'info_loyalty', 'badge_display', 'bots', 'single_bundle',
    'color_grouping', 'recent_purchases', 'custom_prefix'
];

export const CatalogAdminPageEditView: FC<{}> = () =>
{
    const { currentPage = null, activeNodes = [], rootNode = null } = useCatalog();
    const catalogAdmin = useCatalogAdmin();
    const editingPageData = catalogAdmin?.editingPageData ?? false;
    const editingRootPage = catalogAdmin?.editingRootPage ?? false;
    const editingPageNode = catalogAdmin?.editingPageNode ?? null;
    const loading = catalogAdmin?.loading ?? false;

    const [ caption, setCaption ] = useState('');
    const [ pageLayout, setPageLayout ] = useState('default_3x3');
    const [ minRank, setMinRank ] = useState(1);
    const [ visible, setVisible ] = useState('1');
    const [ enabled, setEnabled ] = useState('1');
    const [ orderNum, setOrderNum ] = useState(0);

    // Resolve what we're editing:
    // 1. editingPageNode (explicit node from sidebar click)
    // 2. editingRootPage (root button)
    // 3. current active page (from "Modifica Pagina" in layout)
    const targetNode = editingPageNode
        ? editingPageNode
        : editingRootPage
            ? rootNode
            : (activeNodes.length > 0 ? activeNodes[activeNodes.length - 1] : null);

    const targetPageId = targetNode?.pageId ?? currentPage?.pageId;
    const isRoot = editingRootPage;

    const closeForm = () =>
    {
        catalogAdmin?.setEditingPageData(false);
        catalogAdmin?.setEditingRootPage(false);
        catalogAdmin?.setEditingPageNode(null);
    };

    useEffect(() =>
    {
        if(!editingPageData || !targetNode) return;

        setCaption(targetNode.localization || '');
        setPageLayout(currentPage?.layoutCode || 'default_3x3');
        setVisible(targetNode.isVisible ? '1' : '0');
        setEnabled('1');
        setMinRank(1);
        setOrderNum(0);
    }, [ editingPageData, targetNode, currentPage ]);

    if(!editingPageData || !targetNode) return null;

    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors';

    const handleSave = async () =>
    {
        if(!catalogAdmin?.savePage) return;

        const parentNode = targetNode.parent;

        const data: IPageEditData = {
            pageId: targetPageId,
            caption,
            pageLayout,
            minRank,
            visible,
            enabled,
            orderNum,
            parentId: parentNode ? parentNode.pageId : -1,
        };

        const success = await catalogAdmin.savePage(data);

        if(success) closeForm();
    };

    const handleDelete = async () =>
    {
        if(!catalogAdmin?.deletePage || isRoot) return;
        if(!confirm(LocalizeText('catalog.admin.delete.page.confirm', [ 'name' ], [ targetNode.localization ]))) return;

        const success = await catalogAdmin.deletePage(targetPageId);

        if(success) closeForm();
    };

    return (
        <div className="bg-white rounded border-2 border-card-grid-item-border p-2.5 mb-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
                    { isRoot ? LocalizeText('catalog.admin.edit.root') : `${ LocalizeText('catalog.admin.edit') } ${ targetNode.localization } (#${ targetPageId })` }
                </span>
                <FaTimes className="text-muted cursor-pointer hover:text-danger text-[10px]" onClick={ closeForm } />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
                <div className="flex flex-col gap-0.5 col-span-2">
                    <label className="text-[9px] text-muted uppercase font-bold">Caption</label>
                    <input className={ inputClass } value={ caption } onChange={ e => setCaption(e.target.value) } />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">Min Rank</label>
                    <input className={ inputClass } min={ 1 } type="number" value={ minRank } onChange={ e => setMinRank(parseInt(e.target.value) || 1) } />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">Layout</label>
                    <select className={ inputClass } value={ pageLayout } onChange={ e => setPageLayout(e.target.value) }>
                        { LAYOUT_OPTIONS.map(l => <option key={ l } value={ l }>{ l }</option>) }
                    </select>
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">{ LocalizeText('catalog.admin.order') }</label>
                    <input className={ inputClass } min={ 0 } type="number" value={ orderNum } onChange={ e => setOrderNum(parseInt(e.target.value) || 0) } />
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                    <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <input className="accent-primary" checked={ visible === '1' } type="checkbox" onChange={ e => setVisible(e.target.checked ? '1' : '0') } />
                        { LocalizeText('catalog.admin.visible') }
                    </label>
                    <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <input className="accent-primary" checked={ enabled === '1' } type="checkbox" onChange={ e => setEnabled(e.target.checked ? '1' : '0') } />
                        { LocalizeText('catalog.admin.enabled') }
                    </label>
                </div>
            </div>

            <div className="flex justify-between mt-2">
                { !isRoot
                    ? <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors cursor-pointer" onClick={ handleDelete }>
                        <FaTrash className="text-[8px]" /> { LocalizeText('catalog.admin.delete') }
                    </button>
                    : <div /> }
                <button className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50" disabled={ loading } onClick={ handleSave }>
                    { loading ? <FaSpinner className="text-[8px] animate-spin" /> : <FaSave className="text-[8px]" /> } { LocalizeText('catalog.admin.save') }
                </button>
            </div>
        </div>
    );
};
