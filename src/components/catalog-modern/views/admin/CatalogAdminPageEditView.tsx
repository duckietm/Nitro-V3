import { FC, useEffect, useState } from 'react';
import { FaLanguage, FaSave, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import { CatalogType, LocalizeText } from '../../../../api';
import { useCatalogData, useCatalogUiState, useTranslationActions, useTranslationState } from '../../../../hooks';
import { IPageEditData, useCatalogAdmin } from '../../CatalogAdminContext';

const LAYOUT_OPTIONS = [
    'default_3x3', 'frontpage4', 'pets', 'pets2', 'pets3',
    'spaces_new', 'soundmachine', 'trophies', 'roomads',
    'guild_frontpage', 'guild_forum', 'guild_custom_furni',
    'vip_buy', 'builders_club_frontpage', 'builders_club_addons', 'builders_club_loyalty', 'marketplace', 'marketplace_own_items',
    'recycler', 'recycler_info', 'recycler_prizes',
    'info_loyalty', 'badge_display', 'bots', 'single_bundle',
    'color_grouping', 'recent_purchases', 'custom_prefix'
];

const MODE_OPTIONS = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'BUILDER', label: 'Builder' },
    { value: 'BOTH', label: 'Both' }
];

export const CatalogAdminPageEditView: FC<{}> = () =>
{
    const { currentPage = null, rootNode = null } = useCatalogData();
    const { activeNodes = [], currentType = CatalogType.NORMAL } = useCatalogUiState();
    const catalogAdmin = useCatalogAdmin();
    const editingPageData = catalogAdmin?.editingPageData ?? false;
    const editingRootPage = catalogAdmin?.editingRootPage ?? false;
    const editingPageNode = catalogAdmin?.editingPageNode ?? null;
    const loading = catalogAdmin?.loading ?? false;

    const [ caption, setCaption ] = useState('');
    const [ captionSave, setCaptionSave ] = useState('');
    const [ catalogMode, setCatalogMode ] = useState<string>('NORMAL');
    const [ pageLayout, setPageLayout ] = useState('default_3x3');
    const [ iconImage, setIconImage ] = useState(0);
    const [ minRank, setMinRank ] = useState(1);
    const [ visible, setVisible ] = useState('1');
    const [ enabled, setEnabled ] = useState('1');
    const [ orderNum, setOrderNum ] = useState(0);
    const [ parentId, setParentId ] = useState(-1);
    const [ pageText1, setPageText1 ] = useState('');
    const [ showTranslate, setShowTranslate ] = useState(false);
    const [ translateTargetLanguage, setTranslateTargetLanguage ] = useState('en');
    const [ isTranslating, setIsTranslating ] = useState(false);
    const [ translateError, setTranslateError ] = useState<string | null>(null);
    const { supportedLanguages = [], languagesLoading = false } = useTranslationState();
    const { translateText, ensureSupportedLanguagesLoaded } = useTranslationActions();
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

        // The server appends " (pageId)" to the caption for mods/admins (see
        // CatalogPagesListComposer). Strip that exact suffix before seeding the
        // edit field, otherwise saving folds the id back into the stored
        // caption and it multiplies on every edit ("Wired (1114) (1114) ...").
        const rawCaption = (targetNode.localization || '').replace(new RegExp(`\\s*\\(${ targetNode.pageId }\\)\\s*$`), '');

        setCaption(rawCaption);
        setCaptionSave(targetNode.pageName || rawCaption);
        setCatalogMode(currentType === CatalogType.BUILDER ? 'BUILDER' : 'NORMAL');
        setPageLayout(currentPage?.layoutCode || 'default_3x3');
        setIconImage(targetNode.iconId ?? 0);
        setVisible(targetNode.isVisible ? '1' : '0');
        setEnabled('1');
        setMinRank(1);
        setOrderNum(0);
        const matchesLoadedPage = currentPage && targetPageId === currentPage.pageId;
        const existingText1 = matchesLoadedPage && currentPage.localization
            ? currentPage.localization.getText(0)
            : '';
        setPageText1(existingText1 || '');
        setShowTranslate(false);
        setIsTranslating(false);
        setTranslateError(null);
        const wireParentId = targetNode.parentId;
        setParentId(typeof wireParentId === 'number' && wireParentId !== -1
            ? wireParentId
            : (targetNode.parent ? targetNode.parent.pageId : -1));
    }, [ editingPageData, targetNode, currentPage, currentType ]);

    if(!editingPageData || !targetNode) return null;

    const inputClass = 'text-[11px] border-2 border-card-grid-item-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary transition-colors';

    const handleSave = async () =>
    {
        if(!catalogAdmin?.savePage) return;

        const data: IPageEditData = {
            pageId: targetPageId,
            caption,
            captionSave,
            catalogMode,
            pageLayout,
            iconImage,
            minRank,
            visible,
            enabled,
            orderNum,
            parentId,
            pageText1,
        };

        catalogAdmin.savePage(data);

        closeForm();
    };

    const openTranslate = () =>
    {
        const next = !showTranslate;
        setShowTranslate(next);
        setTranslateError(null);
        if(next) ensureSupportedLanguagesLoaded();
    };

    const runTranslate = async () =>
    {
        if(!pageText1.trim().length)
        {
            setTranslateError('Nothing to translate yet.');
            return;
        }

        if(!translateTargetLanguage)
        {
            setTranslateError('Pick a language first.');
            return;
        }

        setIsTranslating(true);
        setTranslateError(null);

        try
        {
            const result = await translateText(pageText1, translateTargetLanguage);
            setPageText1(result?.translatedText || pageText1);
            setShowTranslate(false);
        }
        catch(error)
        {
            setTranslateError((error as Error)?.message || 'Translation failed.');
        }
        finally
        {
            setIsTranslating(false);
        }
    };

    const handleDelete = async () =>
    {
        if(!catalogAdmin?.deletePage || isRoot) return;
        if(!confirm(LocalizeText('catalog.admin.delete.page.confirm', [ 'name' ], [ targetNode.localization ]))) return;

        catalogAdmin.deletePage(targetPageId);

        closeForm();
    };

    return (
        <div className="bg-white rounded border-2 border-card-grid-item-border p-2.5 mb-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
                    { isRoot ? LocalizeText('catalog.admin.edit.root') : `${ LocalizeText('catalog.admin.edit') } ${ targetNode.localization }` }
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
                <div className="flex flex-col gap-0.5 col-span-2">
                    <label className="text-[9px] text-muted uppercase font-bold">Caption Save (Localisation Key)</label>
                    <input className={ inputClass } value={ captionSave } onChange={ e => setCaptionSave(e.target.value) } />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">Icon Image</label>
                    <input className={ inputClass } min={ 0 } type="number" value={ iconImage } onChange={ e => setIconImage(parseInt(e.target.value) || 0) } />
                </div>
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">Mode</label>
                    <select className={ inputClass } value={ catalogMode } onChange={ e => setCatalogMode(e.target.value) }>
                        { MODE_OPTIONS.map(option => <option key={ option.value } value={ option.value }>{ option.label }</option>) }
                    </select>
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
                <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] text-muted uppercase font-bold">Parent ID</label>
                    <input className={ inputClass } disabled={ isRoot } type="number" value={ parentId } onChange={ e => setParentId(parseInt(e.target.value) || -1) } />
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
                <div className="flex flex-col gap-0.5 col-span-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] text-muted uppercase font-bold">Page Text 1 <span className="text-muted normal-case font-normal opacity-70">(leave blank to keep current)</span></label>
                        <button
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary border border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                            disabled={ isTranslating || !pageText1.trim().length }
                            title="Translate via Google Translate"
                            type="button"
                            onClick={ openTranslate }>
                            { isTranslating ? <FaSpinner className="text-[8px] animate-spin" /> : <FaLanguage className="text-[10px]" /> }
                            Translate
                        </button>
                    </div>
                    { showTranslate &&
                        <div className="flex items-center gap-1 mb-1 p-1 bg-gray-50 border border-card-grid-item-border rounded">
                            <select
                                className={ `${ inputClass } flex-1` }
                                disabled={ isTranslating || languagesLoading }
                                value={ translateTargetLanguage }
                                onChange={ e => setTranslateTargetLanguage(e.target.value) }>
                                { languagesLoading && !supportedLanguages.length &&
                                    <option value="">Loading languages…</option> }
                                { supportedLanguages.map(lang => (
                                    <option key={ lang.code } value={ lang.code }>{ lang.name } ({ lang.code })</option>
                                )) }
                            </select>
                            <button
                                className="px-2 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                                disabled={ isTranslating || !translateTargetLanguage || !pageText1.trim().length }
                                type="button"
                                onClick={ runTranslate }>
                                { isTranslating ? <FaSpinner className="text-[8px] animate-spin" /> : 'Apply' }
                            </button>
                            <button
                                className="px-2 py-1 rounded text-[10px] font-bold text-muted border border-card-grid-item-border hover:bg-gray-100 transition-colors cursor-pointer"
                                disabled={ isTranslating }
                                type="button"
                                onClick={ () => { setShowTranslate(false); setTranslateError(null); } }>
                                Cancel
                            </button>
                        </div> }
                    { translateError && <span className="text-[9px] text-danger">{ translateError }</span> }
                    <textarea className={ `${ inputClass } min-h-[60px] resize-y` } value={ pageText1 } onChange={ e => setPageText1(e.target.value) } />
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
