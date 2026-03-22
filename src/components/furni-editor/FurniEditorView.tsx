import { AddLinkEventTracker, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useFurniEditor } from '../../hooks/furni-editor';
import { FurniEditorCreateView } from './views/FurniEditorCreateView';
import { FurniEditorEditView } from './views/FurniEditorEditView';
import { FurniEditorSearchView } from './views/FurniEditorSearchView';

const TAB_SEARCH = 0;
const TAB_EDIT = 1;
const TAB_CREATE = 2;

export const FurniEditorView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState(TAB_SEARCH);
    const pendingEditRef = useRef(false);

    const {
        items, total, page, loading, error, clearError,
        selectedItem, catalogItems, furniDataEntry,
        interactions,
        searchItems, loadDetail, loadBySpriteId, updateItem, createItem, deleteItem, loadInteractions
    } = useFurniEditor();

    useEffect(() =>
    {
        if(selectedItem && pendingEditRef.current)
        {
            pendingEditRef.current = false;
            setActiveTab(TAB_EDIT);
        }
    }, [ selectedItem ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                if(!GetSessionDataManager().isModerator) return;

                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'furni-editor/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(isVisible) loadInteractions();
    }, [ isVisible ]);

    useEffect(() =>
    {
        const handler = (e: CustomEvent<{ spriteId: number }>) =>
        {
            if(!GetSessionDataManager().isModerator) return;

            const { spriteId } = e.detail;

            if(!Number.isFinite(spriteId) || spriteId < 0) return;

            pendingEditRef.current = true;
            loadBySpriteId(spriteId);
        };

        window.addEventListener('furni-editor:open', handler as EventListener);

        return () => window.removeEventListener('furni-editor:open', handler as EventListener);
    }, [ loadBySpriteId ]);

    const handleSelect = useCallback((id: number) =>
    {
        pendingEditRef.current = true;
        loadDetail(id);
    }, [ loadDetail ]);

    const handleBack = useCallback(() =>
    {
        setActiveTab(TAB_SEARCH);
    }, []);

    const handleClose = useCallback(() =>
    {
        setIsVisible(false);
    }, []);

    const isMod = useMemo(() => GetSessionDataManager().isModerator, []);

    if(!isVisible || !isMod) return null;

    return (
        <NitroCardView uniqueKey="furni-editor" className="w-[620px] h-[520px]">
            <NitroCardHeaderView headerText="Furni Editor" onCloseClick={ handleClose } />
            <NitroCardTabsView>
                <NitroCardTabsItemView isActive={ activeTab === TAB_SEARCH } onClick={ () => setActiveTab(TAB_SEARCH) }>
                    Search
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === TAB_EDIT } onClick={ () => selectedItem && setActiveTab(TAB_EDIT) }>
                    Edit
                </NitroCardTabsItemView>
                <NitroCardTabsItemView isActive={ activeTab === TAB_CREATE } onClick={ () => setActiveTab(TAB_CREATE) }>
                    Create
                </NitroCardTabsItemView>
            </NitroCardTabsView>
            <NitroCardContentView>
                { error &&
                    <div className="bg-[#f8d7da] border border-[#f5c6cb] rounded p-2 text-[#721c24] text-xs mb-1 flex justify-between items-center">
                        <span>{ error }</span>
                        <span className="cursor-pointer font-bold" onClick={ clearError }>x</span>
                    </div>
                }

                { activeTab === TAB_SEARCH &&
                    <FurniEditorSearchView
                        items={ items }
                        total={ total }
                        page={ page }
                        loading={ loading }
                        onSearch={ searchItems }
                        onSelect={ handleSelect }
                    />
                }

                { activeTab === TAB_EDIT && selectedItem &&
                    <FurniEditorEditView
                        item={ selectedItem }
                        catalogItems={ catalogItems }
                        furniDataEntry={ furniDataEntry }
                        interactions={ interactions }
                        loading={ loading }
                        onUpdate={ updateItem }
                        onDelete={ deleteItem }
                        onBack={ handleBack }
                        onRefresh={ loadDetail }
                    />
                }

                { activeTab === TAB_CREATE &&
                    <FurniEditorCreateView
                        interactions={ interactions }
                        loading={ loading }
                        onCreate={ createItem }
                        onBack={ handleBack }
                    />
                }

            </NitroCardContentView>
        </NitroCardView>
    );
};
